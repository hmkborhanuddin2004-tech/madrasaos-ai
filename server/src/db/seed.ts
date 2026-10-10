import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

async function seedModulesIfEmpty(now: string): Promise<void> {
  // Kitab Progress
  const existingKp = await db.get('SELECT id FROM kitab_progress LIMIT 1');
  if (!existingKp) {
    await db.run(`
      INSERT INTO kitab_progress (id, tenant_id, class_id, subject_name_bn, kitab_name, teacher_name_bn, date, bab_or_chapter, lesson_title, pages_completed, total_kitab_pages, remarks)
      VALUES 
      ('kp_01', 'inst_main', 'cls_kafiya', 'আরবি ব্যাকরণ (নাহু)', 'কাফিয়া ও শরহে জামী', 'মাওলানা হারুনুর রশিদ', '2026-09-20', 'বাবুস সালাত ও তাহারাত', 'ইসমে মু''রাব ও মাবনীর পরিচয়', 45, 220, 'নিয়মিত পাঠদান সম্পন্ন'),
      ('kp_02', 'inst_main', 'cls_nahbemir', 'নাহু শাস্ত্র', 'নাহবেমীর', 'মাওলানা হারুনুর রশিদ', '2026-09-20', 'ইসম অনুচ্ছেদ', 'মারেফা ও নাকেরা', 32, 140, 'শিক্ষার্থীদের উপলব্ধি সন্তোষজনক'),
      ('kp_03', 'inst_main', 'cls_hidayah', 'ফিকহুল ইসলাম', 'হেদায়াতুন্নাহু', 'মাওলানা মাহমুদুল হাসান', '2026-09-20', 'মারফুআত', 'ফায়েল ও নায়েবে ফায়েল', 65, 260, 'আজকের নেসাব পাঠ সম্পন্ন')
    `);
  }

  // Library Books
  const existingBooks = await db.get('SELECT id FROM library_books LIMIT 1');
  if (!existingBooks) {
    await db.run(`
      INSERT INTO library_books (id, tenant_id, title_bn, title_ar, author, category, isbn, total_copies, available_copies)
      VALUES 
      ('book_01', 'inst_main', 'সহীহ বুখারী (১ম-১০ম খণ্ড)', 'صحيح البخاري', 'ইমাম মুহাম্মাদ ইবনে ইসমাইল আল-বুখারী (রহ.)', 'হাদিস শাস্ত্র', '978-984-01-0011-1', 10, 8),
      ('book_02', 'inst_main', 'হেদায়া (১ম-৪র্থ খণ্ড)', 'الهداية في شرح بداية المبتدي', 'ইমাম বোরহানুদ্দীন আল-মারগিনানী (রহ.)', 'ফিকহুল হানাফী', '978-984-01-0022-2', 8, 6),
      ('book_03', 'inst_main', 'আল-কাফিয়া ফি ইলমিন নাহু', 'الكافية في النحو', 'ইবনে হাজিব আন-নাহবী (রহ.)', 'আরবি ব্যাকরণ (নাহু)', '978-984-01-0033-3', 15, 12),
      ('book_04', 'inst_main', 'শরহে বেকায়া', 'شرح الوقاية', 'উবাইদুল্লাহ ইবনে মাসউদ আল-মাহবুবী', 'ফিকহুল হানাফী', '978-984-01-0044-4', 6, 5)
    `);
  }

  // Admissions
  const existingAdmissions = await db.get('SELECT id FROM admissions LIMIT 1');
  if (!existingAdmissions) {
    await db.run(`
      INSERT INTO admissions (id, tenant_id, application_number, applicant_name_bn, applicant_name_en, date_of_birth, guardian_name_bn, guardian_phone, applied_department, applied_class, status, interview_score, notes, created_at)
      VALUES
      ('adm_01', 'inst_main', 'ADM-2026-001', 'মুহাম্মদ হাবিবুল্লাহ', 'Muhammad Habibullah', '2015-01-01', 'জনাব শফিকুল ইসলাম', '01712000001', 'কওমী বিভাগ', 'নাহবেমীর জামাত', 'submitted', 0, 'ভর্তি পরীক্ষার জন্য অপেক্ষমাণ', ?),
      ('adm_02', 'inst_main', 'ADM-2026-002', 'জুবায়ের আহমেদ আল-ফারুক', 'Zubair Ahmed Al-Faruq', '2014-06-15', 'মাওলানা ফারুক আহমেদ', '01712000002', 'হিফজুল কুরআন বিভাগ', 'হিফজ ১ম বর্ষ', 'interviewed', 85, 'হিফজ ৫ পারা মুখস্থ রয়েছে', ?)
    `, [now, now]);
  }
}

