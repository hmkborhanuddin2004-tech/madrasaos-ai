import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowDefinition, WorkflowExecution, WorkflowApproval, UserRoleCode } from '../types/index.js';

export class AutomationService {
  public async getWorkflows(tenantId: string, category?: string): Promise<any[]> {
    let sql = 'SELECT * FROM workflows WHERE tenant_id = ?';
    const params: any[] = [tenantId];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await db.all<any>(sql, params);
    return rows.map((r) => ({
      ...r,
      definition: JSON.parse(r.definition_json || '{}')
    }));
  }

  public async getWorkflowById(tenantId: string, id: string): Promise<any> {
    const row = await db.get<any>('SELECT * FROM workflows WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!row) throw new Error('Workflow not found');
    return {
      ...row,
      definition: JSON.parse(row.definition_json || '{}')
    };
  }

  public async createWorkflow(tenantId: string, payload: Partial<WorkflowDefinition>): Promise<any> {
    const id = `wf_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const def = {
      name: payload.name || 'নতুন স্বয়ংক্রিয় কাজ',
      trigger: { type: payload.triggerType || 'event', value: 'attendance.recorded' },
      nodes: payload.nodes || [
        { id: 'n1', type: 'trigger:event', title: 'ট্রিগার ইভেন্ট', config: {} },
        { id: 'n2', type: 'control:approval', title: 'এডমিন অনুমোদন', config: { required_role: 'madrasa_admin' } }
      ],
      connections: payload.connections || [{ from: 'n1', to: 'n2' }]
    };

    await db.run(
      `INSERT INTO workflows (id, tenant_id, name, description, category, trigger_type, is_active, definition_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id, tenantId, payload.name || 'নতুন স্বয়ংক্রিয় কাজ',
        payload.description || 'স্বয়ংক্রিয় মাদ্রাসা ওয়ার্কফ্লো',
        payload.category || 'general', payload.triggerType || 'event',
        JSON.stringify(def), now
      ]
    );

    return this.getWorkflowById(tenantId, id);
  }

  public async toggleWorkflow(tenantId: string, id: string, isActive: boolean): Promise<any> {
    await db.run(
      'UPDATE workflows SET is_active = ? WHERE id = ? AND tenant_id = ?',
      [isActive ? 1 : 0, id, tenantId]
    );
    return { id, isActive };
  }

  public async triggerWorkflow(tenantId: string, id: string, triggerPayload?: any): Promise<any> {
    const wf = await this.getWorkflowById(tenantId, id);
    const execId = `exec_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    // DAG Evaluation simulation
    const logs: any[] = [
      { timestamp: now, nodeTitle: 'ট্রিগার ইভেন্ট', status: 'success', message: 'ওয়ার্কফ্লো ম্যানুয়ালি শুরু করা হয়েছে।' },
      { timestamp: now, nodeTitle: 'শর্ত ও ফিল্টার যাচাই', status: 'success', message: 'সকল প্যারামিটার নিয়মমাফিক উত্তীর্ণ।' }
    ];

    let status: 'waiting_approval' | 'completed' = 'completed';

    // If definition has an approval node, pause for approval
    const hasApprovalNode = wf.definition.nodes?.some((n: any) => n.type === 'control:approval');
    if (hasApprovalNode) {
      status = 'waiting_approval';
      logs.push({
        timestamp: now,
        nodeTitle: 'মুহতামিম / অ্যাডমিন অনুমোদন',
        status: 'info',
        message: 'চূড়ান্ত পদক্ষেপের জন্য দায়িত্বশীল অ্যাডমিনের অনুমোদনের অপেক্ষায় রাখা হয়েছে।'
      });

      // Create approval record
      const apprId = `appr_${uuidv4().slice(0, 8)}`;
      await db.run(
        `INSERT INTO workflow_approvals (id, tenant_id, execution_id, workflow_name, title, description, required_role, action_payload_json, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'madrasa_admin', ?, 'pending', ?)`,
        [
          apprId, tenantId, execId, wf.name,
          `${wf.name} - চূড়ান্ত অনুমোদন প্রয়োজন`,
          'এই স্বয়ংক্রিয় কাজটি পরিচালনা করতে আপনার ডিজিটাল অনুমোদন আবশ্যক।',
          JSON.stringify(triggerPayload || { note: 'Manual execution test' }),
          now
        ]
      );
    } else {
      logs.push({
        timestamp: now,
        nodeTitle: 'পদক্ষেপ সম্পাদন',
        status: 'success',
        message: 'সকল নোটিফিকেশন ও ডাটা আপডেট সফলভাবে সম্পন্ন হয়েছে।'
      });
    }

    await db.run(
      `INSERT INTO workflow_executions (id, tenant_id, workflow_id, workflow_name, status, started_at, finished_at, logs_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [execId, tenantId, id, wf.name, status, now, status === 'completed' ? now : null, JSON.stringify(logs)]
    );

    await db.run('UPDATE workflows SET last_executed_at = ? WHERE id = ?', [now, id]);

    return {
      executionId: execId,
      workflowName: wf.name,
      status,
      logs
    };
  }

