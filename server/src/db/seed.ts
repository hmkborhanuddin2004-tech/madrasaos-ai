import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function seedDatabase(): Promise<void> {
  const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1');
  if (existingOrg) {
    await db.run("UPDATE workflow_approvals SET status = 'pending', decided_by = NULL, decided_at = NULL WHERE id = 'appr_demo_01'");
    return; // Already seeded
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const hifzHash = await bcrypt.hash('hifz123', 10);
  const accountHash = await bcrypt.hash('account123', 10);
  const parentHash = await bcrypt.hash('parent123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  const now = new Date().toISOString();
  const todayStr = '2026-09-20';

  // 1. Organization & Institution
  await db.run(`
    INSERT INTO organizations (id, name, code, contact_email, contact_phone, subscription_plan, is_active, created_at)
    VALUES ('org_main', 'আল-জামিয়াতুল ইসলামিয়া ট্রাস্ট বাংলাদেশ', 'AJITB-01', 'info@aljamiatrust.org', '01711111111', 'enterprise', 1, ?)
  `, [now]);

  await db.run(`
    INSERT INTO institutions (id, organization_id, name_bn, name_en, name_ar, code, address, phone, enabled_models, settings_json, created_at)
    VALUES (
      'inst_main',
      'org_main',
      'দারুল উলূম সেন্ট্রাল মাদ্রাসা, ঢাকা',
      'Darul Uloom Central Madrasa, Dhaka',
      'جامعة دار العلوم المركزية دكا',
      'DUCM-DHAKA',
      'প্লট ১৪, সেকশন ৬, মিরপুর, ঢাকা-১২১৬',
      '01711111111',
      '["qawmi","hifz","boarding"]',
      '{"hijriDateEnabled":true,"currency":"BDT","hifzTrackingMethod":"sabaq_sabqi_manzil","attendanceType":"daily_once","autoSmsGuardianOnAbsence":false,"currentSessionId":"session_2026"}',
      ?
    )
  `, [now]);

  // 2. Branches
  await db.run(`
    INSERT INTO branches (id, institution_id, name_bn, name_en, address, phone, is_main_branch, created_at)
    VALUES 
    ('branch_mirpur', 'inst_main', 'প্রধান ক্যাম্পাস (মিরপুর)', 'Main Campus (Mirpur)', 'সেকশন ৬, মিরপুর, ঢাকা', '01711111111', 1, ?),
    ('branch_uttara', 'inst_main', 'উত্তরা শাখা ক্যাম্পাস', 'Uttara Branch Campus', 'সেক্টর ৪, উত্তরা, ঢাকা', '01722222222', 0, ?)
  `, [now, now]);

  // 3. Academic Session
  await db.run(`
    INSERT INTO academic_sessions (id, tenant_id, name_bn, name_en, start_date, end_date, is_current)
    VALUES ('session_2026', 'inst_main', '২০২৫-২০২৬ (১৪৪৬-১৪৪৭ হিজরী)', 'Session 2025-2026', '2025-07-01', '2026-06-30', 1)
  `);

  // 4. Classes (Jamaats)
  const classesData = [
    { id: 'cls_nahbemir', dept: 'কওমী বিভাগ', bn: 'নাহবেমীর জামাত', en: 'Nahbemir', ord: 1 },
    { id: 'cls_hidayah', dept: 'কওমী বিভাগ', bn: 'হেদায়াতুন্নাহু জামাত', en: 'Hidayatun Nahw', ord: 2 },
    { id: 'cls_kafiya', dept: 'কওমী বিভাগ', bn: 'কাফিয়া জামাত', en: 'Kafiya', ord: 3 },
    { id: 'cls_mishkat', dept: 'কওমী বিভাগ', bn: 'মিশকাত জামাত', en: 'Mishkatul Masabih', ord: 4 },
    { id: 'cls_dawra', dept: 'কওমী বিভাগ', bn: 'দাওরায়ে হাদীস (তাকমীল)', en: 'Dawra-e-Hadith', ord: 5 },
    { id: 'cls_hifz_1', dept: 'হিফজুল কুরআন বিভাগ', bn: 'হিফজ ১ম বর্ষ (শাখা আলিফ)', en: 'Hifz Year 1 (A)', ord: 6 },
    { id: 'cls_hifz_2', dept: 'হিফজুল কুরআন বিভাগ', bn: 'হিফজ ২য় বর্ষ (শাখা বা)', en: 'Hifz Year 2 (B)', ord: 7 },
  ];

  for (const c of classesData) {
    await db.run(`
      INSERT INTO classes (id, tenant_id, branch_id, department, name_bn, name_en, order_index)
      VALUES (?, 'inst_main', 'branch_mirpur', ?, ?, ?, ?)
    `, [c.id, c.dept, c.bn, c.en, c.ord]);
  }

  // 5. Users
  const users = [
    { id: 'usr_super', u: 'superadmin', p: '01700000001', fn_bn: 'সুপার এডমিন', fn_en: 'Super Admin', r: 'super_admin', h: passwordHash },
    { id: 'usr_muhtamim', u: 'muhtamim', p: '01711111111', fn_bn: 'মাওলানা আব্দুল কুদ্দুস', fn_en: 'Maulana Abdul Quddus', r: 'madrasa_admin', h: passwordHash },
    { id: 'usr_principal', u: 'principal', p: '01711111112', fn_bn: 'মাওলানা মাহমুদুল হাসান', fn_en: 'Maulana Mahmudul Hasan', r: 'principal', h: passwordHash },
    { id: 'usr_rashid', u: 'teacher_rashid', p: '01711111113', fn_bn: 'মাওলানা হারুনুর রশিদ', fn_en: 'Maulana Harunur Rashid', r: 'teacher', h: teacherHash, assigned: '["cls_nahbemir","cls_kafiya"]' },
    { id: 'usr_zubair', u: 'hafez_zubair', p: '01711111114', fn_bn: 'হাফেজ ক্বারী জুবায়ের আহমেদ', fn_en: 'Hafez Qari Zubair Ahmed', r: 'hifz_teacher', h: hifzHash, assigned: '["cls_hifz_1","cls_hifz_2"]' },
    { id: 'usr_faruq', u: 'accountant_faruq', p: '01711111115', fn_bn: 'মুহাম্মদ ফারুক হোসেন', fn_en: 'Mohammad Faruq Hossain', r: 'accountant', h: accountHash },
    { id: 'usr_ismail', u: 'warden_ismail', p: '01711111116', fn_bn: 'মাওলানা ইসমাইল হোসেন', fn_en: 'Maulana Ismail Hossain', r: 'hostel_manager', h: teacherHash },
    { id: 'usr_salam', u: 'guardian_salam', p: '01811111111', fn_bn: 'জনাব আব্দুর সালাম', fn_en: 'Abdur Salam', r: 'guardian', h: parentHash, linked: '["std_001"]' },
    { id: 'usr_abdullah', u: 'student_abdullah', p: '01911111111', fn_bn: 'আব্দুল্লাহ আল-মামুন', fn_en: 'Abdullah Al-Mamun', r: 'student', h: studentHash }
  ];

  for (const u of users) {
    await db.run(`
      INSERT INTO users (id, tenant_id, branch_id, username, phone, full_name_bn, full_name_en, role, password_hash, assigned_class_ids, linked_student_ids, created_at)
      VALUES (?, 'inst_main', 'branch_mirpur', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [u.id, u.u, u.p, u.fn_bn, u.fn_en, u.r, u.h, u.assigned || '[]', u.linked || '[]', now]);
  }

  // 6. Generate 100+ Students with realistic Bangladeshi Madrasa names
  const firstNames = ['আব্দুল্লাহ', 'মুহাম্মদ', 'আবু বকর', 'ওমর', 'উসমান', 'আলী', 'জুবায়ের', 'তালহা', 'সাআদ', 'আব্দুর রহমান', 'হাসান', 'হুসাইন', 'আনাস', 'খালেদ', 'আম্মার', 'বেলাল', 'হুযায়ফা', 'মুসআব', 'সালমান', 'তারিক', 'ইবরাহীম', 'ইউসুফ', 'ইয়াকুব', 'মুসা', 'দাউদ', 'সুলাইমান', 'ইয়াহিয়া', 'জাকারিয়া', 'আইয়ুব', 'ইসমাইল', 'তাহমিদ', 'মুস্তাকিম', 'নাঈম', 'আরিফ', 'জাহিদুল', 'শফিকুল', 'রাকিবুল', 'তৌহিদ', 'মাহবুব', 'মিজানুর'];
  const lastNames = ['আল-মামুন', 'ফারুক', 'সিদ্দিক', 'হোসেন', 'আহমেদ', 'মোল্লা', 'হাসান', 'মাহমুদ', 'খান', 'চৌধুরী', 'শেখ', 'ইসলাম', 'বখত', 'তালুকদার', 'ভূঁইয়া', 'আকন্দ', 'সরদার', 'পাটোয়ারী', 'রেজা', 'মুরাদ'];

  const studentInserts: string[] = [];
  const classIds = ['cls_nahbemir', 'cls_hidayah', 'cls_kafiya', 'cls_mishkat', 'cls_dawra', 'cls_hifz_1', 'cls_hifz_2'];

  let count = 1;
  for (let i = 0; i < firstNames.length; i++) {
    for (let j = 0; j < 3; j++) {
      const fn = firstNames[i];
      const ln = lastNames[(i + j) % lastNames.length];
      const fullNameBn = `${fn} ${ln}`;
      const id = count === 1 ? 'std_001' : `std_${String(count).padStart(3, '0')}`;
      const studentIdNum = `DUCM-2026-${String(count).padStart(3, '0')}`;
      const classId = classIds[count % classIds.length];
      const isHifz = classId.includes('hifz') || count % 4 === 0 ? 1 : 0;
      const isResidential = count % 2 === 0 ? 1 : 0;
      const monthlyFee = isResidential ? 4500 : 2000;
      const roll = String((count % 35) + 1);
      const guardianName = `জনাব ${firstNames[(i + 5) % firstNames.length]} ${ln}`;
      const guardianPhone = count === 1 ? '01811111111' : `018${String(10000000 + count).slice(1)}`;

      await db.run(`
        INSERT INTO students (
          id, tenant_id, branch_id, student_id_number, full_name_bn, full_name_en,
          date_of_birth, admission_date, class_id, section, roll_number, status,
          is_residential, is_hifz_student, guardian_name_bn, guardian_phone,
          guardian_relation, emergency_contact, monthly_fee, address, created_at
        ) VALUES (
          ?, 'inst_main', 'branch_mirpur', ?, ?, ?,
          '2012-05-15', '2025-07-01', ?, 'Alif', ?, 'active',
          ?, ?, ?, ?,
          'পিতা', ?, ?, 'মিরপুর, ঢাকা', ?
        )
      `, [
        id, studentIdNum, fullNameBn, `${fn} ${ln}`,
        classId, roll,
        isResidential, isHifz, guardianName, guardianPhone,
        guardianPhone, monthlyFee, now
      ]);

      count++;
      if (count > 105) break;
    }
    if (count > 105) break;
  }

  // 7. Attendance Records for Today (2026-09-20) and past 5 days
  const allStudents = await db.all<{ id: string; class_id: string }>('SELECT id, class_id FROM students WHERE tenant_id = "inst_main"');
  const pastDates = ['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'];

  for (const date of pastDates) {
    for (const s of allStudents) {
      // Abdullah Al-Mamun (std_001) and student 12, 23 will have repeated absences for testing
      let status = 'present';
      const isRepeatedAbsentStudent = (s.id === 'std_001' || s.id === 'std_012' || s.id === 'std_023');
      
      if (isRepeatedAbsentStudent && (date === '2026-09-18' || date === '2026-09-19' || date === '2026-09-20')) {
        status = 'absent';
      } else {
        const rand = (parseInt(s.id.replace(/\D/g, '')) * 13 + date.charCodeAt(9)) % 100;
        if (rand < 6) status = 'absent';
        else if (rand < 9) status = 'late';
        else status = 'present';
      }

      await db.run(`
        INSERT INTO attendance_records (id, tenant_id, branch_id, class_id, student_id, date, status, check_in_time, remarks, recorded_by_user_id)
        VALUES (?, 'inst_main', 'branch_mirpur', ?, ?, ?, ?, ?, ?, 'usr_rashid')
      `, [`att_${s.id}_${date}`, s.class_id, s.id, date, status, status === 'present' ? '07:45' : null, status === 'absent' ? 'অসুস্থতা / অনুপস্থিত' : null]);
    }
  }

  // 8. Hifz Records
  const hifzStudents = await db.all<{ id: string }>('SELECT id FROM students WHERE is_hifz_student = 1');
  const surahs = ['সূরা আল-বাকারাহ', 'সূরা আল-ইমরান', 'সূরা আন-নিসা', 'সূরা আল-মায়িদাহ', 'সূরা আল-আনআম', 'সূরা আল-আরাফ', 'সূরা আম্মা'];

  for (let idx = 0; idx < hifzStudents.length; idx++) {
    const hs = hifzStudents[idx];
    const surah = surahs[idx % surahs.length];
    const rating = idx % 5 === 0 ? 'weak' : idx % 3 === 0 ? 'good' : 'excellent';
    const mistakes = rating === 'weak' ? 5 : rating === 'good' ? 2 : 0;

    await db.run(`
      INSERT INTO hifz_records (
        id, tenant_id, student_id, teacher_id, date,
        sabaq_para, sabaq_surah, sabaq_ayah_range, sabaq_pages, sabaq_rating,
        sabqi_para, sabqi_pages, sabqi_mistakes, manzil_para, manzil_mistakes, teacher_notes, created_at
      ) VALUES (
        ?, 'inst_main', ?, 'usr_zubair', '2026-09-20',
        ?, ?, '১-২৫', 1.0, ?,
        ?, 3.0, ?, ?, ?, ?, ?
      )
    `, [
      `hifz_${hs.id}_20260920`, hs.id,
      (idx % 30) + 1, surah, rating,
      ((idx + 28) % 30) + 1, mistakes, ((idx + 20) % 30) + 1, mistakes > 2 ? 3 : 1,
      rating === 'weak' ? 'উচ্চারণ ও হরফ টানার দিকে সতর্কতা প্রয়োজন' : 'আলহামদুলিল্লাহ ভালো তেলাওয়াত', now
    ]);
  }

  // 9. Kitab Progress
  await db.run(`
    INSERT INTO kitab_progress (id, tenant_id, class_id, subject_name_bn, kitab_name, teacher_name_bn, date, bab_or_chapter, lesson_title, pages_completed, total_kitab_pages, remarks)
    VALUES 
    ('kp_001', 'inst_main', 'cls_nahbemir', 'আরবি ব্যাকরণ', 'নাহবেমীর', 'মাওলানা হারুনুর রশিদ', '2026-09-20', 'ফসল ৩: মারফূআত পরিচয়', 'ফায়েল ও নায়েবে ফায়েলের হুকুম', 45, 120, 'আজকে ভালো আলোচনা হয়েছে। আগামী শনিবার পরীক্ষা।'),
    ('kp_002', 'inst_main', 'cls_kafiya', 'উসূলুন নাহব', 'আল-কাফিয়া', 'মাওলানা হারুনুর রশিদ', '2026-09-20', 'বাবুল ইরআব', 'ইসম গাইরে মুনসারিফের আলোচনা', 80, 210, 'ছাত্ররা মনোযোগ সহকারে অনুধাবন করেছে।'),
    ('kp_003', 'inst_main', 'cls_hidayah', 'ফিকহুল ইসলাম', 'আল-হিদায়া ১ম খণ্ড', 'মাওলানা মাহমুদুল হাসান', '2026-09-20', 'কিতাবুয যাকাত', 'যাকাত ওয়াজিব হওয়ার শর্তাবলী', 112, 340, 'মাসায়েল বিস্তারিত আলোচনা করা হয়েছে।')
  `);

  // 10. Exams & Marks
  await db.run(`
    INSERT INTO exams (id, tenant_id, name_bn, term, academic_year, start_date, end_date, is_published)
    VALUES ('exam_first_term_2026', 'inst_main', '১ম সাময়িক পরীক্ষা ২০২৬', 'first_term', '2025-2026', '2026-08-10', '2026-08-20', 1)
  `);

  const sampleMarkStudents = allStudents.slice(0, 15);
  for (const ms of sampleMarkStudents) {
    await db.run(`
      INSERT INTO exam_marks (id, tenant_id, exam_id, student_id, class_id, subject_name_bn, total_marks, obtained_marks, letter_grade, grade_point, is_absent)
      VALUES 
      (?, 'inst_main', 'exam_first_term_2026', ?, ?, 'নাহবেমীর ও আরবি ব্যাকরণ', 100, 88, 'A+', 5.0, 0),
      (?, 'inst_main', 'exam_first_term_2026', ?, ?, 'কুরআন তিলাওয়াত ও হিফজ', 100, 92, 'A+', 5.0, 0)
    `, [
      `mark_${ms.id}_sub1`, ms.id, ms.class_id,
      `mark_${ms.id}_sub2`, ms.id, ms.class_id
    ]);
  }

  // 11. Fee Invoices & Payments
  let invoiceCount = 1;
  for (let i = 0; i < allStudents.length; i++) {
    const st = allStudents[i];
    const totalAmount = i % 2 === 0 ? 4500 : 2000;
    const isPaid = i % 3 === 0;
    const isOverdue = i % 7 === 0;
    const paidAmount = isPaid ? totalAmount : (isOverdue ? 0 : 1000);
    const dueAmount = totalAmount - paidAmount;
    const status = isPaid ? 'paid' : (isOverdue ? 'overdue' : 'partially_paid');
    const invId = `inv_${st.id}_202609`;

    await db.run(`
      INSERT INTO fee_invoices (id, tenant_id, invoice_number, student_id, month, year, fee_items_json, total_amount, discount_amount, paid_amount, due_amount, status, due_date, created_at)
      VALUES (?, 'inst_main', ?, ?, 'সেপ্টেম্বর', 2026, ?, ?, 0, ?, ?, ?, '2026-09-10', ?)
    `, [
      invId, `INV-202609-${String(invoiceCount).padStart(4, '0')}`, st.id,
      JSON.stringify([{ title: 'মাসিক বেতন', amount: 2000 }, ...(totalAmount > 2000 ? [{ title: 'আবাসিক খাবার ও হোস্টেল ফি', amount: 2500 }] : [])]),
      totalAmount, paidAmount, dueAmount, status, now
    ]);

    if (paidAmount > 0) {
      await db.run(`
        INSERT INTO fee_payments (id, tenant_id, invoice_id, payment_number, student_id, amount, payment_method, transaction_id, status, received_by_user_id, paid_at)
        VALUES (?, 'inst_main', ?, ?, ?, ?, ?, ?, 'success', 'usr_faruq', ?)
      `, [
        `pay_${st.id}_202609`, invId, `RCP-202609-${String(invoiceCount).padStart(4, '0')}`, st.id,
        paidAmount, i % 2 === 0 ? 'bkash' : 'cash', i % 2 === 0 ? `TRX_BKASH_${100000 + invoiceCount}` : null, todayStr
      ]);
    }

    invoiceCount++;
  }

  // 12. Expenses
  await db.run(`
    INSERT INTO expenses (id, tenant_id, branch_id, category, amount, payment_method, voucher_number, payee, approved_by, date, description)
    VALUES 
    ('exp_001', 'inst_main', 'branch_mirpur', 'food_ration', 42500, 'bank', 'VOUCH-2026-081', 'মেসার্স মদিনা ট্রেডার্স (চাউল ও ডাল)', 'মাওলানা আব্দুল কুদ্দুস', '2026-09-18', 'আবাসিক শিক্ষার্থীদের ১৫ দিনের চাউল ও নিত্যপ্রয়োজনীয় মুদি সামগ্রী ক্রয়'),
    ('exp_002', 'inst_main', 'branch_mirpur', 'utility', 14200, 'bkash', 'VOUCH-2026-082', 'ডেসকো বিদ্যুৎ বিল (মিরপুর ক্যাম্পাস)', 'মুহাম্মদ ফারুক হোসেন', '2026-09-15', 'আগস্ট মাসের বিদ্যুৎ বিল পরিশোধ'),
    ('exp_003', 'inst_main', 'branch_mirpur', 'maintenance', 8500, 'cash', 'VOUCH-2026-083', 'আল-ফালাহ সেনিটারি ওয়ার্কস', 'মুহাম্মদ ফারুক হোসেন', '2026-09-19', 'আবাসিক ভবনের পানির পাম্প ও অজুখখানার পাইপলাইন মেরামত')
  `);

  // 13. Hostel Rooms & Beds
  const beds101 = [
    { bedNumber: '101-A', studentId: 'std_001', studentNameBn: 'আব্দুল্লাহ আল-মামুন', status: 'occupied' },
    { bedNumber: '101-B', studentId: 'std_002', studentNameBn: 'মুহাম্মদ ফারুক', status: 'occupied' },
    { bedNumber: '101-C', status: 'available' },
    { bedNumber: '101-D', status: 'available' },
  ];
  await db.run(`
    INSERT INTO hostel_rooms (id, tenant_id, branch_id, building_name, room_number, floor, capacity, occupied, beds_json)
    VALUES 
    ('room_101', 'inst_main', 'branch_mirpur', 'ওমর ফারুক (রা.) ছাত্রাবাস', '১০১', 1, 4, 2, ?),
    ('room_102', 'inst_main', 'branch_mirpur', 'ওমর ফারুক (রা.) ছাত্রাবাস', '১০২', 1, 6, 5, ?),
    ('room_201', 'inst_main', 'branch_mirpur', 'ওমর ফারুক (রা.) ছাত্রাবাস', '২০১', 2, 8, 8, ?)
  `, [
    JSON.stringify(beds101),
    JSON.stringify([{ bedNumber: '102-A', status: 'occupied' }, { bedNumber: '102-B', status: 'occupied' }, { bedNumber: '102-C', status: 'occupied' }, { bedNumber: '102-D', status: 'occupied' }, { bedNumber: '102-E', status: 'occupied' }, { bedNumber: '102-F', status: 'available' }]),
    JSON.stringify(Array.from({ length: 8 }).map((_, idx) => ({ bedNumber: `201-${idx + 1}`, status: 'occupied' })))
  ]);

  // 14. Admissions
  await db.run(`
    INSERT INTO admissions (id, tenant_id, application_number, applicant_name_bn, applicant_name_en, date_of_birth, guardian_name_bn, guardian_phone, applied_department, applied_class, status, interview_score, notes, created_at)
    VALUES 
    ('adm_001', 'inst_main', 'ADM-2026-081', 'তাহমিদুল ইসলাম', 'Tahmidul Islam', '2015-08-12', 'মো: রফিকুল ইসলাম', '01733333331', 'হিফজুল কুরআন বিভাগ', 'হিফজ ১ম বর্ষ', 'submitted', NULL, 'নূরানী সমাপ্ত করেছে। তেলাওয়াত স্পষ্ট।', ?),
    ('adm_002', 'inst_main', 'ADM-2026-082', 'মুস্তাফিজুর রহমান', 'Mustafizur Rahman', '2013-03-22', 'মাওলানা নুরুল হক', '01733333332', 'কওমী বিভাগ', 'নাহবেমীর জামাত', 'interview_scheduled', 85.0, 'সাক্ষাৎকার আগামী ২২ সেপ্টেম্বর নির্ধারিত', ?),
    ('adm_003', 'inst_main', 'ADM-2026-083', 'মাহদী হাসান', 'Mahdi Hasan', '2014-11-05', 'জনাব কামাল উদ্দিন', '01733333333', 'কওমী বিভাগ', 'হেদায়াতুন্নাহু জামাত', 'approved', 92.5, 'ভর্তি ফি পরিশোধের অপেক্ষায়', ?)
  `, [now, now, now]);

  // 15. Library Books
  await db.run(`
    INSERT INTO library_books (id, tenant_id, title_bn, title_ar, author, category, isbn, total_copies, available_copies)
    VALUES 
    ('book_001', 'inst_main', 'সহীহুল বুখারী (পূর্ণাঙ্গ ৮ খণ্ড)', 'صحيح البخاري', 'ইমাম বুখারী (রহ.)', 'হাদীস শাস্ত্র', '978-984-512-001', 10, 7),
    ('book_002', 'inst_main', 'আল-হিদায়া ফী শারহি বিদায়াতিল মুবতাদী', 'الهداية شرح بداية المبتدي', 'আল্লামা বুরহানুদ্দীন আল-মারগীনানী (রহ.)', 'ফিকহুল ইসলাম', '978-984-512-002', 15, 12),
    ('book_003', 'inst_main', 'মুআত্তা ইমাম মালিক', 'موطأ الإمام مالك', 'ইমাম মালিক (রহ.)', 'হাদীস শাস্ত্র', '978-984-512-003', 8, 8),
    ('book_004', 'inst_main', 'তাফসীরে ইবনে কাসীর (১০ খণ্ড)', 'تفسير ابن كثير', 'হাফেজ ইমাদুদ্দীন ইবনে কাসীর (রহ.)', 'তাফসীর', '978-984-512-004', 6, 4)
  `);

  // 16. 20 Pre-Built Automation Workflows
  const prebuiltWorkflows = [
    { id: 'wf_01', name: 'দৈনিক সকালের মাদ্রাসা ব্রিফিং', desc: 'প্রতিদিন সকাল ৭:০০ টায় হাজিরা, হিফজ এবং ফির সংক্ষিপ্ত রিপোর্ট স্বয়ংক্রিয়ভাবে প্রস্তুত করে এডমিনকে নোটিফিকেশন পাঠায়', cat: 'general', trig: 'schedule' },
    { id: 'wf_02', name: 'টানা ৩ দিন অনুপস্থিতি সতর্কতা', desc: 'কোনো শিক্ষার্থী ৭ দিনের মধ্যে ৩ দিন বা তার বেশি অনুপস্থিত থাকলে শ্রেণি শিক্ষক ও অভিভাবককে সতর্কবার্তা ড্রাফট করে', cat: 'attendance', trig: 'event' },
    { id: 'wf_03', name: 'মাসিক বকেয়া ফি স্মরণিকা (SMS Reminder)', desc: 'প্রতি মাসের ৫ তারিখ যাদের বকেয়া আছে তাদের অভিভাবকদের কাছে নম্র ভাষায় মেসেজ ড্রাফট ও অনুমোদনের পর প্রেরণ', cat: 'fees', trig: 'schedule' },
    { id: 'wf_04', name: 'ফি পরিশোধ ডিজিটাল রসিদ ও নিশ্চয়তা', desc: 'bKash বা ক্যাশে ফি জমা হওয়ার সাথে সাথে অভিভাবককে ডিজিটাল ভাউচার নম্বরসহ নিশ্চয়তা মেসেজ', cat: 'fees', trig: 'event' },
    { id: 'wf_05', name: 'হিফজ অগ্রগতি অবনতি সতর্কতা (Declining Progress)', desc: 'গত ১৪ দিনে যাদের সবকের ভুল বৃদ্ধি পেয়েছে এবং অগ্রগতি কমেছে তাদের তালিকা তৈরি করে উস্তাদকে অবহিতকরণ', cat: 'hifz', trig: 'event' },
    { id: 'wf_06', name: 'আবাসিক ছাত্রাবাস রাত্রি ১০টা হাজিরা অ্যালার্ট', desc: 'ছাত্রাবাসের কোনো শিক্ষার্থী অনুমোদিত আউটপাস ছাড়া অনুপস্থিত থাকলে হোস্টেল সুপারকে তাৎক্ষণিক নোটিফিকেশন', cat: 'hostel', trig: 'schedule' },
    { id: 'wf_07', name: 'পরীক্ষার সময়সূচি ঘোষণা ও নোটিশ', desc: 'সাময়িক পরীক্ষা শুরু হওয়ার ৭ দিন পূর্বে পরীক্ষার রুটিন অভিভাবক ও ছাত্র ড্যাশবোর্ডে স্বয়ংক্রিয় প্রকাশ', cat: 'academic', trig: 'event' },
    { id: 'wf_08', name: 'ফলাফল প্রকাশ ও ডিজিটাল নম্বরপত্র (Marksheet PDF)', desc: 'পরীক্ষার ফল চূড়ান্ত হলে প্রতিটি শিক্ষার্থীর জন্য আলাদা মার্কশিট পিডিএফ তৈরি ও অভিভাবককে নোটিফিকেশন', cat: 'academic', trig: 'event' },
    { id: 'wf_09', name: 'নতুন অনলাইন ভর্তি আবেদন পর্যালোচনা নোটিশ', desc: 'নতুন শিক্ষার্থী ভর্তি ফর্ম পূরণ করলে ভর্তি কমিটির নিকট পর্যালোচনা টাস্ক তৈরি', cat: 'general', trig: 'event' },
    { id: 'wf_10', name: 'ভর্তি চূড়ান্তকরণ ও ডিজিটাল আইডি কার্ড প্রদান', desc: 'ভর্তি অনুমোদন হলে আইডি নম্বর নির্ধারণ এবং স্বয়ংক্রিয় রোল তালিকাভুক্তকরণ', cat: 'general', trig: 'event' },
    { id: 'wf_11', name: 'লাইব্রেরি বই ফেরত বিলম্ব সতর্কতা', desc: '১৪ দিন অতিবাহিত হওয়ার পরও কিতাব ফেরত না দিলে শিক্ষার্থী ও উস্তাদকে স্মরণিকা নোটিশ', cat: 'general', trig: 'schedule' },
    { id: 'wf_12', name: 'উস্তাদগণের দৈনিক হাজিরা ও ক্লাস মনিটরিং', desc: 'প্রতিদিন সকাল ৯:৩০ টায় কোনো শ্রেণি শিক্ষক অনুপস্থিত থাকলে বিকল্প শিক্ষক নির্ধারণের প্রস্তাবনা', cat: 'attendance', trig: 'schedule' },
    { id: 'wf_13', name: 'দিনাবসান মাদ্রাসা হিসাব ও রিপোর্ট (End-of-Day Report)', desc: 'প্রতিদিন রাত ৯:০০ টায় সারাদিনের মোট ফি আদায়, খরচ এবং উপস্থিতির চূড়ান্ত হিসাব বিবরণী', cat: 'fees', trig: 'schedule' },
    { id: 'wf_14', name: 'মুহতামিমের মাসিক সারসংক্ষেপ প্রতিবেদন', desc: 'মাসের ১ তারিখে পূর্ণাঙ্গ শিক্ষা, হিফজ ও আর্থিক অডিট রিপোর্ট মুহতামিম ড্যাশবোর্ডে প্রস্তুতকরণ', cat: 'general', trig: 'schedule' },
    { id: 'wf_15', name: 'হিফজ সান্ধ্যকালীন অভিভাবক ব্রিফ', desc: 'প্রতিদিন আসরের পর অভিভাবককে তার সন্তানের আজকের সবক, সবকী ও মঞ্জিলের মূল্যায়ন প্রেরণ', cat: 'hifz', trig: 'event' },
    { id: 'wf_16', name: 'জরুরি হোস্টেল আউটপাস বিলম্ব সতর্কতা', desc: 'নির্ধারিত সময়ে ছাত্রাবাসে না ফিরলে নিরাপত্তা সুপার ও অভিভাবককে জরুরি ফোন অ্যালার্ট', cat: 'hostel', trig: 'event' },
    { id: 'wf_17', name: 'কিতাব নেসাব ও সিলেবাস অগ্রগতি ট্র্যাকার', desc: 'কোনো কিতাবের পাঠ নির্ধারিত একাডেমিক ক্যালেন্ডার থেকে পিছিয়ে পড়লে বিভাগীয় প্রধানকে নোটিশ', cat: 'academic', trig: 'schedule' },
    { id: 'wf_18', name: 'সার্টিফিকেট ও প্রশংসাপত্র QR ভেরিফিকেশন', desc: 'প্রত্যয়নপত্র বা সানাদ প্রদানের সময় জালিয়াতিরোধক কিউআর কোড প্রস্তুত ও ভেরিফিকেশন লিংক সংযোগ', cat: 'general', trig: 'event' },
    { id: 'wf_19', name: 'দরিদ্র ও এতিম ছাত্র বৃত্তি / যাকাত মওকুফ পর্যালোচনা', desc: 'ফি মওকুফের আবেদন যাচাই-বাছাই ও মুহতামিমের অনুমোদনের জন্য ডিজিটাল ফাইল উপস্থাপন', cat: 'fees', trig: 'event' },
    { id: 'wf_20', name: 'সাপ্তাহিক ডাটাবেজ ব্যাকআপ ও ক্লাউড অডিট', desc: 'প্রতি শুক্রবার মধ্যরাতে ডাটাবেজের সম্পূর্ণ এনক্রিপ্টেড ব্যাকআপ তৈরি ও সার্ভার স্বাস্থ্য পরীক্ষা', cat: 'general', trig: 'schedule' }
  ];

  for (const wf of prebuiltWorkflows) {
    const def = {
      name: wf.name,
      trigger: { type: wf.trig, value: wf.trig === 'schedule' ? '0 7 * * *' : 'event.dispatched' },
      nodes: [
        { id: 'n1', type: `trigger:${wf.trig}`, title: 'ট্রিগার ইভেন্ট', config: {} },
        { id: 'n2', type: 'logic:condition', title: 'শর্ত যাচাই', config: { condition: 'rule_valid' } },
        { id: 'n3', type: 'ai:analyze', title: 'এআই বিশ্লেষণ', config: {} },
        { id: 'n4', type: 'control:approval', title: 'মুহতামিম / অ্যাডমিন অনুমোদন', config: { required_role: 'madrasa_admin' } },
        { id: 'n5', type: 'action:notification', title: 'নোটিফিকেশন প্রেরণ', config: {} }
      ],
      connections: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' },
        { from: 'n4', to: 'n5' }
      ]
    };

    await db.run(`
      INSERT INTO workflows (id, tenant_id, name, description, category, trigger_type, is_active, definition_json, created_at, last_executed_at)
      VALUES (?, 'inst_main', ?, ?, ?, ?, 1, ?, ?, ?)
    `, [wf.id, wf.name, wf.desc, wf.cat, wf.trig, JSON.stringify(def), now, now]);
  }

  // 17. Seed a pending workflow execution and approval for demo
  await db.run(`
    INSERT INTO workflow_executions (id, tenant_id, workflow_id, workflow_name, status, started_at, logs_json)
    VALUES (
      'exec_demo_01', 'inst_main', 'wf_02', 'টানা ৩ দিন অনুপস্থিতি সতর্কতা', 'waiting_approval', ?, ?
    )
  `, [
    now,
    JSON.stringify([
      { timestamp: now, nodeTitle: 'ট্রিগার ইভেন্ট', status: 'success', message: 'আজকের হাজিরা যাচাই সম্পন্ন হয়েছে।' },
      { timestamp: now, nodeTitle: 'শর্ত যাচাই', status: 'success', message: '৩ জন শিক্ষার্থী টানা ৩ দিন অনুপস্থিত হিসেবে চিহ্নিত (আব্দুল্লাহ আল-মামুন, মুহাম্মদ ফারুক, আরিফুল ইসলাম)।' },
      { timestamp: now, nodeTitle: 'এআই বিশ্লেষণ ও ড্রাফট', status: 'success', message: 'সম্মানিত অভিভাবকদের জন্য ৩টি মার্জিত নোটিশ ড্রাফট প্রস্তুত করা হয়েছে।' },
      { timestamp: now, nodeTitle: 'মুহতামিম / অ্যাডমিন অনুমোদন', status: 'info', message: 'বার্তা প্রেরণের পূর্বে দায়িত্বশীল ব্যক্তির ডিজিটাল অনুমোদনের জন্য অপেক্ষমাণ।' }
    ])
  ]);

  await db.run(`
    INSERT INTO workflow_approvals (id, tenant_id, execution_id, workflow_name, title, description, required_role, action_payload_json, status, created_at)
    VALUES (
      'appr_demo_01', 'inst_main', 'exec_demo_01', 'টানা ৩ দিন অনুপস্থিতি সতর্কতা',
      '৩ জন অনুপস্থিত শিক্ষার্থীর অভিভাবককে SMS নোটিশ প্রেরণ',
      'টানা অনুপস্থিত শিক্ষার্থীদের বিষয়ে অভিভাবকদের সতর্কবার্তা পাঠানোর পূর্বে চূড়ান্ত অনুমোদন প্রয়োজন। বার্তা টেক্সট: "আসসালামু আলাইকুম। আপনার সন্তান গত ৩ দিন যাবত মাদ্রাসায় অনুপস্থিত। অনুগ্রহ করে মাদ্রাসার দফতরে যোগাযোগ করুন।"',
      'madrasa_admin',
      '{"recipientsCount":3,"channel":"SMS","sampleMessage":"আসসালামু আলাইকুম। আপনার সন্তান আব্দুল্লাহ আল-মামুন গত ৩ দিন যাবত মাদ্রাসায় অনুপস্থিত। অনুগ্রহ করে মাদ্রাসার দফতরে যোগাযোগ করুন।"}',
      'pending',
      ?
    )
  `, [now]);

  // 18. Onboarding State
  await db.run(`
    INSERT INTO onboarding_state (tenant_id, is_completed, current_step, answers_json, updated_at)
    VALUES ('inst_main', 1, 5, '{"models":["qawmi","hifz","boarding"],"classes":["নাহবেমীর","হেদায়াতুন্নাহু","কাফিয়া","মিশকাত","দাওরায়ে হাদীস"],"hifzTracking":"sabaq_sabqi_manzil","hostelCapacity":18}', ?)
  `, [now]);

  // 19. Initial Audit Log
  await db.run(`
    INSERT INTO audit_logs (id, tenant_id, user_id, user_name, user_role, action, entity_name, entity_id, details, timestamp, ip_address)
    VALUES ('aud_init', 'inst_main', 'usr_muhtamim', 'মাওলানা আব্দুল কুদ্দুস', 'madrasa_admin', 'SYSTEM_INITIALIZATION', 'institution', 'inst_main', 'দারুল উলূম সেন্ট্রাল মাদ্রাসা সিস্টেম প্রাথমিক কনফিগারেশন সফলভাবে সম্পন্ন হয়েছে।', ?, '127.0.0.1')
  `, [now]);
}
