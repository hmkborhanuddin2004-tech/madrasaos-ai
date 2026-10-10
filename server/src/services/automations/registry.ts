import { randomUUID } from 'crypto';
import { AutomationModule, AutomationResult } from './result.js';
import { AutomationContext } from './context.js';
import { attendanceAbsentSms } from './attendanceAbsentSms.js';
import { feeInvoice } from './feeInvoice.js';
import { feeReminder } from './feeReminder.js';
import { noticeDispatch } from './noticeDispatch.js';
import { resultProcess } from './resultProcess.js';
import { residentialAccounting } from './residentialAccounting.js';
import { dbBackup } from './dbBackup.js';

export class AutomationRegistry {
  private modules: Map<string, AutomationModule> = new Map();

  register(mod: AutomationModule) {
    this.modules.set(mod.key, mod);
  }

  get(key: string): AutomationModule | undefined {
    return this.modules.get(key);
  }

  loadAll() {
    this.register(attendanceAbsentSms);
    this.register(feeInvoice);
    this.register(feeReminder);
    this.register(noticeDispatch);
    this.register(resultProcess);
    this.register(residentialAccounting);
    this.register(dbBackup);
  }

  listAll() {
    return Array.from(this.modules.values()).map(m => ({
      key: m.key,
      name: m.name,
      cron: m.cron,
      priority: m.priority
    })).sort((a,b) => a.priority - b.priority);
  }

  async runOne(key: string, ctx: AutomationContext, params?: any): Promise<AutomationResult> {
    const mod = this.get(key);
    if (!mod) {
      return this.errorResult(key, `Module ${key} not found`);
    }

    const startTime = new Date();
    const logId = randomUUID();

    let res: Partial<AutomationResult>;
    try {
      res = await mod.run(ctx, params);
      res.ok = res.ok !== undefined ? res.ok : true;
    } catch (err: any) {
      res = { ok: false, messages: [err.message] };
    }
    
    const finalRes: AutomationResult = {
      key,
      ok: res.ok || false,
      processed: res.processed || 0,
      created: res.created || 0,
      updated: res.updated || 0,
      sent: res.sent || 0,
      skipped: res.skipped || 0,
      failed: res.failed || 0,
      messages: res.messages || [],
      data: res.data || {}
    };

    const endTime = new Date();

    // Log
    await ctx.db.run(`
      INSERT INTO automation_logs (
        id, key, started_at, finished_at, ok, processed, created, sent, failed, messages, data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      logId, key, startTime.toISOString(), endTime.toISOString(),
      finalRes.ok ? 1 : 0, finalRes.processed, finalRes.created, finalRes.sent, finalRes.failed,
      JSON.stringify(finalRes.messages), JSON.stringify(finalRes.data)
    ]);

    return finalRes;
  }

  private errorResult(key: string, msg: string): AutomationResult {
    return { key, ok: false, processed: 0, created: 0, updated: 0, sent: 0, skipped: 0, failed: 0, messages: [msg], data: {} };
  }
}

export const globalRegistry = new AutomationRegistry();
globalRegistry.loadAll();