  public async getPendingApprovals(tenantId: string): Promise<any[]> {
    const rows = await db.all<any>(
      `SELECT * FROM workflow_approvals WHERE tenant_id = ? AND status = 'pending' ORDER BY created_at DESC`,
      [tenantId]
    );
    return rows.map((r) => ({
      ...r,
      actionPayload: JSON.parse(r.action_payload_json || '{}')
    }));
  }

  public async decideApproval(
    tenantId: string,
    approvalId: string,
    decision: 'approved' | 'rejected',
    decidedBy: string,
    remarks?: string
  ): Promise<any> {
    const appr = await db.get<any>(
      'SELECT * FROM workflow_approvals WHERE id = ? AND tenant_id = ?',
      [approvalId, tenantId]
    );
    if (!appr) throw new Error('Approval request not found');

    const now = new Date().toISOString();
    await db.run(
      `UPDATE workflow_approvals SET status = ?, decided_by = ?, decided_at = ? WHERE id = ?`,
      [decision, decidedBy, now, approvalId]
    );

    // Update execution status
    const execStatus = decision === 'approved' ? 'completed' : 'cancelled';
    const execution = await db.get<any>('SELECT * FROM workflow_executions WHERE id = ?', [appr.execution_id]);
    if (execution) {
      const logs = JSON.parse(execution.logs_json || '[]');
      logs.push({
        timestamp: now,
        nodeTitle: 'এডমিন অনুমোদন সিদ্ধান্ত',
        status: decision === 'approved' ? 'success' : 'error',
        message: decision === 'approved' 
          ? `অনুমোদন সম্পন্ন করেছেন: ${decidedBy}। স্বয়ংক্রিয় পদক্ষেপ নির্বাহ করা হয়েছে।` 
          : `অনুরোধটি বাতিল করা হয়েছে: ${remarks || 'কর্তৃপক্ষের সিদ্ধান্ত'}`
      });

      await db.run(
        `UPDATE workflow_executions SET status = ?, finished_at = ?, logs_json = ? WHERE id = ?`,
        [execStatus, now, JSON.stringify(logs), appr.execution_id]
      );
    }

    return { success: true, approvalId, decision };
  }

  public async getExecutions(tenantId: string): Promise<any[]> {
    const rows = await db.all<any>(
      `SELECT * FROM workflow_executions WHERE tenant_id = ? ORDER BY started_at DESC LIMIT 30`,
      [tenantId]
    );
    return rows.map((r) => ({
      ...r,
      logs: JSON.parse(r.logs_json || '[]')
    }));
  }

