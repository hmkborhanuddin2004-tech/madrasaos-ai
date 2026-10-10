const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
    const absPath = path.join(__dirname, relPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absPath, content.trim() + '\n', 'utf8');
    console.log(`Wrote ${relPath}`);
}

// 1. A. SMS Gateway
writeFile('server/src/services/sms/smsGateway.ts', `
import fetch from 'node-fetch';

export interface SmsGateway {
  send(phone: string, text: string): Promise<boolean>;
}

export class ConsoleSms implements SmsGateway {
  async send(phone: string, text: string): Promise<boolean> {
    console.log(\`[SMS to \${phone}]: \${text}\`);
    return true;
  }
}

export class BulkSmsBD implements SmsGateway {
  constructor(
    private apiKey: string,
    private senderId: string
  ) {}

  async send(phone: string, text: string): Promise<boolean> {
    try {
      const url = new URL('http://bulksmsbd.net/api/smsapi');
      url.searchParams.append('api_key', this.apiKey);
      url.searchParams.append('type', 'text');
      url.searchParams.append('number', phone);
      url.searchParams.append('senderid', this.senderId);
      url.searchParams.append('message', text);

      const res = await fetch(url.toString(), { method: 'GET' });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      console.error('BulkSmsBD error:', err);
      return false;
    }
  }
}

export class NoSms implements SmsGateway {
  async send(phone: string, text: string): Promise<boolean> {
    return false;
  }
}
`);

// 2. B. AutomationContext
writeFile('server/src/services/automations/context.ts', `
import { Database } from 'sqlite';
import { SmsGateway } from '../sms/smsGateway';

export class AutomationContext {
  constructor(
    public db: Database,
    public sms: SmsGateway,
    public config: Record<string, any>,
    public dryRun: boolean = false
  ) {}

  async sendSms(phone: string, text: string, kind: string, ref: string): Promise<boolean> {
    // Check duplicate guard
    const exists = await this.db.get(
      'SELECT id FROM notification_logs WHERE kind = ? AND ref = ? AND phone = ?',
      [kind, ref, phone]
    );
    if (exists) {
      return false; // Already sent
    }

    let ok = false;
    if (this.dryRun) {
      console.log(\`[DRY RUN SMS - \${kind}] to \${phone}: \${text}\`);
      ok = true; // assume success
    } else {
      ok = await this.sms.send(phone, text);
    }

    if (ok) {
      const id = require('crypto').randomUUID();
      await this.db.run(
        'INSERT INTO notification_logs (id, kind, ref, phone, message, sent_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, kind, ref, phone, text, new Date().toISOString(), 'sent']
      );
    }
    return ok;
  }

  today(): string {
    return this.now().toISOString().split('T')[0];
  }

  now(): Date {
    return new Date();
  }

  madrasaName(): string {
    return this.config.madrasa_name || 'মাদরাসা';
  }
}
`);

// 3. C. AutomationResult
writeFile('server/src/services/automations/result.ts', `
export interface AutomationResult {
  key: string;
  ok: boolean;
  processed: number;
  created: number;
  updated: number;
  sent: number;
  skipped: number;
  failed: number;
  messages: string[];
  data: Record<string, any>;
}

export interface AutomationModule {
  key: string;
  name: string;
  cron: string;
  priority: number;
  run(ctx: any, params?: any): Promise<Partial<AutomationResult>>;
}
`);