async function seedM1DataIfEmpty(now: string): Promise<void> {
  // 1. Donors
  const existingDonors = await db.get('SELECT id FROM donors LIMIT 1');
  if (!existingDonors) {
    await db.run(`
      INSERT INTO donors (id, tenant_id, organization_id, name, org_name, category, contact_phone, whatsapp, email, commitment_frequency, created_at)
      VALUES 
      ('dnr_01', 'inst_main', 'org_main', 'আলহাজ্ব শামসুল হক', 'শামসুল হক ওয়েলফেয়ার ট্রাস্ট', 'permanent', '01711223344', '01711223344', 'shamsul.huq@example.com', 'monthly', ?),
      ('dnr_02', 'inst_main', 'org_main', 'হাজী আব্দুর রহিম', 'রহিম ট্রেডার্স', 'annual', '01811223355', '01811223355', 'rahim.traders@example.com', 'annual', ?),
      ('dnr_03', 'inst_main', 'org_main', 'ইঞ্জিনিয়ার নুরুল ইসলাম', NULL, 'one_time', '01911223366', '01911223366', 'nurul.islam@example.com', 'one_time', ?),
      ('dnr_04', 'inst_main', 'org_main', 'বেনামী শুভাকাঙ্ক্ষী', NULL, 'anonymous', '01800000000', NULL, NULL, 'none', ?)
    `, [now, now, now, now]);
  }

  // 2. Donation Receipts
  const existingReceipts = await db.get('SELECT id FROM donation_receipts LIMIT 1');
  if (!existingReceipts) {
    await db.run(`
      INSERT INTO donation_receipts (id, tenant_id, organization_id, receipt_no, donor_id, fund_type, amount, payment_method, payment_reference, notes, created_at)
      VALUES 
      ('rcp_don_01', 'inst_main', 'org_main', 'RCP-DON-202609-0001', 'dnr_01', 'lillah_orphan', 15000.0, 'bkash', 'TRX_ZAKAT_901', 'লিল্লাহ বোর্ডিং এতিম ছাত্রদের খাদ্য বাবদ যাকাত তহবিল অনুদান', ?),
      ('rcp_don_02', 'inst_main', 'org_main', 'RCP-DON-202609-0002', 'dnr_02', 'general', 5000.0, 'cash', 'VOUCH_GEN_101', 'মাদ্রাসার সাধারণ মেরামত ও বিদ্যুৎ বিল বাবদ অনুদান', ?),
      ('rcp_don_03', 'inst_main', 'org_main', 'RCP-DON-202609-0003', 'dnr_03', 'waqf_construction', 50000.0, 'bank', 'TRX_IBBL_WAQF_001', 'নতুন ৪ তলা ছাত্রাবাস ভবন নির্মাণ ওয়াকফ তহবিল অনুদান', ?)
    `, [now, now, now]);
  }

  // 3. Bank Accounts
  const existingBanks = await db.get('SELECT id FROM bank_accounts LIMIT 1');
  if (!existingBanks) {
    await db.run(`
      INSERT INTO bank_accounts (id, tenant_id, organization_id, bank_name, account_number, branch_name, current_balance, created_at)
      VALUES 
      ('bank_01', 'inst_main', 'org_main', 'Islami Bank Bangladesh PLC', '20501122334455', 'মিরপুর শাখা', 350000.0, ?),
      ('bank_02', 'inst_main', 'org_main', 'Al-Arafah Islami Bank Ltd', '102033445566', 'পল্লবী শাখা', 150000.0, ?)
    `, [now, now]);
  }

  // 4. Bank Deposits
  const existingDeposits = await db.get('SELECT id FROM bank_deposits LIMIT 1');
  if (!existingDeposits) {
    await db.run(`
      INSERT INTO bank_deposits (id, tenant_id, organization_id, bank_account_id, amount, deposit_slip_number, deposit_date, deposited_by, notes, created_at)
      VALUES 
      ('bdep_01', 'inst_main', 'org_main', 'bank_01', 10000.0, 'SLIP-IBBL-20260920', '2026-09-20', 'মুহাম্মদ ফারুক হোসেন', 'দৈনিক ক্যাশ থেকে ব্যাংকে জমা', ?)
    `, [now]);
  }

  // 5. Cash Book Daily
  const existingCashBook = await db.get('SELECT id FROM cash_book_daily LIMIT 1');
  if (!existingCashBook) {
    await db.run(`
      INSERT INTO cash_book_daily (id, tenant_id, organization_id, date, opening_balance, cash_collections, cash_expenses, bank_deposits, closing_balance, created_at)
      VALUES 
      ('cb_20260920', 'inst_main', 'org_main', '2026-09-20', 25000.0, 12000.0, 8500.0, 10000.0, 18500.0, ?)
    `, [now]);
  }
}