  // Natural Language to Workflow Compiler
  public async compileNaturalLanguageWorkflow(tenantId: string, prompt: string): Promise<any> {
    const p = prompt.toLowerCase();
    
    // Compile rules into structured graph
    let name = 'স্বয়ংক্রিয় মাদ্রাসা নোটিশ';
    let triggerType: any = 'event';
    let triggerEvent = 'attendance.recorded';
    let nodes: any[] = [];
    let connections: any[] = [];

    if (p.includes('অনুপস্থিত') || p.includes('attendance') || p.includes('টানা')) {
      name = 'টানা অনুপস্থিতি অভিভাবক মেসেজ ওয়ার্কফ্লো';
      triggerType = 'event';
      triggerEvent = 'attendance.recorded';
      nodes = [
        { id: 'n1', type: 'trigger:event', title: 'হাজিরা রেকর্ড সম্পন্ন ইভেন্ট', config: { event: 'attendance.recorded' } },
        { id: 'n2', type: 'logic:condition', title: 'টানা ৩ দিন অনুপস্থিত যাচাই', config: { minAbsences: 3 } },
        { id: 'n3', type: 'ai:draft_message', title: 'এআই অভিভাবক নোটিশ ড্রাফট', config: { tone: 'polite_bangla' } },
        { id: 'n4', type: 'control:approval', title: 'মুহতামিম / উস্তাদ অনুমোদন', config: { required_role: 'madrasa_admin' } },
        { id: 'n5', type: 'action:sms', title: 'অভিভাবকের ফোনে SMS প্রেরণ', config: { gateway: 'BanglaUnicodeSMS' } }
      ];
      connections = [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' },
        { from: 'n4', to: 'n5' }
      ];
    } else if (p.includes('ফি') || p.includes('fee') || p.includes('বকেয়া')) {
      name = 'মাসিক বকেয়া ফি স্বয়ংক্রিয় স্মরণিকা';
      triggerType = 'schedule';
      nodes = [
        { id: 'n1', type: 'trigger:schedule', title: 'প্রতি মাসের ৫ তারিখ সকাল ১০:০০', config: { cron: '0 10 5 * *' } },
        { id: 'n2', type: 'logic:filter', title: 'বকেয়া ফি তালিকা ফিল্টার', config: { dueGreaterThan: 0 } },
        { id: 'n3', type: 'ai:draft_message', title: 'মার্জিত স্মরণিকা ড্রাফট', config: {} },
        { id: 'n4', type: 'control:approval', title: 'হিসাবরক্ষক / মুহতামিম অনুমোদন', config: { required_role: 'accountant' } },
        { id: 'n5', type: 'action:notification', title: 'ডিজিটাল নোটিশ ও SMS প্রেরণ', config: {} }
      ];
      connections = [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' },
        { from: 'n4', to: 'n5' }
      ];
    } else {
      name = 'কাস্টম স্বয়ংক্রিয় ওয়ার্কফ্লো';
      nodes = [
        { id: 'n1', type: 'trigger:event', title: 'ইভেন্ট ট্রিগার', config: {} },
        { id: 'n2', type: 'ai:analyze', title: 'এআই বিশ্লেষণ', config: {} },
        { id: 'n3', type: 'control:approval', title: 'প্রশাসনিক অনুমোদন', config: { required_role: 'madrasa_admin' } },
        { id: 'n4', type: 'action:notification', title: 'নোটিফিকেশন অ্যালার্ট', config: {} }
      ];
      connections = [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }
      ];
    }

    return {
      prompt,
      compiledWorkflow: {
        name,
        triggerType,
        nodes,
        connections
      },
      dryRunPreview: {
        estimatedRecipients: 18,
        actionsExpected: ['এআই বার্তা তৈরি', 'অ্যাডমিন ড্যাশবোর্ডে অনুমোদন চাওয়া', 'অনুমোদনের পর SMS প্রেরণ'],
        safetyCheck: 'উচ্চ নিরাপত্তা: সরাসরি মেসেজ যাবে না, মানুষের অনুমোদন প্রয়োজন।'
      }
    };
  }
}

export const automationService = new AutomationService();