// 4. D. Automation modules
// attendanceAbsentSms.ts
writeFile('server/src/services/automations/attendanceAbsentSms.ts', `
import { AutomationContext } from './context';
import { AutomationResult, AutomationModule } from './result';

export const attendanceAbsentSms: AutomationModule = {
  key: 'attendance_absent_sms',
  name: 'Attendance Absent SMS',
  cron: '30 10 * * *',
  priority: 10,
  run: async (ctx: AutomationContext, params: any = {}) => {
    const date = params.on_date || ctx.today();
    const students = await ctx.db.all(\`
      SELECT s.id, s.name_bn, s.guardian_phone, c.name as class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE a.date = ? AND a.status = 'A' AND s.is_active = 1
    \`, [date]);

    // Group by phone
    const grouped = new Map<string, any[]>();
    for (const s of students) {
      if (!s.guardian_phone) continue;
      if (!grouped.has(s.guardian_phone)) grouped.set(s.guardian_phone, []);
      grouped.get(s.guardian_phone)!.push(s);
    }

    let sent = 0;
    let skipped = 0;
    for (const [phone, group] of grouped.entries()) {
      const studentIds = group.map(s => s.id).sort().join(',');
      const ref = \`att:\${date}:\${studentIds}\`;
      const childrenText = group.map(s => \`• \${s.name_bn} (\${s.class_name})\`).join('\\n');
      const text = \`প্রিয় অভিভাবক,\\n\${childrenText}\\nআজ \${date} তারিখে অনুপস্থিত ছিল।\\n— \${ctx.madrasaName()}\`;
      
      const ok = await ctx.sendSms(phone, text, 'attendance_absent', ref);
      if (ok) sent++;
      else skipped++; // Duplicate or failed
    }

    // Also admin
    if (ctx.config.admin_phone) {
      const staff = await ctx.db.all(\`
        SELECT s.name_bn
        FROM staff_attendance a
        JOIN staff s ON a.staff_id = s.id
        WHERE a.date = ? AND a.status = 'A' AND s.is_active = 1
      \`, [date]);
      if (staff.length > 0) {
        const text = \`অনুপস্থিত স্টাফ:\\n\${staff.map(s => \`• \${s.name_bn}\`).join('\\n')}\\n— \${ctx.madrasaName()}\`;
        await ctx.sendSms(ctx.config.admin_phone, text, 'attendance_absent', \`staff:\${date}\`);
      }
    }

    return { processed: students.length, sent, skipped };
  }
};
`);

// feeInvoice.ts
writeFile('server/src/services/automations/feeInvoice.ts', `
import { AutomationContext } from './context';
import { AutomationModule } from './result';

export const feeInvoice: AutomationModule = {
  key: 'fee_invoice_generate',
  name: 'Fee Invoice Generator',
  cron: '0 1 1 * *',
  priority: 20,
  run: async (ctx: AutomationContext, params: any = {}) => {
    const today = ctx.now();
    const year = params.year || today.getFullYear();
    const month = params.month || (today.getMonth() + 1);
    
    const dueDateDay = parseInt(ctx.config.fee_due_day || '10', 10);
    const dueDate = new Date(year, month - 1, dueDateDay);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const feeMap = new Map<string, number>();
    const fees = await ctx.db.all('SELECT class_id, is_residential, total_amount FROM fee_structures');
    for (const f of fees) {
      feeMap.set(\`\${f.class_id}:\${f.is_residential}\`, f.total_amount);
    }

    const students = await ctx.db.all('SELECT id, class_id, is_residential FROM students WHERE is_active = 1');
    let created = 0, skipped = 0, residentialCount = 0, nonResidentialCount = 0, totalAmount = 0;

    for (const s of students) {
      let amount = feeMap.get(\`\${s.class_id}:\${s.is_residential}\`);
      if (amount === undefined && s.is_residential === 1) {
        amount = feeMap.get(\`\${s.class_id}:0\`); // fallback
      }
      if (amount === undefined) {
        skipped++;
        continue;
      }

      // Check existing
      const existing = await ctx.db.get('SELECT id FROM fee_invoices WHERE student_id = ? AND year = ? AND month = ?', [s.id, year, month]);
      if (existing) {
        skipped++;
        continue;
      }

      const id = require('crypto').randomUUID();
      await ctx.db.run(
        'INSERT INTO fee_invoices (id, student_id, year, month, total_amount, paid_amount, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, s.id, year, month, amount, 0, dueDateStr, 'unpaid', today.toISOString(), today.toISOString()]
      );
      created++;
      totalAmount += amount;
      if (s.is_residential === 1) residentialCount++;
      else nonResidentialCount++;
    }

    return { 
      processed: students.length, 
      created, 
      skipped, 
      data: { total_amount: totalAmount, residential_count: residentialCount, non_residential_count: nonResidentialCount } 
    };
  }
};
`);

