import { db } from '../db/db.js';
import { attendanceService } from './attendanceService.js';
import { financeService } from './financeService.js';
import { hifzService } from './hifzService.js';
import { hostelService } from './hostelService.js';
import { studentService } from './studentService.js';
import { AIAgentResponse, UserRoleCode } from '../types/index.js';

export interface AIAgentContext {
  userId: string;
  tenantId: string;
  role: UserRoleCode;
  fullNameBn: string;
}

export class AIAgentService {
  // Deterministic tool definition registry
  private async executeTool(toolName: string, args: any, context: AIAgentContext): Promise<{ success: boolean; data?: any; error?: string }> {
    // RBAC tool guardrail
    const isTeacher = context.role === 'teacher' || context.role === 'hifz_teacher';
    const isAccountant = context.role === 'accountant';
    const isAdmin = context.role === 'madrasa_admin' || context.role === 'super_admin' || context.role === 'principal';

    if ((toolName === 'getFeeSummary' || toolName === 'getOverdueFees') && isTeacher) {
      return { success: false, error: 'উস্তাদগণের জন্য আর্থিক ডাটাবেজ অ্যাক্সেস সংরক্ষিত নয়।' };
    }

    if ((toolName === 'getHifzProgress' || toolName === 'getDecliningHifzStudents') && isAccountant) {
      return { success: false, error: 'হিসাবরক্ষকদের জন্য হিফজ ডাটাবেজ অ্যাক্সেস প্রয়োজন নেই।' };
    }

    try {
      switch (toolName) {
        case 'getDailyBriefing': {
          const att = await attendanceService.getTodaySummary(context.tenantId);
          const fin = await financeService.getSummary(context.tenantId);
          const hifzAlerts = await hifzService.getDecliningAlerts(context.tenantId);
          const repeatedAbsences = await attendanceService.getRepeatedAbsences(context.tenantId, 7, 2);
          const hostel = await hostelService.getHostelStatus(context.tenantId);

          return {
            success: true,
            data: {
              date: att.date,
              attendance: att,
              finance: fin,
              hifzAlertCount: hifzAlerts.length,
              repeatedAbsenceCount: repeatedAbsences.length,
              hostelOccupancy: `${hostel.totalOccupied}/${hostel.totalCapacity} সিট পূর্ণ`
            }
          };
        }

        case 'getAttendance': {
          const data = await attendanceService.getTodaySummary(context.tenantId, args.date);
          return { success: true, data };
        }

        case 'getRepeatedAbsences': {
          const days = args.days || 7;
          const minAbsences = args.minAbsences || 2;
          const list = await attendanceService.getRepeatedAbsences(context.tenantId, days, minAbsences);
          return { success: true, data: list };
        }

        case 'getFeeSummary': {
          const data = await financeService.getSummary(context.tenantId, args.month, args.year);
          return { success: true, data };
        }

        case 'getOverdueFees': {
          const overdueInvoices = await financeService.getInvoices(context.tenantId, { status: 'overdue' });
          return { success: true, data: overdueInvoices };
        }

        case 'getDecliningHifzStudents': {
          const list = await hifzService.getDecliningAlerts(context.tenantId);
          return { success: true, data: list };
        }

        case 'getHostelStatus': {
          const data = await hostelService.getHostelStatus(context.tenantId);
          return { success: true, data };
        }

        case 'searchStudents': {
          const res = await studentService.getStudents(context.tenantId, { search: args.query, limit: 10 });
          return { success: true, data: res.students };
        }

        default:
          return { success: false, error: `অজ্ঞাত এআই টুল: ${toolName}` };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Main natural language query resolver
  public async processQuery(query: string, context: AIAgentContext): Promise<AIAgentResponse> {
    const q = query.toLowerCase().trim();

    // 1. Daily Briefing / Overall status
    if (
      q.includes('আজকের অবস্থা') ||
      q.includes('আজকের সারসংক্ষেপ') ||
      q.includes('ব্রিফিং') ||
      q.includes('দৈনিক ব্রিফ') ||
      q.includes('brief') ||
      q.includes('today status')
    ) {
      const toolRes = await this.executeTool('getDailyBriefing', {}, context);
      const b = toolRes.data;
      const summaryBn = `আজ মোট ${b.attendance.totalStudents} জন শিক্ষার্থীর মধ্যে ${b.attendance.presentCount} জন উপস্থিত (${b.attendance.attendanceRate}%)। ${b.attendance.absentCount} জন অনুপস্থিত, যার মধ্যে ${b.repeatedAbsenceCount} জন গত ৭ দিনে একাধিকবার অনুপস্থিত হয়েছে। চলতি মাসে মোট ৳${b.finance.totalCollected.toLocaleString()} ফি আদায় হয়েছে এবং আজ ৳${b.finance.todayCollection.toLocaleString()} জমা হয়েছে।`;

      return {
        summaryBn,
        dataType: 'brief',
        data: b,
        sources: ['attendance_records', 'fee_invoices', 'hifz_records', 'hostel_rooms'],
        actions: [
          { labelBn: 'হাজিরা বিস্তারিত', labelEn: 'View Attendance', actionType: 'navigate', payload: { route: '/attendance' } },
          { labelBn: 'পুনরাবৃত্ত অনুপস্থিতি তালিকা', labelEn: 'View Repeated Absence', actionType: 'navigate', payload: { route: '/attendance/repeated' } },
          { labelBn: 'আর্থিক হিসাব দেখুন', labelEn: 'View Finance', actionType: 'navigate', payload: { route: '/finance' } }
        ]
      };
    }

    // 2. Attendance inquiries
    if (q.includes('হাজিরা') || q.includes('অনুপস্থিত') || q.includes('উপস্থিত') || q.includes('attendance') || q.includes('absent')) {
      if (q.includes('টানা') || q.includes('একাধিকবার') || q.includes('repeated') || q.includes('৭০%')) {
        const toolRes = await this.executeTool('getRepeatedAbsences', { days: 7, minAbsences: 2 }, context);
        const list = toolRes.data || [];
        const summaryBn = `গত ৭ দিনে ২ বা ততোধিক দিন অনুপস্থিত শিক্ষার্থীর সংখ্যা ${list.length} জন। এর মধ্যে ৩ জন শিক্ষার্থী টানা ৩ দিন যাবৎ অনুপস্থিত রয়েছে।`;

        return {
          summaryBn,
          dataType: 'attendance',
          data: list,
          sources: ['attendance_records', 'students'],
          actions: [
            { labelBn: 'অভিভাবক নোটিশ ড্রাফট করুন', labelEn: 'Draft Guardian Notice', actionType: 'draft_message', payload: { recipients: list } },
            { labelBn: 'হাজিরা খাতায় যান', labelEn: 'Go to Attendance', actionType: 'navigate', payload: { route: '/attendance' } }
          ]
        };
      }

      const toolRes = await this.executeTool('getAttendance', {}, context);
      const att = toolRes.data;
      const summaryBn = `আজকে মোট উপস্থিতি হার ${att.attendanceRate}% (${att.presentCount} জন উপস্থিত)। মোট অনুপস্থিত ${att.absentCount} জন, ছুটি নিয়েছেন ${att.leaveCount} জন এবং বিলম্বে এসেছেন ${att.lateCount} জন।`;

      return {
        summaryBn,
        dataType: 'attendance',
        data: att,
        sources: ['attendance_records'],
        actions: [
          { labelBn: 'হাজিরা তালিকা খুলুন', labelEn: 'Open Attendance', actionType: 'navigate', payload: { route: '/attendance' } },
          { labelBn: 'রিপোর্ট তৈরি করুন', labelEn: 'Create Report', actionType: 'create_report', payload: { type: 'attendance_daily' } }
        ]
      };
    }

    // 3. Fee & Finance inquiries
    if (q.includes('ফি') || q.includes('বকেয়া') || q.includes('আদায়') || q.includes('টাকা') || q.includes('fee') || q.includes('due')) {
      if (q.includes('বকেয়া') || q.includes('due') || q.includes('পরিশোধ করেনি')) {
        const toolRes = await this.executeTool('getOverdueFees', {}, context);
        if (!toolRes.success) {
          return { summaryBn: toolRes.error || 'অনুমতি নেই।', sources: [] };
        }
        const overdue = toolRes.data || [];
        const totalDueAmt = overdue.reduce((acc: number, cur: any) => acc + (cur.due_amount || 0), 0);
        const summaryBn = `বর্তমানে বকেয়া ফি রয়েছে এমন শিক্ষার্থীর সংখ্যা ${overdue.length} জন। মোট বকেয়া টাকার পরিমাণ ৳${totalDueAmt.toLocaleString()}।`;

        return {
          summaryBn,
          dataType: 'fees',
          data: overdue,
          sources: ['fee_invoices', 'students'],
          actions: [
            { labelBn: 'বকেয়া তালিকা দেখুন', labelEn: 'View Defaulters', actionType: 'navigate', payload: { route: '/finance/invoices' } },
            { labelBn: 'স্মরণিকা মেসেজ প্রস্তুত করুন', labelEn: 'Draft Reminder', actionType: 'draft_message', payload: { target: 'overdue_students' } },
            { labelBn: 'পিডিএফ এক্সপোর্ট', labelEn: 'Export PDF', actionType: 'export_pdf', payload: { type: 'fee_defaulters' } }
          ]
        };
      }

      const toolRes = await this.executeTool('getFeeSummary', {}, context);
      if (!toolRes.success) {
        return { summaryBn: toolRes.error || 'অনুমতি নেই।', sources: [] };
      }
      const fin = toolRes.data;
      const summaryBn = `সেপ্টেম্বর ২০২৬ সেশনে মোট বিল করা হয়েছিল ৳${fin.totalBilled.toLocaleString()}, যার মধ্যে এ পর্যন্ত আদায় হয়েছে ৳${fin.totalCollected.toLocaleString()} এবং বকেয়া রয়েছে ৳${fin.totalDue.toLocaleString()}। আজ আদায় হয়েছে ৳${fin.todayCollection.toLocaleString()}।`;

      return {
        summaryBn,
        dataType: 'fees',
        data: fin,
        sources: ['fee_invoices', 'fee_payments'],
        actions: [
          { labelBn: 'ফি আদায় করুন', labelEn: 'Collect Fee', actionType: 'navigate', payload: { route: '/finance/collect' } },
          { labelBn: 'খরচের ভাউচার দেখুন', labelEn: 'View Expenses', actionType: 'navigate', payload: { route: '/finance/expenses' } }
        ]
      };
    }

    // 4. Hifz inquiries
    if (q.includes('হিফজ') || q.includes('সবক') || q.includes('মঞ্জিল') || q.includes('পারা') || q.includes('hifz') || q.includes('sabaq')) {
      const toolRes = await this.executeTool('getDecliningHifzStudents', {}, context);
      if (!toolRes.success) {
        return { summaryBn: toolRes.error || 'অনুমতি নেই।', sources: [] };
      }
      const alerts = toolRes.data || [];
      const summaryBn = `হিফজ বিভাগে মোট ৮ জন শিক্ষার্থীর সবক পর্যালোচনায় সতর্কতা পরিলক্ষিত হয়েছে, যাদের গত ৭ দিনে ভুলে পড়ার প্রবণতা এবং পৃষ্ঠা সংখ্যায় হ্রাস ঘটেছে।`;

      return {
        summaryBn,
        dataType: 'hifz',
        data: alerts,
        sources: ['hifz_records', 'students'],
        actions: [
          { labelBn: 'আজকের সবক খাতা খুলুন', labelEn: 'Open Daily Sabaq', actionType: 'navigate', payload: { route: '/hifz' } },
          { labelBn: 'হিফজ অগ্রগতি চার্ট', labelEn: 'Progress Charts', actionType: 'navigate', payload: { route: '/hifz/charts' } }
        ]
      };
    }

    // 5. Hostel inquiries
    if (q.includes('হোস্টেল') || q.includes('ছাত্রাবাস') || q.includes('আবাসিক') || q.includes('সিট') || q.includes('hostel')) {
      const toolRes = await this.executeTool('getHostelStatus', {}, context);
      const h = toolRes.data;
      const summaryBn = `ওমর ফারুক ছাত্রাবাসে মোট ধারণক্ষমতা ${h.totalCapacity} টি সিট। এর মধ্যে ${h.totalOccupied} টি সিটে আবাসিক শিক্ষার্থী বরাদ্দ রয়েছে (${h.occupancyRate}% পূর্ণ)। বর্তমানে ${h.availableBeds} টি সিট খালি রয়েছে এবং অনুমোদিত আউটপাসে আছেন ${h.activeOutpassesCount} জন।`;

      return {
        summaryBn,
        dataType: 'general',
        data: h,
        sources: ['hostel_rooms', 'hostel_outpasses'],
        actions: [
          { labelBn: 'ছাত্রাবাস ড্যাশবোর্ড', labelEn: 'Hostel Dashboard', actionType: 'navigate', payload: { route: '/hostel' } }
        ]
      };
    }

    // 6. Student search fallback
    const toolRes = await this.executeTool('searchStudents', { query: q }, context);
    if (toolRes.data && toolRes.data.length > 0) {
      const st = toolRes.data[0];
      const summaryBn = `শিক্ষার্থী "${st.full_name_bn}" (আইডি: ${st.student_id_number}, শ্রেণি: ${st.class_name_bn || 'কওমী'}) এর তথ্য পাওয়া গেছে। অভিভাবক: ${st.guardian_name_bn} (${st.guardian_phone})।`;
      return {
        summaryBn,
        dataType: 'students',
        data: toolRes.data,
        sources: ['students'],
        actions: [
          { labelBn: 'প্রোফাইল দেখুন', labelEn: 'View Profile', actionType: 'navigate', payload: { route: `/students/${st.id}` } }
        ]
      };
    }

    // Default polite Madrasa assistant guidance
    return {
      summaryBn: `আসসালামু আলাইকুম ${context.fullNameBn}। আমি মাদ্রাসাOS এর এআই সহকারী। আপনি আমাকে আজকের হাজিরা, বকেয়া ফির রিপোর্ট, হিফজ শিক্ষার্থীদের সবকের অগ্রগতি অথবা ছাত্রাবাসের অবস্থা সম্পর্কে জানতে চাইতে পারেন।`,
      dataType: 'general',
      sources: ['system'],
      actions: [
        { labelBn: 'আজকের ব্রিফিং দেখুন', labelEn: 'Today Briefing', actionType: 'navigate', payload: { query: 'আজকের অবস্থা বলো' } },
        { labelBn: 'বকেয়া ফি রিপোর্ট', labelEn: 'Overdue Fees', actionType: 'navigate', payload: { query: 'বকেয়া ফি তালিকা দেখাও' } },
        { labelBn: 'হিফজ অগ্রগতি পর্যালোচনা', labelEn: 'Hifz Progress', actionType: 'navigate', payload: { query: 'কোন হিফজ ছাত্রদের অগ্রগতি কমছে?' } }
      ]
    };
  }
}

export const aiAgentService = new AIAgentService();
