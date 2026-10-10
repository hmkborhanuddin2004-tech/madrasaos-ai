import { AutomationContext } from './context.js';
import { AutomationModule } from './result.js';

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
    const invoices = await ctx.db.all(`
      SELECT i.id as invoice_id, i.month, i.year, i.total_amount - i.paid_amount as due, s.name_bn, s.guardian_phone
      FROM fee_invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.status != 'paid' AND i.due_date < ? AND s.is_active = 1
    `, [today]);

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
      const ref = `fee_due:week:${currentWeek}:${invoiceIds}`;
      
      const details = group.map(i => `• ${i.name_bn} — ${i.month}/${i.year}: ${i.due}৳`).join('\n');
      const text = `প্রিয় অভিভাবক,\n${details}\nমোট বকেয়া: ${totalDue}৳\nঅনুগ্রহ করে পরিশোধ করুন।\n— ${ctx.madrasaName()}`;

      const ok = await ctx.sendSms(phone, text, 'fee_due', ref);
      if (ok) sent++;
      else skipped++;
    }

    return { processed: invoices.length, sent, skipped };
  }
};