// feeReminder.ts
writeFile('server/src/services/automations/feeReminder.ts', `
import { AutomationContext } from './context';
import { AutomationModule } from './result';

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

export const feeReminder: AutomationModule = {
  key: 'fee_due_reminder',
  name: 'Fee Due Reminder',
  cron: '0 11 * * 1',
  priority: 30,
  run: async (ctx: AutomationContext) => {
    const today = ctx.today();
    const invoices = await ctx.db.all(\`
      SELECT i.id as invoice_id, i.month, i.year, i.total_amount - i.paid_amount as due, s.name_bn, s.guardian_phone
      FROM fee_invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.status != 'paid' AND i.due_date < ? AND s.is_active = 1
    \`, [today]);

    const grouped = new Map<string, any[]>();
    for (const i of invoices) {
      if (!i.guardian_phone) continue;
      if (!grouped.has(i.guardian_phone)) grouped.set(i.guardian_phone, []);
      grouped.get(i.guardian_phone)!.push(i);
    }

    let sent = 0, skipped = 0;
    const currentWeek = getISOWeek(ctx.now());

    for (const [phone, group] of grouped.entries()) {
      const totalDue = group.reduce((sum, i) => sum + i.due, 0);
      const invoiceIds = group.map(i => i.invoice_id).sort().join(',');
      const ref = \`fee_due:week:\${currentWeek}:\${invoiceIds}\`;
      
      const details = group.map(i => \`• \${i.name_bn} — \${i.month}/\${i.year}: \${i.due}৳\`).join('\\n');
      const text = \`প্রিয় অভিভাবক,\\n\${details}\\nমোট বকেয়া: \${totalDue}৳\\nঅনুগ্রহ করে পরিশোধ করুন।\\n— \${ctx.madrasaName()}\`;

      const ok = await ctx.sendSms(phone, text, 'fee_due', ref);
      if (ok) sent++;
      else skipped++;
    }

    return { processed: invoices.length, sent, skipped };
  }
};
`);

// noticeDispatch.ts
writeFile('server/src/services/automations/noticeDispatch.ts', `
import { AutomationContext } from './context';
import { AutomationModule } from './result';

export const noticeDispatch: AutomationModule = {
  key: 'notice_dispatch',
  name: 'Notice Dispatch',
  cron: '*/10 * * * *',
  priority: 40,
  run: async (ctx: AutomationContext) => {
    const notices = await ctx.db.all(\`
      SELECT * FROM notices 
      WHERE dispatched_at IS NULL AND approval_status IN ('auto','approved')
    \`);

    let totalSent = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const notice of notices) {
      let targetStudents: any[] = [];
      
      if (notice.target_type === 'all') {
        targetStudents = await ctx.db.all('SELECT id, name_bn, guardian_phone FROM students WHERE is_active = 1');
      } else if (notice.target_type === 'conditional') {
        const cond = notice.target_ids; // 'due_fee', 'birthday'
        if (cond === 'due_fee') {
          targetStudents = await ctx.db.all(\`
            SELECT DISTINCT s.id, s.name_bn, s.guardian_phone
            FROM students s
            JOIN fee_invoices i ON s.id = i.student_id
            WHERE s.is_active = 1 AND i.status != 'paid'
          \`);
        } else if (cond === 'birthday') {
           // not strict implementation for birthday, just matching MM-DD
           const md = ctx.today().slice(5); // -MM-DD
           targetStudents = await ctx.db.all(\`
             SELECT id, name_bn, guardian_phone FROM students 
             WHERE is_active = 1 AND date_of_birth LIKE ?
           \`, [\`%\${md}\`]);
        }
      } else if (notice.target_type === 'classes') {
        const ids = notice.target_ids ? JSON.parse(notice.target_ids) : [];
        if (ids.length > 0) {
          targetStudents = await ctx.db.all(\`SELECT id, name_bn, guardian_phone FROM students WHERE is_active = 1 AND class_id IN (\${ids.map(()=>'?').join(',')})\`, ids);
        }
      }

      const grouped = new Map<string, any[]>();
      for (const s of targetStudents) {
         if (s.guardian_phone) {
           if (!grouped.has(s.guardian_phone)) grouped.set(s.guardian_phone, []);
           grouped.get(s.guardian_phone)!.push(s);
         }
      }

      let noticeSent = 0;
      let noticeFailed = 0;

      if (notice.channel === 'sms' || notice.channel === 'both') {
        for (const [phone, group] of grouped.entries()) {
          const names = group.map(s => s.name_bn).join(', ');
          let text = \`\${notice.title}\\n\\n\${notice.body}\\n— \${ctx.madrasaName()}\`;
          if (group.length > 1) {
            text = \`আপনার সন্তানদের জন্য: (\${names})\\n\${text}\`;
          }
          const ref = \`notice:\${notice.id}:\${phone}\`;
          const ok = await ctx.sendSms(phone, text, 'notice', ref);
          if (ok) noticeSent++;
          else noticeFailed++;
        }
      }

      const totalRecipients = grouped.size;
      const smsCost = noticeSent * parseFloat(ctx.config.sms_rate || '0.35');
      
      await ctx.db.run(
        \`UPDATE notices SET dispatched_at = ?, total_recipients = ?, sms_sent = ?, sms_failed = ?, sms_cost = ?, updated_at = ? WHERE id = ?\`,
        [ctx.now().toISOString(), totalRecipients, noticeSent, noticeFailed, smsCost, ctx.now().toISOString(), notice.id]
      );
      totalSent += noticeSent;
      totalSkipped += (totalRecipients - noticeSent - noticeFailed);
      totalFailed += noticeFailed;
    }

    return { processed: notices.length, sent: totalSent, failed: totalFailed, skipped: totalSkipped };
  }
};
`);

