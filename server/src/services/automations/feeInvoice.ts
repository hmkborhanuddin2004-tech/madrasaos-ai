import { randomUUID } from 'crypto';
import { AutomationContext } from './context.js';
import { AutomationModule } from './result.js';

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
      feeMap.set(`${f.class_id}:${f.is_residential}`, f.total_amount);
    }

    const students = await ctx.db.all('SELECT id, class_id, is_residential FROM students WHERE is_active = 1');
    let created = 0, skipped = 0, residentialCount = 0, nonResidentialCount = 0, totalAmount = 0;

    for (const s of students) {
      let amount = feeMap.get(`${s.class_id}:${s.is_residential}`);
      if (amount === undefined && s.is_residential === 1) {
        amount = feeMap.get(`${s.class_id}:0`); // fallback
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

      const id = randomUUID();
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
