import { AutomationContext } from './context.js';
import { AutomationResult, AutomationModule } from './result.js';

export const attendanceAbsentSms: AutomationModule = {
  key: 'attendance_absent_sms',
  name: 'Attendance Absent SMS',
  cron: '30 10 * * *',
  priority: 10,
  run: async (ctx: AutomationContext, params: any = {}) => {
    const date = params.on_date || ctx.today();
    const students = await ctx.db.all(`
      SELECT s.id, s.name_bn, s.guardian_phone, c.name as class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE a.date = ? AND a.status = 'A' AND s.is_active = 1
    `, [date]);

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
      const studentIds = group.map((s: any) => s.id).sort().join(',');
      const ref = `att:${date}:${studentIds}`;
      const childrenText = group.map((s: any) => `• ${s.name_bn} (${s.class_name})`).join('\n');
      const text = `প্রিয় অভিভাবক,\n${childrenText}\nআজ ${date} তারিখে অনুপস্থিত ছিল।\n— ${ctx.madrasaName()}`;
      
      const ok = await ctx.sendSms(phone, text, 'attendance_absent', ref);
      if (ok) sent++;
      else skipped++; // Duplicate or failed
    }

    // Also admin
    if (ctx.config.admin_phone) {
      const staff = await ctx.db.all(`
        SELECT s.name_bn
        FROM staff_attendance a
        JOIN staff s ON a.staff_id = s.id
        WHERE a.date = ? AND a.status = 'A' AND s.is_active = 1
      `, [date]);
      if (staff.length > 0) {
        const text = `অনুপস্থিত স্টাফ:\n${staff.map((s: any) => `• ${s.name_bn}`).join('\n')}\n— ${ctx.madrasaName()}`;
        await ctx.sendSms(ctx.config.admin_phone, text, 'attendance_absent', `staff:${date}`);
      }
    }

    return { processed: students.length, sent, skipped };
  }
};