async function seedM2PayrollIfEmpty(now: string): Promise<void> {
  const secret = process.env.JWT_SECRET || 'madrasaos-secret-key-bangladesh-2026';
  const makeQr = (vch: string, net: number, m: string, y: number) => {
    return crypto.createHmac('sha256', secret).update(`${vch}:${net}:${m}:${y}`).digest('hex');
  };

  // 1. Staff Payroll Profiles
  const existingProfiles = await db.get('SELECT id FROM staff_payroll_profiles LIMIT 1');
  if (!existingProfiles) {
    await db.run(`
      INSERT INTO staff_payroll_profiles (
        id, organization_id, user_id, staff_name, designation,
        base_salary, housing_allowance, food_allowance, bonus_allowance,
        advance_loan_deduction, payment_method, account_details, status, created_at
      ) VALUES
      ('prf_muhtamim', 'org_main', 'usr_muhtamim', 'মাওলানা আব্দুল কুদ্দুস', 'muhtamim', 35000.0, 8000.0, 3000.0, 2000.0, 0.0, 'bank', 'IBBL-205011998877', 'active', ?),
      ('prf_shaykh', 'org_main', NULL, 'আল্লামা মুফতি রফিক আহমদ', 'shaykhul_hadith', 32000.0, 7000.0, 3000.0, 2000.0, 0.0, 'bank', 'AIBL-102033991122', 'active', ?),
      ('prf_senior_muhaddis', 'org_main', NULL, 'মাওলানা মুফতি আব্দুর রহমান', 'senior_muhaddis', 25000.0, 5000.0, 2500.0, 1500.0, 2000.0, 'bank', 'IBBL-205022883344', 'active', ?),
      ('prf_kitab', 'org_main', 'usr_rashid', 'মাওলানা হারুনুর রশিদ', 'kitab_teacher', 18000.0, 4000.0, 2000.0, 1000.0, 1500.0, 'bkash', '01711111113', 'active', ?),
      ('prf_hifz', 'org_main', 'usr_zubair', 'হাফেজ ক্বারী জুবায়ের আহমেদ', 'hifz_teacher', 16000.0, 3500.0, 2000.0, 1000.0, 0.0, 'nagad', '01711111114', 'active', ?),
      ('prf_nazir', 'org_main', 'usr_faruq', 'মাওলানা মুহাম্মদ ফারুক হোসেন', 'nazir_office', 15000.0, 3000.0, 2000.0, 1000.0, 1000.0, 'cash', 'ক্যাশ কাউন্টার', 'active', ?),
      ('prf_cook', 'org_main', NULL, 'মো. জামাল হোসেন বাবুর্চি', 'cook_hostel', 12000.0, 2000.0, 2000.0, 500.0, 0.0, 'cash', 'ক্যাশ প্রদান', 'active', ?),
      ('prf_security', 'org_main', NULL, 'মো. রফিকুল ইসলাম', 'security', 10000.0, 1500.0, 1500.0, 500.0, 500.0, 'cash', 'ক্যাশ প্রদান', 'active', ?)
    `, [now, now, now, now, now, now, now, now]);
  }

  // 2. Payroll Vouchers across all 4 lifecycle states
  const existingVouchers = await db.get('SELECT id FROM payroll_vouchers LIMIT 1');
  if (!existingVouchers) {
    const qr1 = makeQr('PAY-202609-0001', 48000.0, 'সেপ্টেম্বর', 2026);
    const qr2 = makeQr('PAY-202609-0002', 44000.0, 'সেপ্টেম্বর', 2026);
    const qr3 = makeQr('PAY-202609-0003', 23500.0, 'সেপ্টেম্বর', 2026);
    const qr4 = makeQr('PAY-202609-0004', 22000.0, 'সেপ্টেম্বর', 2026);
    const qr5 = makeQr('PAY-202609-0005', 16500.0, 'সেপ্টেম্বর', 2026);

    await db.run(`
      INSERT INTO payroll_vouchers (
        id, organization_id, voucher_number, profile_id, staff_name, designation,
        month, year, base_salary, housing_allowance, food_allowance, bonus_allowance,
        advance_loan_deduction, absent_deduction, net_payable, status,
        verified_by, approved_by, disbursed_by, disbursement_method,
        transaction_reference, qr_code_token, disbursed_at, created_at
      ) VALUES
      ('vch_01', 'org_main', 'PAY-202609-0001', 'prf_muhtamim', 'মাওলানা আব্দুল কুদ্দুস', 'muhtamim',
       'সেপ্টেম্বর', 2026, 35000.0, 8000.0, 3000.0, 2000.0, 0.0, 0.0, 48000.0, 'disbursed',
       'usr_faruq', 'usr_muhtamim', 'usr_faruq', 'bank', 'TRX_IBBL_SAL_20260901', ?, '2026-09-02 10:00:00', ?),
       
      ('vch_02', 'org_main', 'PAY-202609-0002', 'prf_shaykh', 'আল্লামা মুফতি রফিক আহমদ', 'shaykhul_hadith',
       'সেপ্টেম্বর', 2026, 32000.0, 7000.0, 3000.0, 2000.0, 0.0, 0.0, 44000.0, 'muhtamim_approved',
       'usr_faruq', 'usr_muhtamim', NULL, NULL, NULL, ?, NULL, ?),

      ('vch_03', 'org_main', 'PAY-202609-0003', 'prf_kitab', 'মাওলানা হারুনুর রশিদ', 'kitab_teacher',
       'সেপ্টেম্বর', 2026, 18000.0, 4000.0, 2000.0, 1000.0, 1500.0, 0.0, 23500.0, 'accountant_verified',
       'usr_faruq', NULL, NULL, NULL, NULL, ?, NULL, ?),

      ('vch_04', 'org_main', 'PAY-202609-0004', 'prf_hifz', 'হাফেজ ক্বারী জুবায়ের আহমেদ', 'hifz_teacher',
       'সেপ্টেম্বর', 2026, 16000.0, 3500.0, 2000.0, 1000.0, 0.0, 500.0, 22000.0, 'draft',
       NULL, NULL, NULL, NULL, NULL, ?, NULL, ?),

      ('vch_05', 'org_main', 'PAY-202609-0005', 'prf_cook', 'মো. জামাল হোসেন বাবুর্চি', 'cook_hostel',
       'সেপ্টেম্বর', 2026, 12000.0, 2000.0, 2000.0, 500.0, 0.0, 0.0, 16500.0, 'disbursed',
       'usr_faruq', 'usr_muhtamim', 'usr_faruq', 'cash', 'VCH_CASH_SAL_05', ?, '2026-09-02 11:30:00', ?)
    `, [qr1, now, qr2, now, qr3, now, qr4, now, qr5, now]);
  }
}

