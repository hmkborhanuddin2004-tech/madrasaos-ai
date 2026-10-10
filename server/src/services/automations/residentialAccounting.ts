import { AutomationContext } from './context.js';
import { AutomationModule } from './result.js';
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

    const invoices = await ctx.db.all(`
      SELECT i.total_amount, i.paid_amount, s.is_residential
      FROM fee_invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.year = ? AND i.month = ?
    `, [year, month]);

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
