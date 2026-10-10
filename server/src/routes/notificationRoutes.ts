import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { notificationRouter } from '../services/notification/notificationRouter.js';
import { triggerEngine } from '../services/notification/triggerEngine.js';
import { smsAdapter } from '../services/notification/adapters/smsAdapter.js';
import { BroadcastNotificationRequest } from '../types/index.js';

const router = Router();

/**
 * POST /api/v1/notifications/broadcast
 * Broadcast notification with safety guard (>50 recipients halts and transitions to pending_approval).
 */
router.post('/broadcast', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const body: BroadcastNotificationRequest = req.body;
    const recipients = body.recipients || [];
    const content = body.content || '';
    const channels = body.channels;
    const preferredChannel = body.preferredChannel;
    const templateName = body.templateName;
    const metadata = body.metadata || {};

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RECIPIENTS',
          message: 'কমপক্ষে একজন প্রাপকের তথ্য প্রদান আবশ্যক (At least one recipient is required).'
        }
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_CONTENT',
          message: 'বার্তার বিষয়বস্তু বা কনটেন্ট খালি রাখা যাবে না (Content cannot be empty).'
        }
      });
    }

    const tenantId = req.user?.tenantId || 'inst_main';
    const now = new Date().toISOString();

    // Human-in-the-Loop Threshold Guard: > 50 recipients MUST NOT execute immediately
    if (recipients.length > 50) {
      const approvalId = `appr_bcast_${uuidv4().slice(0, 8)}`;
      const executionId = `exec_bcast_${uuidv4().slice(0, 8)}`;

      // Ensure broadcast workflow exists
      await db.run(
        `INSERT OR IGNORE INTO workflows (
          id, tenant_id, name, description, category, trigger_type, is_active, definition_json, created_at
        ) VALUES (
          'wf_mass_broadcast', ?, 'গণ-বিজ্ঞপ্তি সম্প্রচার (Mass Broadcast)',
          '৫০ জনের অধিক প্রাপকের কাছে নোটিশ প্রেরণের পূর্বে মুহতামিম অনুমোদন',
          'general', 'manual', 1, '{}', ?
        )`,
        [tenantId, now]
      );

      // Create workflow execution
      await db.run(
        `INSERT INTO workflow_executions (
          id, tenant_id, workflow_id, workflow_name, status, started_at, logs_json
        ) VALUES (?, ?, 'wf_mass_broadcast', 'গণ-বিজ্ঞপ্তি সম্প্রচার (Mass Broadcast)', 'waiting_approval', ?, ?)`,
        [
          executionId,
          tenantId,
          now,
          JSON.stringify([
            {
              timestamp: now,
              nodeTitle: 'গণ-বিজ্ঞপ্তি রিকোয়েস্ট',
              status: 'info',
              message: `${recipients.length} জন প্রাপকের নিকট গণ-বিজ্ঞপ্তি প্রেরণের অনুরোধ জমা হয়েছে। নিরাপত্তা সীমার কারণে অনুমোদনের জন্য অপেক্ষমাণ রাখা হলো।`
            }
          ])
        ]
      );

      const actionPayload = {
        recipients,
        content,
        channels,
        preferredChannel,
        templateName,
        metadata,
        recipientCount: recipients.length,
        requestedBy: req.user?.fullNameBn || req.user?.username || 'অজ্ঞাত ব্যবহারকারী',
        requestedByUserId: req.user?.userId
      };

      // Create workflow approval record with status 'pending_approval'
      await db.run(
        `INSERT INTO workflow_approvals (
          id, tenant_id, execution_id, workflow_name, title, description,
          required_role, action_payload_json, status, created_at
        ) VALUES (?, ?, ?, 'গণ-বিজ্ঞপ্তি সম্প্রচার (Mass Broadcast)', ?, ?, 'madrasa_admin', ?, 'pending_approval', ?)`,
        [
          approvalId,
          tenantId,
          executionId,
          `মুহতামিম কর্তৃক গণ-বিজ্ঞপ্তি অনুমোদন আবশ্যক (${recipients.length} জন প্রাপক)`,
          `৫০ জনের অধিক (${recipients.length} জন) প্রাপকের নিকট নোটিশ প্রেরণের পূর্বে দায়িত্বশীল মুহতামিমের অনুমোদন আবশ্যক।`,
          JSON.stringify(actionPayload),
          now
        ]
      );

      return res.status(200).json({
        status: 'pending_approval',
        approvalId,
        recipientCount: recipients.length,
        message: '৫০ জনের অধিক প্রাপক থাকায় বার্তাটি মুহতামিমের অনুমোদনের জন্য অপেক্ষমাণ রাখা হয়েছে।'
      });
    }

    // Direct dispatch for <= 50 recipients
    const batchSummary = await notificationRouter.dispatchBatch({
      recipients,
      message: content,
      channels,
      preferredChannel,
      templateName,
      metadata
    });

    return res.status(200).json({
      status: 'dispatched',
      sentCount: batchSummary.sentCount,
      recipientCount: recipients.length,
      failedCount: batchSummary.failedCount,
      results: batchSummary.results
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/notifications/approvals
 * Lists pending mass broadcast approvals.
 */
router.get('/approvals', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const rows = await db.all<any>(
      `SELECT * FROM workflow_approvals 
       WHERE tenant_id = ? AND status IN ('pending', 'pending_approval')
       ORDER BY created_at DESC`,
      [tenantId]
    );

    const approvals = rows.map((r) => {
      let actionPayload: any = {};
      try {
        actionPayload = JSON.parse(r.action_payload_json || '{}');
      } catch {
        actionPayload = {};
      }
      return {
        id: r.id,
        tenantId: r.tenant_id,
        executionId: r.execution_id,
        workflowName: r.workflow_name,
        title: r.title,
        description: r.description,
        requiredRole: r.required_role,
        status: r.status,
        createdAt: r.created_at,
        actionPayload
      };
    });

    res.json({
      success: true,
      approvals
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/approvals/:id/approve
 * Approves a pending mass broadcast and executes queued batch dispatch. (Admin/Muhtamim only)
 */
router.post(
  '/approvals/:id/approve',
  authenticate,
  requireRole('madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const approvalId = req.params.id as string;
      const tenantId = req.user?.tenantId || 'inst_main';

      const approval = await db.get<any>(
        `SELECT * FROM workflow_approvals WHERE id = ? AND tenant_id = ?`,
        [approvalId, tenantId]
      );

      if (!approval) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'APPROVAL_NOT_FOUND',
            message: 'অনুমোদনের অনুরোধটি খুঁজে পাওয়া যায়নি (Approval record not found).'
          }
        });
      }

      if (approval.status === 'approved') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_APPROVED',
            message: 'এই বিজ্ঞপ্তিটি ইতিমধ্যে অনুমোদিত ও প্রেরিত হয়েছে।'
          }
        });
      }

      let payload: any = {};
      try {
        payload = JSON.parse(approval.action_payload_json || '{}');
      } catch {
        payload = {};
      }

      const recipients: string[] = payload.recipients || [];
      const content: string = payload.content || payload.message || '';
      const channels = payload.channels;
      const preferredChannel = payload.preferredChannel;
      const templateName = payload.templateName;
      const metadata = payload.metadata || {};

      // Execute the mass dispatch
      const batchSummary = await notificationRouter.dispatchBatch({
        recipients,
        message: content,
        channels,
        preferredChannel,
        templateName,
        metadata
      });

      const now = new Date().toISOString();

      // Update approval record
      await db.run(
        `UPDATE workflow_approvals 
         SET status = 'approved', decided_by = ?, decided_at = ? 
         WHERE id = ?`,
        [req.user?.fullNameBn || req.user?.userId || 'Muhtamim', now, approvalId]
      );

      // Update execution record
      if (approval.execution_id) {
        await db.run(
          `UPDATE workflow_executions 
           SET status = 'completed', finished_at = ? 
           WHERE id = ?`,
          [now, approval.execution_id]
        );
      }

      return res.status(200).json({
        status: 'dispatched',
        approvalId,
        sentCount: batchSummary.sentCount,
        recipientCount: recipients.length,
        failedCount: batchSummary.failedCount,
        message: 'গণ-বিজ্ঞপ্তি সফলভাবে অনুমোদিত এবং সকল প্রাপকের কাছে প্রেরিত হয়েছে।',
        results: batchSummary.results
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/notifications/telemetry
 * Returns live adapter telemetry: credit balance, active sessions, Brevo quota.
 */
router.get('/telemetry', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const telemetry = await notificationRouter.getTelemetry();
    res.json({
      success: true,
      telemetry
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/triggers/evaluate
 * Evaluates pre-built automation rules on demand.
 */
router.post('/triggers/evaluate', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { rule, options = {} } = req.body;
    const tenantId = req.user?.tenantId || 'inst_main';
    const evalOptions = { tenantId, ...options };

    let result: any;
    if (rule && rule !== 'all') {
      result = await triggerEngine.evaluateRule(rule, evalOptions);
    } else {
      result = await triggerEngine.evaluateAllRules(evalOptions);
    }

    res.json({
      success: true,
      rule: rule || 'all',
      result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/voice-broadcast
 * Broadcasts Voice SMS / Audio alert message.
 */
router.post('/voice-broadcast', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { recipients, audioUrlOrTtsText, title } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RECIPIENTS', message: 'কমপক্ষে একজন প্রাপকের নম্বর আবশ্যক।' }
      });
    }
    if (!audioUrlOrTtsText) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_AUDIO', message: 'ভয়েস টেক্সট বা অডিও লিংক আবশ্যক।' }
      });
    }

    const userId = req.user?.userId || 'usr_admin';
    const result = await smsAdapter.sendVoiceBroadcast(recipients, audioUrlOrTtsText, title, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/sms/send-brevo
 * Sends free transactional SMS via Brevo adapter.
 */
router.post('/sms/send-brevo', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'প্রাপকের নম্বর এবং বার্তা আবশ্যক।' }
      });
    }
    const result = await smsAdapter.send(to, message, { provider: 'brevo' });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});


router.get('/:noticeId/delivery-log', async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM notice_delivery_logs WHERE notice_id = ? ORDER BY sent_at DESC', [req.params.noticeId]);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:noticeId/delivery-log', async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM notice_delivery_logs WHERE notice_id = ? ORDER BY sent_at DESC', [req.params.noticeId]);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