// resultProcess.ts
writeFile('server/src/services/automations/resultProcess.ts', `
import { AutomationContext } from './context';
import { AutomationModule } from './result';

export const resultProcess: AutomationModule = {
  key: 'result_process',
  name: 'Result Processing',
  cron: '', // Manual only usually
  priority: 50,
  run: async (ctx: AutomationContext, params: any) => {
    if (!params || !params.exam_id) throw new Error('exam_id required');
    const exam_id = params.exam_id;

    const exam = await ctx.db.get('SELECT * FROM exams WHERE id = ?', [exam_id]);
    if (!exam) throw new Error('Exam not found');

    const policy = await ctx.db.get('SELECT * FROM grading_policies WHERE is_active = 1 AND effective_from <= ? ORDER BY effective_from DESC LIMIT 1', [exam.start_date]);
    if (!policy) throw new Error('No active grading policy found');

    const gradeTable = JSON.parse(policy.grade_table);
    
    // get subjects
    const subjects = await ctx.db.all('SELECT * FROM subjects WHERE class_id = ?', [exam.class_id]);
    const minMarksMap = new Map();
    const coreMap = new Map();
    subjects.forEach((s: any) => {
      minMarksMap.set(s.id, s.pass_marks);
      coreMap.set(s.id, s.is_core);
    });

    const marks = await ctx.db.all('SELECT * FROM marks WHERE exam_id = ?', [exam_id]);
    const studentsMap = new Map<string, any[]>();
    marks.forEach((m: any) => {
      if (!studentsMap.has(m.student_id)) studentsMap.set(m.student_id, []);
      studentsMap.get(m.student_id)!.push(m);
    });

    const results = [];
    
    for (const [student_id, studentMarks] of studentsMap.entries()) {
      let total = 0;
      let totalMax = subjects.reduce((sum: number, s: any) => sum + s.full_marks, 0); // Assuming full_marks exists, defaulting to 100 per subject for totalMax if not
      
      let allPass = true;
      let passedCount = 0;
      let corePassed = true;

      for (const sm of studentMarks) {
        total += sm.obtained_marks;
        const passMark = minMarksMap.get(sm.subject_id) || 33;
        const isPass = sm.obtained_marks >= passMark;
        if (!isPass) allPass = false;
        if (isPass) passedCount++;
        if (coreMap.get(sm.subject_id) && !isPass) corePassed = false;
      }

      // calculate percent based on actually evaluated subjects
      let totalFull = studentMarks.length * 100; // simple assumption: each subject 100 marks full
      let percent = totalFull > 0 ? (total / totalFull) * 100 : 0;
      
      let isPassOverall = false;
      if (policy.pass_rule === 'strict') isPassOverall = allPass;
      else if (policy.pass_rule === 'lenient') isPassOverall = percent >= policy.overall_pass_percent;
      else if (policy.pass_rule === 'x_of_y') isPassOverall = passedCount >= policy.min_subjects_to_pass;
      else if (policy.pass_rule === 'hybrid') isPassOverall = corePassed && (percent >= policy.overall_pass_percent);

      let grade = 'F';
      let gpa = 0;

      if (isPassOverall) {
        // Find grade
        const matched = gradeTable.find((g: any) => percent >= g.min_percent);
        if (matched) {
          grade = matched.grade;
          gpa = matched.gpa;
        } else if (gradeTable.length > 0) {
           grade = gradeTable[gradeTable.length - 1].grade; // lowest passing
           gpa = gradeTable[gradeTable.length - 1].gpa;
        }
      }

      results.push({
        student_id,
        total_marks: total,
        gpa,
        grade,
        is_pass: isPassOverall ? 1 : 0
      } as any);
    }

    // sort
    if (policy.merit_by === 'gpa') {
      results.sort((a, b) => b.gpa - a.gpa || b.total_marks - a.total_marks);
    } else {
      results.sort((a, b) => b.total_marks - a.total_marks || b.gpa - a.gpa);
    }

    // apply rank
    let rank = 1;
    for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].total_marks === results[i-1].total_marks && results[i].gpa === results[i-1].gpa) {
        results[i].rank = results[i-1].rank; // tie
      } else {
        results[i].rank = rank;
      }
      rank++;
    }

    let created = 0, updated = 0;
    for (const r of results) {
      const existing = await ctx.db.get('SELECT id, is_locked FROM results WHERE exam_id = ? AND student_id = ?', [exam_id, r.student_id]);
      if (existing) {
        if (existing.is_locked === 1) continue;
        await ctx.db.run(
          'UPDATE results SET total_marks = ?, gpa = ?, grade = ?, merit_position = ?, updated_at = ? WHERE id = ?',
          [r.total_marks, r.gpa, r.grade, r.rank, ctx.now().toISOString(), existing.id]
        );
        updated++;
      } else {
        const id = require('crypto').randomUUID();
        await ctx.db.run(
          'INSERT INTO results (id, exam_id, student_id, total_marks, gpa, grade, merit_position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, exam_id, r.student_id, r.total_marks, r.gpa, r.grade, r.rank, ctx.now().toISOString(), ctx.now().toISOString()]
        );
        created++;
      }
    }

    return { processed: studentsMap.size, created, updated };
  }
};
`);

