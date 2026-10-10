import { AutomationContext } from './context.js';
import { AutomationModule } from './result.js';

export const noticeDispatch: AutomationModule = {
  key: 'notice_dispatch',
  name: 'Notice Dispatch',
  cron: '*/10 * * * *',
  priority: 40,
  run: async (ctx: AutomationContext) => {
    const notices = await ctx.db.all(`
      SELECT * FROM notices 
      WHERE dispatched_at IS NULL AND approval_status IN ('auto','approved')
    `);

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
          targetStudents = await ctx.db.all(`
            SELECT DISTINCT s.id, s.name_bn, s.guardian_phone
            FROM students s
            JOIN fee_invoices i ON s.id = i.student_id
            WHERE s.is_active = 1 AND i.status != 'paid'
          `);
        } else if (cond === 'birthday') {
           // not strict implementation for birthday, just matching MM-DD
           const md = ctx.today().slice(5); // -MM-DD
           targetStudents = await ctx.db.all(`
             SELECT id, name_bn, guardian_phone FROM students 
             WHERE is_active = 1 AND date_of_birth LIKE ?
           `, [`%${md}`]);
        }
      } else if (notice.target_type === 'classes') {
        const ids = notice.target_ids ? JSON.parse(notice.target_ids) : [];
        if (ids.length > 0) {
          targetStudents = await ctx.db.all(`SELECT id, name_bn, guardian_phone FROM students WHERE is_active = 1 AND class_id IN (${ids.map(()=>'?').join(',')})`, ids);
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
          let text = `${notice.title}\n\n${notice.body}\n— ${ctx.madrasaName()}`;
          if (group.length > 1) {
            text = `আপনার সন্তানদের জন্য: (${names})\n${text}`;
          }
          const ref = `notice:${notice.id}:${phone}`;
          const ok = await ctx.sendSms(phone, text, 'notice', ref);
          if (ok) noticeSent++;
          else noticeFailed++;
        }
      }

      const totalRecipients = grouped.size;
      const smsCost = noticeSent * parseFloat(ctx.config.sms_rate || '0.35');
      
      await ctx.db.run(
        `UPDATE notices SET dispatched_at = ?, total_recipients = ?, sms_sent = ?, sms_failed = ?, sms_cost = ? WHERE id = ?`,
        [ctx.now().toISOString(), totalRecipients, noticeSent, noticeFailed, smsCost, notice.id]
      );
      totalSent += noticeSent;
      totalSkipped += (totalRecipients - noticeSent - noticeFailed);
      totalFailed += noticeFailed;
    }

    return { processed: notices.length, sent: totalSent, failed: totalFailed, skipped: totalSkipped };
  }
};