async function seedNewFeaturesIfEmpty(now: string): Promise<void> {
  const today = now.split('T')[0];

  // 1. Befaq Registrations
  const existingBefaq = await db.get('SELECT id FROM befaq_registrations LIMIT 1');
  if (!existingBefaq) {
    await db.run(`
      INSERT INTO befaq_registrations (
        id, tenant_id, student_id, marhalah, roll_number, registration_number,
        session_year, exam_center, status, total_marks, division, sanad_number, created_at
      ) VALUES
      ('bfq_001', 'inst_main', 'std_001', 'takmil', '2026-TAK-101', 'REG-BFQ-2026-8801', 2026, 'জামিয়া রাহমানিয়া আরাবিয়া, ঢাকা', 'passed', 582.0, 'mumtaz', 'SND-BFQ-2026-00452', ?),
      ('bfq_002', 'inst_main', 'std_002', 'fazilat', '2026-FAZ-202', 'REG-BFQ-2026-8802', 2026, 'জামিয়া রাহমানিয়া আরাবিয়া, ঢাকা', 'admit_issued', NULL, NULL, NULL, ?),
      ('bfq_003', 'inst_main', 'std_003', 'sanabia_ulya', '2026-SAN-303', 'REG-BFQ-2026-8803', 2026, 'দারুল উলূম ঢাকা ক্যাম্পাস', 'registered', NULL, NULL, NULL, ?)
    `, [now, now, now]);
  }

  // 2. Muhasaba Records
  const existingMuhasaba = await db.get('SELECT id FROM muhasaba_records LIMIT 1');
  if (!existingMuhasaba) {
    await db.run(`
      INSERT INTO muhasaba_records (
        id, tenant_id, student_id, date, fajr, dhuhr, asr, maghrib, isha,
        tahajjud, tilawat_pages, duas_read, truthfulness_score, adab_score,
        total_score, notes, verified_by_user_id, created_at
      ) VALUES
      ('muh_001', 'inst_main', 'std_001', ?, 1, 1, 1, 1, 1, 1, 10.0, 1, 5, 5, 98.5, 'মাশাআল্লাহ! তাকবীরে উলার সাথে জামাতে ৫ ওয়াক্ত নামাজ এবং ১০ পৃষ্ঠা তিলাওয়াত।', 'usr_zubair', ?),
      ('muh_002', 'inst_main', 'std_002', ?, 1, 1, 1, 1, 1, 0, 6.0, 1, 5, 4, 88.0, 'আলহামদুলিল্লাহ, পাঁচ ওয়াক্ত জামাতে আদায় করেছে।', 'usr_zubair', ?),
      ('muh_003', 'inst_main', 'std_003', ?, 1, 1, 1, 1, 0, 0, 4.0, 1, 4, 4, 75.0, 'এশার নামাজে কিছুটা বিলম্ব হয়েছে, সতর্ক করা হয়েছে।', 'usr_zubair', ?)
    `, [today, now, today, now, today, now]);
  }

  // 3. Canteen Inventory
  const existingCanteen = await db.get('SELECT id FROM canteen_inventory LIMIT 1');
  if (!existingCanteen) {
    await db.run(`
      INSERT INTO canteen_inventory (id, tenant_id, item_name_bn, category, unit, current_stock, min_stock_alert, unit_price, updated_at)
      VALUES
      ('cant_item_01', 'inst_main', 'মিনিকেট চাল (৫০ কেজি বস্তা)', 'rice', 'বস্তা', 15.0, 5.0, 3600.0, ?),
      ('cant_item_02', 'inst_main', 'দেশি মসুর ডাল', 'pulse', 'কেজি', 120.0, 30.0, 135.0, ?),
      ('cant_item_03', 'inst_main', 'তীর সোয়াবিন তেল (৫ লিটার জার)', 'oil', 'জার', 24.0, 8.0, 925.0, ?),
      ('cant_item_04', 'inst_main', 'হলুদ, মরিচ ও ধনিয়া গুঁড়া মশলা', 'spices', 'কেজি', 45.0, 15.0, 280.0, ?),
      ('cant_item_05', 'inst_main', 'আলু ও মিষ্টি কুমড়া', 'vegetable', 'কেজি', 200.0, 50.0, 45.0, ?),
      ('cant_item_06', 'inst_main', 'ব্রয়লার মুরগি ও তাজা রুই মাছ', 'meat_fish', 'কেজি', 75.0, 20.0, 210.0, ?)
    `, [now, now, now, now, now, now]);

    // Initial purchase transactions
    await db.run(`
      INSERT INTO canteen_transactions (id, tenant_id, type, item_id, quantity, total_cost, supplier_name, voucher_no, date, notes, created_at)
      VALUES
      ('ctx_01', 'inst_main', 'purchase_inflow', 'cant_item_01', 10.0, 36000.0, 'মেসার্স মদিনা রাইস ট্রেডার্স', 'VOUCH-CANT-01', ?, 'ছাত্রাবাস মেসের জন্য ১০ বস্তা মিনিকেট চাউল ক্রয়', ?),
      ('ctx_02', 'inst_main', 'purchase_inflow', 'cant_item_03', 15.0, 13875.0, 'আল-বারাকা অয়েল মিলস', 'VOUCH-CANT-02', ?, '১৫ জার সোয়াবিন তেল ক্রয়', ?)
    `, [today, now, today, now]);

    // Today meal logs
    await db.run(`
      INSERT INTO canteen_meal_logs (id, tenant_id, date, meal_type, menu_description, headcount_students, headcount_staff, total_cost, prepared_by, created_at)
      VALUES
      ('meal_01', 'inst_main', ?, 'breakfast', 'ভুনা খিচুড়ি, সিদ্ধ ডিম ও আচার', 140, 12, 3800.0, 'মো. জামাল হোসেন বাবুর্চি', ?),
      ('meal_02', 'inst_main', ?, 'lunch', 'সাদা ভাত, মসুর ডাল, রুই মাছের দোপেঁয়াজা ও লেটুস পাতা', 145, 14, 8500.0, 'মো. জামাল হোসেন বাবুর্চি', ?)
    `, [today, now, today, now]);
  }

  // 4. Class Routines
  const existingRoutines = await db.get('SELECT id FROM class_routines LIMIT 1');
  if (!existingRoutines) {
    await db.run(`
      INSERT INTO class_routines (id, tenant_id, branch_id, class_id, day_of_week, period_number, start_time, end_time, subject_name_bn, teacher_id, teacher_name_bn, room_number)
      VALUES
      ('rtn_01', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Saturday', 1, '০৮:০০ AM', '০৮:৪৫ AM', 'কাফিয়া (নাহব শাস্ত্র)', 'usr_rashid', 'মাওলানা হারুনুর রশিদ', '১০১'),
      ('rtn_02', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Saturday', 2, '০৮:৫০ AM', '০৯:৩৫ AM', 'উসূলুশ শাশী (ফিক্বহ শাস্ত্র)', 'usr_muhtamim', 'মাওলানা আব্দুল কুদ্দুস', '১০১'),
      ('rtn_03', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Saturday', 3, '০৯:৪০ AM', '১০:২৫ AM', 'কুদূরী (মুয়ামালাত ও ইবাদত)', 'usr_rashid', 'মাওলানা হারুনুর রশিদ', '১০১'),
      ('rtn_04', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Saturday', 4, '১০:৪৫ AM', '১১:৩০ AM', 'নূরুল ঈযাহ ও সীরাত', 'usr_faruq', 'মাওলানা মুহাম্মদ ফারুক হোসেন', '১০১'),
      ('rtn_05', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Sunday', 1, '০৮:০০ AM', '০৮:৪৫ AM', 'কাফিয়া (নাহব শাস্ত্র)', 'usr_rashid', 'মাওলানা হারুনুর রশিদ', '১০১'),
      ('rtn_06', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Sunday', 2, '০৮:৫০ AM', '০৯:৩৫ AM', 'উসূলুশ শাশী', 'usr_muhtamim', 'মাওলানা আব্দুল কুদ্দুস', '১০১'),
      ('rtn_07', 'inst_main', 'branch_mirpur', 'cls_kafiya', 'Monday', 1, '০৮:০০ AM', '০৮:৪৫ AM', 'কাফিয়া (নাহব শাস্ত্র)', 'usr_rashid', 'মাওলানা হারুনুর রশিদ', '১০১'),
      ('rtn_08', 'inst_main', 'branch_mirpur', 'cls_nahbemir', 'Saturday', 1, '০৮:০০ AM', '০৮:৪৫ AM', 'নাহবেমীর ও তামরীন', 'usr_rashid', 'মাওলানা হারুনুর রশিদ', '১০২')
    `);
  }
}