// residentialAccounting.ts
writeFile('server/src/services/automations/residentialAccounting.ts', `
import { AutomationContext } from './context';
import { AutomationModule } from './result';
// assuming exportUtils would be used in real scenario, keeping it simple here
export const residentialAccounting: AutomationModule = {
  key: 'residential_accounting',
  name: 'Residential Accounting',
  cron: '0 23 * * *',
  priority: 60,
  run: async (ctx: AutomationContext, params: any = {}) => {
    const today = ctx.now();
    const year = params.year || today.getFullYear();
    const month = params.month || (today.getMonth() + 1);

    const invoices = await ctx.db.all(\`
      SELECT i.total_amount, i.paid_amount, s.is_residential
      FROM fee_invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.year = ? AND i.month = ?
    \`, [year, month]);

    let resTotal = 0, resPaid = 0;
    let nonResTotal = 0, nonResPaid = 0;

    for (const i of invoices) {
      if (i.is_residential === 1) {
        resTotal += i.total_amount;
        resPaid += i.paid_amount;
      } else {
        nonResTotal += i.total_amount;
        nonResPaid += i.paid_amount;
      }
    }
    
    // Simulate export
    return { 
      processed: invoices.length, 
      data: {
        year, month,
        residential: { total: resTotal, paid: resPaid, due: resTotal - resPaid },
        non_residential: { total: nonResTotal, paid: nonResPaid, due: nonResTotal - nonResPaid }
      }
    };
  }
};
`);

