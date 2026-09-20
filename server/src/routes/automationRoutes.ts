import { Router, Response } from 'express';
import { automationService } from '../services/automationService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { category } = req.query;
    const data = await automationService.getWorkflows(req.user!.tenantId, category as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/approvals/pending', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await automationService.getPendingApprovals(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/approvals/:id/decide', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { decision, remarks } = req.body;
    if (!decision || !['approved', 'rejected'].includes(decision)) {
      throw new Error('decision must be approved or rejected');
    }

    const approvalId = req.params.id as string;
    const result = await automationService.decideApproval(
      req.user!.tenantId,
      approvalId,
      decision,
      req.user!.fullNameBn,
      remarks
    );

    await logAudit(
      req,
      'DECIDE_WORKFLOW_APPROVAL',
      'workflow_approval',
      approvalId,
      `স্বয়ংক্রিয় কাজের অনুমোদন সিদ্ধান্ত: ${decision === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/executions/recent', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await automationService.getExecutions(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/compile-natural-language', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) throw new Error('prompt is required');

    const result = await automationService.compileNaturalLanguageWorkflow(req.user!.tenantId, prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const workflowId = req.params.id as string;
    const data = await automationService.getWorkflowById(req.user!.tenantId, workflowId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('super_admin', 'madrasa_admin'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await automationService.createWorkflow(req.user!.tenantId, req.body);
    await logAudit(req, 'CREATE_WORKFLOW', 'workflow', result.id, `নতুন ওয়ার্কফ্লো তৈরি করা হয়েছে: ${result.name}`);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/toggle', authenticate, requireRole('super_admin', 'madrasa_admin'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const workflowId = req.params.id as string;
    const { isActive } = req.body;
    const result = await automationService.toggleWorkflow(req.user!.tenantId, workflowId, Boolean(isActive));
    await logAudit(req, 'TOGGLE_WORKFLOW', 'workflow', workflowId, `ওয়ার্কফ্লো সক্রিয়তা পরিবর্তন: ${isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/trigger', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const workflowId = req.params.id as string;
    const result = await automationService.triggerWorkflow(req.user!.tenantId, workflowId, req.body);
    await logAudit(req, 'TRIGGER_WORKFLOW', 'workflow', workflowId, `ম্যানুয়ালি ওয়ার্কফ্লো পরিচালনা করা হয়েছে (Execution ID: ${result.executionId})`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