async function seedGradingAndRolesIfEmpty(now: string): Promise<void> {
  const existingPolicy = await db.get('SELECT id FROM grading_policies LIMIT 1');
  if (!existingPolicy) {
    const gradeTable = [
      { min: 90, grade: 'A+', gpa: 5.0 },
      { min: 80, grade: 'A', gpa: 4.0 },
      { min: 70, grade: 'A-', gpa: 3.5 },
      { min: 60, grade: 'B', gpa: 3.0 },
      { min: 50, grade: 'C', gpa: 2.0 },
      { min: 40, grade: 'D', gpa: 1.0 },
      { min: 0, grade: 'F', gpa: 0.0 }
    ];
    await db.run(`
      INSERT INTO grading_policies (
        id, name, is_active, pass_rule, default_pass_marks,
        grade_table, created_by
      ) VALUES (
        'pol_qawmi_std', 'Standard Bangladesh Qawmi', 1, 'strict', 40,
        ?, 'usr_super'
      )
    `, [JSON.stringify(gradeTable)]);
  }

  const existingRoles = await db.get('SELECT id FROM role_permissions LIMIT 1');
  if (!existingRoles) {
    const roles = ['super_admin', 'madrasa_admin', 'principal', 'teacher', 'hifz_teacher', 'accountant', 'hostel_manager', 'guardian', 'student'];
    for (const r of roles) {
      await db.run(`
        INSERT INTO role_permissions (id, role, can_post_notice, can_push, can_send_sms, needs_sms_approval, max_sms_recipients, allowed_notice_targets)
        VALUES (?, ?, 1, 1, 1, 0, 1000, '[]')
      `, [`rp_${r}`, r]);
    }
  }

  // Check if exam results exist, if not, create one
  const existingResult = await db.get('SELECT id FROM exam_results LIMIT 1');
  if (!existingResult) {
    await db.run(`
      INSERT INTO exam_results (id, exam_id, student_id, total_marks, obtained_marks, percentage, gpa, grade, merit_position, is_locked, published_by, created_at)
      VALUES ('res_demo_01', 'exam_first_term_2026', 'std_001', 200, 180, 90.0, 5.0, 'A+', 1, 1, 'usr_principal', ?)
    `, [now]);
  }
}