// dbBackup.ts
writeFile('server/src/services/automations/dbBackup.ts', `
import { AutomationContext } from './context';
import { AutomationModule } from './result';
import fs from 'fs';
import path from 'path';

export const dbBackup: AutomationModule = {
  key: 'db_backup',
  name: 'Database Backup',
  cron: '0 2 * * *',
  priority: 70,
  run: async (ctx: AutomationContext) => {
    const backupDir = ctx.config.backup_dir || path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = Date.now();
    const dbPath = path.join(process.cwd(), 'data', 'madrasa.sqlite'); // Assuming this path
    const backupPath = path.join(backupDir, \`db_\${timestamp}.sqlite\`);
    
    let ok = 1;
    let message = 'Backup successful';
    let size = 0;
    try {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        size = fs.statSync(backupPath).size;
      } else {
         ok = 0;
         message = 'DB file not found';
      }
    } catch(err: any) {
      ok = 0;
      message = err.message;
    }

    // Clean old
    const keepDays = parseInt(ctx.config.backup_keep_days || '14', 10);
    const cutoff = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(backupDir);
    for (const f of files) {
      if (f.startsWith('db_') && f.endsWith('.sqlite')) {
        const p = path.join(backupDir, f);
        const stats = fs.statSync(p);
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(p);
        }
      }
    }

    const id = require('crypto').randomUUID();
    // Assuming backup_logs table exists or creating inline (as per schema update)
    await ctx.db.run(\`
      CREATE TABLE IF NOT EXISTS backup_logs (
        id TEXT PRIMARY KEY,
        path TEXT,
        size_bytes INTEGER,
        ok INTEGER,
        message TEXT,
        created_at TEXT
      )
    \`);
    await ctx.db.run(
      'INSERT INTO backup_logs (id, path, size_bytes, ok, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, backupPath, size, ok, message, new Date().toISOString()]
    );

    return { ok: ok === 1, processed: 1, data: { size, path: backupPath, message } };
  }
};
`);

// Registry
writeFile('server/src/services/automations/registry.ts', `
import { AutomationModule, AutomationResult } from './result';
import { AutomationContext } from './context';
import { attendanceAbsentSms } from './attendanceAbsentSms';
import { feeInvoice } from './feeInvoice';
import { feeReminder } from './feeReminder';
import { noticeDispatch } from './noticeDispatch';
import { resultProcess } from './resultProcess';
import { residentialAccounting } from './residentialAccounting';
import { dbBackup } from './dbBackup';

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
      return this.errorResult(key, \`Module \${key} not found\`);
    }

    const startTime = new Date();
    const logId = require('crypto').randomUUID();

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
    await ctx.db.run(\`
      INSERT INTO automation_logs (
        id, key, started_at, finished_at, ok, processed, created, sent, failed, messages, data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`, [
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
`);

// Scheduler
writeFile('server/src/services/automations/scheduler.ts', `
import cron from 'node-cron';
import { AutomationContext } from './context';
import { globalRegistry } from './registry';

export function startScheduler(ctx: AutomationContext) {
  const mods = globalRegistry.listAll();
  for (const mod of mods) {
    if (mod.cron) {
      cron.schedule(mod.cron, () => {
        console.log(\`[CRON] Running \${mod.name}\`);
        globalRegistry.runOne(mod.key, ctx).catch((err: any) => {
          console.error(\`[CRON] Error in \${mod.name}:\`, err);
        });
      });
    }
  }
  console.log('Scheduler started with modules:', mods.map(m => m.key).join(', '));
}
`);

console.log('Automations core created');