export async function seedSettingsAndDefinitionsIfEmpty(now: string = new Date().toISOString()): Promise<void> {
  // 1. Institution Settings
  const existingSettings = await db.get<any>('SELECT id FROM institution_settings WHERE tenant_id = ? LIMIT 1', ['inst_main']);
  if (!existingSettings) {
    const designationLabels = {
      muhtamim: 'মুহতামিম (প্রধান পরিচালক)',
      naib_muhtamim: 'নায়েবে মুহতামিম (উপ-পরিচালক)',
      shaykhul_hadith: 'শায়খুল হাদীস',
      senior_muhaddis: 'সিনিয়র মুহাদ্দিস',
      kitab_teacher: 'কিতাব শিক্ষক (ওস্তাদ)',
      hifz_teacher: 'হাফেজ সাহেব (হিফজ শিক্ষক)',
      nazir_office: 'নাজের / অফিস সহকারী',
      cook_hostel: 'বাবুর্চি / হোস্টেল স্টাফ',
      security: 'নিরাপত্তা কর্মী'
    };

    const customDepartments = [
      'হিফজুল কুরআন বিভাগ',
      'কিতাব বিভাগ (দরসে নিজামী)',
      'নূরানী ও নাজেরা বিভাগ',
      'ইফতা ও ফতোয়া বিভাগ',
      'ক্বিরাআত ও তাজবীদ বিভাগ'
    ];

    const lateFeeSettings = {
      grace_days: 10,
      amount: 50,
      type: 'fixed',
      description: '১০ তারিখের পর বিলম্ব ফি ৫০ ৳'
    };

    const securitySettings = {
      two_factor_auth: false,
      password_expiry_days: 90,
      session_timeout_minutes: 60,
      ip_restriction: false
    };

    await db.run(
      `INSERT INTO institution_settings (
        id, tenant_id, name_bn, name_en, logo_url, address, email, phone,
        established_year, madrasa_type, tagline, primary_color, currency_symbol,
        hijri_year_enabled, academic_year_type, sms_sender_id, brevo_api_key,
        whatsapp_enabled, messenger_enabled, email_enabled,
        late_fee_settings_json, designation_labels_json, custom_departments_json, security_settings_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'set_inst_main',
        'inst_main',
        'জামিয়া ইসলামিয়া মডেল মাদ্রাসা',
        'Jamia Islamia Model Madrasa',
        '',
        'প্লট ১৪, সেকশন ৬, মিরপুর, ঢাকা-১২১৬',
        'info@jamia-islamia.edu.bd',
        '01711111111',
        1994,
        'Qawmi',
        'ইলম, আমল ও খুলুসিয়্যাতের অনন্য দ্বীনি প্রতিষ্ঠান',
        '#059669',
        '৳',
        1,
        'hijri',
        'MADRASA_OS',
        'xkeysib-demo-seed-test-key-2026',
        1,
        1,
        1,
        JSON.stringify(lateFeeSettings),
        JSON.stringify(designationLabels),
        JSON.stringify(customDepartments),
        JSON.stringify(securitySettings),
        now,
        now
      ]
    );
  }

  // 2. Fee Categories
  const existingFeeCats = await db.get<any>('SELECT id FROM fee_categories LIMIT 1');
  if (!existingFeeCats) {
    const feeCategories = [
      { id: 'fee_cat_01', bn: 'মাসিক বেতন', en: 'Monthly Tuition Fee', amt: 2000, freq: 'monthly', ledger: 'non_residential', desc: 'নিয়মিত মাসিক শিক্ষা ফি' },
      { id: 'fee_cat_02', bn: 'হোস্টেল ও খাবার ফি', en: 'Hostel & Food Fee', amt: 2500, freq: 'monthly', ledger: 'residential', desc: 'আবাসিক ছাত্রদের থাকা ও খাওয়ার ফি' },
      { id: 'fee_cat_03', bn: 'বার্ষিক ভর্তি ফি', en: 'Annual Admission Fee', amt: 5000, freq: 'yearly', ledger: 'non_residential', desc: 'নতুন শিক্ষাবর্ষে ভর্তি ও সেশন ফি' },
      { id: 'fee_cat_04', bn: 'কিতাব ফি', en: 'Kitab & Books Fee', amt: 1500, freq: 'yearly', ledger: 'non_residential', desc: 'বোর্ড নির্ধারিত ও দরসী কিতাবের ফি' },
      { id: 'fee_cat_05', bn: 'পরীক্ষা ফি', en: 'Exam Fee', amt: 500, freq: 'per_term', ledger: 'non_residential', desc: 'সাময়িক ও বার্ষিক পরীক্ষা ফি' },
      { id: 'fee_cat_06', bn: 'চিকিৎসা ও কল্যাণ তহবিল', en: 'Medical & Welfare Fund', amt: 200, freq: 'monthly', ledger: 'non_residential', desc: 'ছাত্রদের জরুরি চিকিৎসা ও কল্যাণ তহবিল' }
    ];

    for (const fc of feeCategories) {
      await db.run(
        `INSERT INTO fee_categories (id, tenant_id, name_bn, name_en, amount, frequency, ledger_type, description, is_active, created_at, updated_at)
         VALUES (?, 'inst_main', ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [fc.id, fc.bn, fc.en, fc.amt, fc.freq, fc.ledger, fc.desc, now, now]
      );
    }
  }

  // 3. Class Definitions
  const existingClassDefs = await db.get<any>('SELECT id FROM class_definitions LIMIT 1');
  if (!existingClassDefs) {
    const classDefs = [
      { id: 'cls_def_01', bn: 'ইবতেদায়ী ১ম বর্ষ (নূরানী)', en: 'Ibtidai 1st Year (Noorani)', ord: 1, dept: 'নূরানী ও নাজেরা বিভাগ' },
      { id: 'cls_def_02', bn: 'ইবতেদায়ী ২য় বর্ষ (নাজেরা)', en: 'Ibtidai 2nd Year (Nazera)', ord: 2, dept: 'নূরানী ও নাজেরা বিভাগ' },
      { id: 'cls_def_03', bn: 'হিফজুল কুরআন জামাত', en: 'Hifzul Quran', ord: 3, dept: 'হিফজুল কুরআন বিভাগ' },
      { id: 'cls_def_04', bn: 'মুতাওয়াচ্ছিতাহ (নাহবেমীর)', en: 'Mutawassitah (Nahbemir)', ord: 4, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
      { id: 'cls_def_05', bn: 'মুতাওয়াচ্ছিতাহ (হেদায়াতুন্নাহু)', en: 'Mutawassitah (Hidayatun Nahw)', ord: 5, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
      { id: 'cls_def_06', bn: 'সানাভিয়্যাহ আম্মাহ (কাফিয়া)', en: 'Sanaviyyah Ammah (Kafiya)', ord: 6, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
      { id: 'cls_def_07', bn: 'সানাভিয়্যাহ খাচ্ছাহ (শারহে বেকায়া)', en: 'Sanaviyyah Khassah (Sharh Wiqayah)', ord: 7, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
      { id: 'cls_def_08', bn: 'ফযীলত (জালালাইন ও মিশকাত)', en: 'Fadeelat (Mishkat)', ord: 8, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
      { id: 'cls_def_09', bn: 'তাকমীল / দাওরায়ে হাদীস', en: 'Takmeel / Dawra-e-Hadith', ord: 9, dept: 'কিতাব বিভাগ (দরসে নিজামী)' }
    ];

    for (const cd of classDefs) {
      await db.run(
        `INSERT INTO class_definitions (id, tenant_id, name_bn, name_en, order_index, department, created_at, updated_at)
         VALUES (?, 'inst_main', ?, ?, ?, ?, ?, ?)`,
        [cd.id, cd.bn, cd.en, cd.ord, cd.dept, now, now]
      );
    }
  }

  // 4. Subject Definitions
  const existingSubjDefs = await db.get<any>('SELECT id FROM subject_definitions LIMIT 1');
  if (!existingSubjDefs) {
    const subjectDefs = [
      { id: 'subj_def_01', bn: 'পবিত্র কুরআন তিলাওয়াত ও তাজবীদ', en: 'Quran Recitation & Tajweed', code: 'QUR-101', total: 100, pass: 40 },
      { id: 'subj_def_02', bn: 'আল-কাফিয়া (আরবি ব্যাকরণ / নাহব)', en: 'Al-Kafiya (Arabic Syntax)', code: 'ARB-201', total: 100, pass: 33 },
      { id: 'subj_def_03', bn: 'উসূলুশ শাশী (ইসলামিক আইনশাস্ত্র / উসূলে ফিক্বহ)', en: 'Usul al-Shashi (Principles of Fiqh)', code: 'FIQ-301', total: 100, pass: 33 },
      { id: 'subj_def_04', bn: 'মুখতাসারুল কুদূরী (ফিক্বহ ও মুয়ামালাত)', en: 'Mukhtasar al-Quduri (Islamic Jurisprudence)', code: 'FIQ-302', total: 100, pass: 33 },
      { id: 'subj_def_05', bn: 'নূরুল ঈযাহ ও সীরাত', en: 'Nur al-Idah & Seerat', code: 'ISL-201', total: 100, pass: 33 },
      { id: 'subj_def_06', bn: 'মিশকাতুল মাসাবীহ (হাদীস সংকলন)', en: 'Mishkat al-Masabih (Hadith Anthology)', code: 'HAD-401', total: 100, pass: 40 },
      { id: 'subj_def_07', bn: 'বাংলা ভাষা ও সাহিত্য', en: 'Bengali Literature', code: 'BAN-101', total: 100, pass: 33 },
      { id: 'subj_def_08', bn: 'গণিত ও হিসাব বিজ্ঞান', en: 'Mathematics & Accounts', code: 'MAT-101', total: 100, pass: 33 },
      { id: 'subj_def_09', bn: 'ইংরেজি ভাষা ও ব্যাকরণ', en: 'English Language', code: 'ENG-101', total: 100, pass: 33 }
    ];

    for (const sd of subjectDefs) {
      await db.run(
        `INSERT INTO subject_definitions (id, tenant_id, name_bn, name_en, code, total_marks, pass_marks, created_at, updated_at)
         VALUES (?, 'inst_main', ?, ?, ?, ?, ?, ?, ?)`,
        [sd.id, sd.bn, sd.en, sd.code, sd.total, sd.pass, now, now]
      );
    }
  }
}

export async function seedDatabase(): Promise<void> {
  const now = new Date().toISOString();
  const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1');
  if (existingOrg) {
    await db.run("UPDATE workflow_approvals SET status = 'pending', decided_by = NULL, decided_at = NULL WHERE id = 'appr_demo_01'");
    
    // RESET SEEDED PAYROLL VOUCHERS TO ORIGINAL LIFECYCLE STATES FOR TEST IDEMPOTENCY
    await db.run(`
      UPDATE payroll_vouchers 
      SET status = 'muhtamim_approved', 
          disbursed_by = NULL, 
          disbursement_method = NULL, 
          transaction_reference = NULL, 
          disbursed_at = NULL 
      WHERE id = 'vch_02'
    `);
    await db.run(`
      UPDATE payroll_vouchers 
      SET status = 'accountant_verified', 
          approved_by = NULL, 
          disbursed_by = NULL, 
          disbursement_method = NULL, 
          transaction_reference = NULL, 
          disbursed_at = NULL 
      WHERE id = 'vch_03'
    `);
    await db.run(`
      UPDATE payroll_vouchers 
      SET status = 'draft', 
          verified_by = NULL, 
          approved_by = NULL, 
          disbursed_by = NULL, 
          disbursement_method = NULL, 
          transaction_reference = NULL, 
          disbursed_at = NULL 
      WHERE id = 'vch_04'
    `);

    // Clean up dynamic test vouchers created during previous test executions (e.g. October 2026 vouchers)
    // Delete child payroll vouchers first to prevent foreign key constraint failures
    await db.run("DELETE FROM payroll_vouchers WHERE profile_id NOT IN ('prf_muhtamim', 'prf_shaykh', 'prf_senior_muhaddis', 'prf_kitab', 'prf_hifz', 'prf_nazir', 'prf_cook', 'prf_security') OR month = 'অক্টোবর' AND year = 2026 OR id LIKE 'test_%' OR voucher_number LIKE 'VCH-202610%'");
    await db.run("DELETE FROM staff_payroll_profiles WHERE id LIKE 'test_%' OR id NOT IN ('prf_muhtamim', 'prf_shaykh', 'prf_senior_muhaddis', 'prf_kitab', 'prf_hifz', 'prf_nazir', 'prf_cook', 'prf_security')");

    const existingStudentUser = await db.get("SELECT id FROM users WHERE id = 'usr_abdullah'");
    if (!existingStudentUser) {
      const studentHash = await bcrypt.hash('student123', 10);
      await db.run(`
        INSERT INTO users (id, tenant_id, branch_id, username, phone, full_name_bn, full_name_en, role, password_hash, assigned_class_ids, linked_student_ids, created_at)
        VALUES ('usr_abdullah', 'inst_main', 'branch_mirpur', 'student_abdullah', '01911111111', 'আব্দুল্লাহ আল-মামুন', 'Abdullah Al-Mamun', 'student', ?, '[]', '["std_001"]', datetime('now'))
      `, [studentHash]);
    } else {
      await db.run("UPDATE users SET linked_student_ids = '[\"std_001\"]' WHERE id = 'usr_abdullah'");
    }
    await seedModulesIfEmpty(now);
    await seedNewFeaturesIfEmpty(now);

    // Ensure overdue invoices exist in existing databases
    const overdueCount = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM fee_invoices WHERE status = 'overdue'");
    if (!overdueCount || overdueCount.count === 0) {
      await db.run(`
        UPDATE fee_invoices 
        SET status = 'overdue', due_date = '2026-09-05', paid_amount = 0, due_amount = total_amount 
        WHERE id IN (SELECT id FROM fee_invoices WHERE status != 'paid' LIMIT 15)
      `);
    }

    // Ensure residential ledger_type is set on hostel invoices
    await db.run(`
      UPDATE fee_invoices 
      SET ledger_type = 'residential' 
      WHERE fee_items_json LIKE '%হোস্টেল%' OR fee_items_json LIKE '%খাবার%'
    `);

    // Ensure non_residential ledger_type is set on remaining invoices
    await db.run(`
      UPDATE fee_invoices 
      SET ledger_type = 'non_residential' 
      WHERE ledger_type IS NULL OR ledger_type = ''
    `);

    await seedM1DataIfEmpty(now);
    await seedM2PayrollIfEmpty(now);
    await seedSettingsAndDefinitionsIfEmpty(now);
    await seedGradingAndRolesIfEmpty(now);
    return; // Already seeded
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const hifzHash = await bcrypt.hash('hifz123', 10);
  const accountHash = await bcrypt.hash('account123', 10);
  const parentHash = await bcrypt.hash('parent123', 10);
  const studentHash = await bcrypt.hash('student123', 10);
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
      'জামিয়া ইসলামিয়া মডেল মাদ্রাসা',
      'Jamia Islamia Model Madrasa',
      'جامعة إسلامية نموذجية',
      'JAMIA-DHAKA',
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

  // 4. Classes (Jamaats) - Authentic Qawmi Structure
  const classesData = [
    // প্রাথমিক স্তর (ইবতিদাইয়্যাহ)
    { id: 'cls_noorani', dept: 'প্রাথমিক স্তর (ইবতিদাইয়্যাহ)', bn: 'মক্তব / নূরানী বিভাগ', en: 'Noorani & Maktab', ord: 1 },
    { id: 'cls_nazera', dept: 'প্রাথমিক স্তর (ইবতিদাইয়্যাহ)', bn: 'নাজেরা বিভাগ', en: 'Nazera', ord: 2 },
    { id: 'cls_hifz_1', dept: 'প্রাথমিক স্তর (ইবতিদাইয়্যাহ)', bn: 'হিফজ ১ম বর্ষ (শাখা আলিফ)', en: 'Hifz Year 1 (A)', ord: 3 },
    { id: 'cls_hifz_2', dept: 'প্রাথমিক স্তর (ইবতিদাইয়্যাহ)', bn: 'হিফজ ২য় বর্ষ (শাখা বা)', en: 'Hifz Year 2 (B)', ord: 4 },
    
    // কিতাব বিভাগ (মাধ্যমিক থেকে উচ্চশিক্ষা)
    { id: 'cls_shishu', dept: 'কিতাব বিভাগ', bn: 'জান্নাতুল আতিফাল (শিশু শ্রেণি)', en: 'Jannatul Atfal', ord: 5 },
    { id: 'cls_urdu', dept: 'কিতাব বিভাগ', bn: 'উর্দু / ক্লাস ওয়ান-টু', en: 'Urdu / Taiysir', ord: 6 },
    { id: 'cls_mizan', dept: 'কিতাব বিভাগ', bn: 'জামাতে মিজান', en: 'Mizan', ord: 7 },
    { id: 'cls_nahbemir', dept: 'কিতাব বিভাগ', bn: 'জামাতে নাহবেমির', en: 'Nahbemir', ord: 8 },
    { id: 'cls_hidayah', dept: 'কিতাব বিভাগ', bn: 'জামাতে হেদায়াতুন্নাহু', en: 'Hidayatun Nahw', ord: 9 },
    { id: 'cls_kafiya', dept: 'কিতাব বিভাগ', bn: 'জামাতে কাফিয়া', en: 'Kafiya', ord: 10 },
    { id: 'cls_jami', dept: 'কিতাব বিভাগ', bn: 'জামাতে শরহে জামী', en: 'Sharhe Jami', ord: 11 },
    { id: 'cls_mishkat', dept: 'কিতাব বিভাগ', bn: 'জামাতে মেশকাত (ফজিলত মারহালা)', en: 'Mishkatul Masabih', ord: 12 },
    { id: 'cls_dawra', dept: 'কিতাব বিভাগ', bn: 'তাকমিল বা দাওরায়ে হাদিস (তাকমিল মারহালা)', en: 'Dawra-e-Hadith', ord: 13 },

    // বিশেষায়িত উচ্চশিক্ষা বিভাগ (তাখাসসুস)
    { id: 'cls_ifta', dept: 'বিশেষায়িত উচ্চশিক্ষা বিভাগ (তাখাসসুস)', bn: 'ইফতা বিভাগ', en: 'Ifta Department', ord: 14 },
    { id: 'cls_tafsir', dept: 'বিশেষায়িত উচ্চশিক্ষা বিভাগ (তাখাসসুস)', bn: 'তাফসির বিভাগ', en: 'Tafsir Department', ord: 15 },
    { id: 'cls_adab', dept: 'বিশেষায়িত উচ্চশিক্ষা বিভাগ (তাখাসসুস)', bn: 'আদব বিভাগ', en: 'Arabic Literature', ord: 16 }
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
    { id: 'usr_abdullah', u: 'student_abdullah', p: '01911111111', fn_bn: 'আব্দুল্লাহ আল-মামুন', fn_en: 'Abdullah Al-Mamun', r: 'student', h: studentHash, linked: '["std_001"]' }
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
  const classRollMap: Record<string, number> = {};
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
      classRollMap[classId] = (classRollMap[classId] || 0) + 1;
      const roll = String(classRollMap[classId]);
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

  // 11. Fee Invoices & Payments (Segregated Residential & Non-Residential)
  let invoiceCount = 1;
  for (let i = 0; i < allStudents.length; i++) {
    const st = allStudents[i];
    const isResidential = i % 2 === 0;

    const invoicesToCreate: {
      type: 'residential' | 'non_residential';
      title: string;
      amount: number;
    }[] = [];

    if (isResidential) {
      invoicesToCreate.push({
        type: 'residential',
        title: 'আবাসিক খাবার ও হোস্টেল ফি',
        amount: 2500
      });
      invoicesToCreate.push({
        type: 'non_residential',
        title: 'মাসিক একাডেমিক বেতন',
        amount: 2000
      });
    } else {
      invoicesToCreate.push({
        type: 'non_residential',
        title: 'মাসিক একাডেমিক বেতন',
        amount: 2000
      });
    }

    for (const item of invoicesToCreate) {
      const isOverdue = invoiceCount % 7 === 0;
      const isPaid = !isOverdue && invoiceCount % 3 === 0;
      const totalAmount = item.amount;
      const paidAmount = isPaid ? totalAmount : (isOverdue ? 0 : Math.min(1000, totalAmount));
      const dueAmount = totalAmount - paidAmount;
      const status = isPaid ? 'paid' : (isOverdue ? 'overdue' : 'partially_paid');
      const dueDate = isOverdue ? '2026-09-05' : '2026-09-10';
      const invId = `inv_${item.type}_${st.id}_${invoiceCount}`;
      const invNumber = `INV-${item.type === 'residential' ? 'RES' : 'ACAD'}-202609-${String(invoiceCount).padStart(4, '0')}`;

      await db.run(`
        INSERT INTO fee_invoices (id, tenant_id, invoice_number, student_id, month, year, ledger_type, fee_items_json, total_amount, discount_amount, paid_amount, due_amount, status, due_date, created_at)
        VALUES (?, 'inst_main', ?, ?, 'সেপ্টেম্বর', 2026, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      `, [
        invId, invNumber, st.id, item.type,
        JSON.stringify([{ title: item.title, amount: item.amount }]),
        totalAmount, paidAmount, dueAmount, status, dueDate, now
      ]);

      if (paidAmount > 0) {
        await db.run(`
          INSERT INTO fee_payments (id, tenant_id, invoice_id, payment_number, student_id, amount, payment_method, transaction_id, status, received_by_user_id, paid_at)
          VALUES (?, 'inst_main', ?, ?, ?, ?, ?, ?, 'success', 'usr_faruq', ?)
        `, [
          `pay_${invId}`, invId, `RCP-202609-${String(invoiceCount).padStart(4, '0')}`, st.id,
          paidAmount, invoiceCount % 2 === 0 ? 'bkash' : 'cash', invoiceCount % 2 === 0 ? `TRX_BKASH_${100000 + invoiceCount}` : null, todayStr
        ]);
      }

      invoiceCount++;
    }
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
    VALUES ('aud_init', 'inst_main', 'usr_muhtamim', 'মাওলানা আব্দুল কুদ্দুস', 'madrasa_admin', 'SYSTEM_INITIALIZATION', 'institution', 'inst_main', 'জামিয়া ইসলামিয়া সিস্টেম প্রাথমিক কনফিগারেশন সফলভাবে সম্পন্ন হয়েছে।', ?, '127.0.0.1')
  `, [now]);

  // 20. Seed modules if empty
  await seedModulesIfEmpty(now);

  // 21. Seed M1 data if empty
  await seedM1DataIfEmpty(now);

  // 22. Seed M2 Payroll data if empty
  await seedM2PayrollIfEmpty(now);

  // 23. Seed New Features (Befaq, Muhasaba, Canteen, Routines) if empty
  await seedNewFeaturesIfEmpty(now);

  // 24. Seed Settings and Definitions if empty
  await seedSettingsAndDefinitionsIfEmpty(now);
}
