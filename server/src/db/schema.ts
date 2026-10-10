import { getDb } from './db.js';

export async function initializeDatabase(): Promise<void> {
  const db = getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      subscription_plan TEXT DEFAULT 'enterprise',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT,
      code TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      enabled_models TEXT NOT NULL, -- JSON array
      settings_json TEXT NOT NULL,  -- JSON object
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      is_main_branch INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      full_name_bn TEXT NOT NULL,
      full_name_en TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_url TEXT,
      status TEXT DEFAULT 'active',
      assigned_class_ids TEXT, -- JSON array
      linked_student_ids TEXT,  -- JSON array for guardians
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS academic_sessions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 1,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      department TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      class_teacher_id TEXT,
      madrasa_type TEXT DEFAULT 'qawmi',
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      student_id_number TEXT UNIQUE NOT NULL,
      full_name_bn TEXT NOT NULL,
      full_name_en TEXT NOT NULL,
      gender TEXT DEFAULT 'male',
      date_of_birth TEXT NOT NULL,
      blood_group TEXT,
      admission_date TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section TEXT DEFAULT 'Alif',
      roll_number TEXT NOT NULL,
      photo_url TEXT,
      status TEXT DEFAULT 'active',
      is_residential INTEGER DEFAULT 0,
      is_hifz_student INTEGER DEFAULT 0,
      guardian_name_bn TEXT NOT NULL,
      guardian_phone TEXT NOT NULL,
      guardian_relation TEXT DEFAULT 'Father',
      emergency_contact TEXT NOT NULL,
      monthly_fee REAL DEFAULT 2000.0,
      address TEXT NOT NULL,
      created_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL, -- present, absent, late, leave
      check_in_time TEXT,
      remarks TEXT,
      recorded_by_user_id TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS hifz_records (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sabaq_para INTEGER DEFAULT 1,
      sabaq_surah TEXT NOT NULL,
      sabaq_ayah_range TEXT NOT NULL,
      sabaq_pages REAL DEFAULT 0.5,
      sabaq_rating TEXT DEFAULT 'good',
      sabqi_para INTEGER DEFAULT 1,
      sabqi_pages REAL DEFAULT 2.0,
      sabqi_mistakes INTEGER DEFAULT 0,
      sabki_para INTEGER DEFAULT 1,
      sabki_pages REAL DEFAULT 2.0,
      sabki_mistakes INTEGER DEFAULT 0,
      manzil_para INTEGER DEFAULT 1,
      manzil_mistakes INTEGER DEFAULT 0,
      teacher_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS kitab_progress (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_name_bn TEXT NOT NULL,
      kitab_name TEXT NOT NULL,
      teacher_name_bn TEXT NOT NULL,
      date TEXT NOT NULL,
      bab_or_chapter TEXT NOT NULL,
      lesson_title TEXT NOT NULL,
      pages_completed INTEGER DEFAULT 0,
      total_kitab_pages INTEGER DEFAULT 100,
      remarks TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      term TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_published INTEGER DEFAULT 0,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS exam_marks (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_name_bn TEXT NOT NULL,
      total_marks REAL DEFAULT 100,
      obtained_marks REAL NOT NULL,
      letter_grade TEXT NOT NULL,
      grade_point REAL NOT NULL,
      is_absent INTEGER DEFAULT 0,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS fee_types (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      frequency TEXT DEFAULT 'monthly',
      default_amount REAL DEFAULT 0,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS fee_invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      ledger_type TEXT DEFAULT 'non_residential', -- residential, non_residential
      fee_items_json TEXT NOT NULL, -- JSON array
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      due_amount REAL NOT NULL,
      status TEXT DEFAULT 'unpaid', -- paid, partially_paid, unpaid, overdue
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      payment_number TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- cash, bkash, nagad, rocket, bank
      transaction_id TEXT,
      status TEXT DEFAULT 'success',
      received_by_user_id TEXT NOT NULL,
      paid_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS donors (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      organization_id TEXT DEFAULT 'org_main',
      name TEXT NOT NULL,
      org_name TEXT,
      category TEXT NOT NULL, -- 'permanent' | 'annual' | 'one_time' | 'anonymous'
      contact_phone TEXT,
      whatsapp TEXT,
      email TEXT,
      commitment_frequency TEXT DEFAULT 'none', -- 'monthly' | 'annual' | 'one_time' | 'none'
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS donation_receipts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      organization_id TEXT DEFAULT 'org_main',
      receipt_no TEXT UNIQUE NOT NULL,
      donor_id TEXT NOT NULL,
      fund_type TEXT NOT NULL, -- 'lillah_orphan' | 'general' | 'waqf_construction'
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank'
      payment_reference TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (donor_id) REFERENCES donors(id)
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      organization_id TEXT DEFAULT 'org_main',
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      current_balance REAL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS bank_deposits (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      organization_id TEXT DEFAULT 'org_main',
      bank_account_id TEXT NOT NULL,
      amount REAL NOT NULL,
      deposit_slip_number TEXT NOT NULL,
      deposit_date TEXT NOT NULL,
      deposited_by TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS cash_book_daily (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      organization_id TEXT DEFAULT 'org_main',
      date TEXT NOT NULL, -- 'YYYY-MM-DD'
      opening_balance REAL DEFAULT 0.0,
      cash_collections REAL DEFAULT 0.0,
      cash_expenses REAL DEFAULT 0.0,
      bank_deposits REAL DEFAULT 0.0,
      closing_balance REAL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      UNIQUE (tenant_id, date)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      voucher_number TEXT NOT NULL,
      payee TEXT NOT NULL,
      approved_by TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS hostel_rooms (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      building_name TEXT NOT NULL,
      room_number TEXT NOT NULL,
      floor INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      occupied INTEGER DEFAULT 0,
      beds_json TEXT NOT NULL, -- JSON array
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS hostel_outpasses (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      expected_return_time TEXT NOT NULL,
      actual_return_time TEXT,
      status TEXT DEFAULT 'approved',
      approved_by TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      application_number TEXT UNIQUE NOT NULL,
      applicant_name_bn TEXT NOT NULL,
      applicant_name_en TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      guardian_name_bn TEXT NOT NULL,
      guardian_phone TEXT NOT NULL,
      applied_department TEXT NOT NULL,
      applied_class TEXT NOT NULL,
      status TEXT DEFAULT 'submitted',
      interview_score REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS library_books (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title_bn TEXT NOT NULL,
      title_ar TEXT,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      isbn TEXT,
      total_copies INTEGER DEFAULT 5,
      available_copies INTEGER DEFAULT 5,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      certificate_number TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      qr_verification_url TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      ip_address TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      definition_json TEXT NOT NULL, -- JSON object
      created_at TEXT NOT NULL,
      last_executed_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      workflow_name TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      logs_json TEXT NOT NULL,
      error TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_approvals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      execution_id TEXT NOT NULL,
      workflow_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_role TEXT NOT NULL,
      action_payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      decided_by TEXT,
      decided_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (execution_id) REFERENCES workflow_executions(id)
    );

    CREATE TABLE IF NOT EXISTS onboarding_state (
      tenant_id TEXT PRIMARY KEY,
      is_completed INTEGER DEFAULT 0,
      current_step INTEGER DEFAULT 1,
      answers_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS staff_payroll_profiles (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL DEFAULT 'org_main',
      user_id TEXT,
      staff_name TEXT NOT NULL,
      designation TEXT NOT NULL,
      base_salary REAL NOT NULL DEFAULT 0.0,
      housing_allowance REAL NOT NULL DEFAULT 0.0,
      food_allowance REAL NOT NULL DEFAULT 0.0,
      bonus_allowance REAL NOT NULL DEFAULT 0.0,
      advance_loan_deduction REAL NOT NULL DEFAULT 0.0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      account_details TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payroll_vouchers (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL DEFAULT 'org_main',
      voucher_number TEXT UNIQUE NOT NULL,
      profile_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      designation TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      base_salary REAL NOT NULL DEFAULT 0.0,
      housing_allowance REAL NOT NULL DEFAULT 0.0,
      food_allowance REAL NOT NULL DEFAULT 0.0,
      bonus_allowance REAL NOT NULL DEFAULT 0.0,
      advance_loan_deduction REAL NOT NULL DEFAULT 0.0,
      absent_deduction REAL NOT NULL DEFAULT 0.0,
      net_payable REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      verified_by TEXT,
      approved_by TEXT,
      disbursed_by TEXT,
      disbursement_method TEXT,
      transaction_reference TEXT,
      qr_code_token TEXT,
      disbursed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (profile_id) REFERENCES staff_payroll_profiles(id),
      FOREIGN KEY (verified_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (disbursed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS befaq_registrations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      marhalah TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      session_year INTEGER NOT NULL,
      exam_center TEXT NOT NULL,
      status TEXT DEFAULT 'registered',
      total_marks REAL,
      division TEXT,
      sanad_number TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS muhasaba_records (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      fajr INTEGER DEFAULT 0,
      dhuhr INTEGER DEFAULT 0,
      asr INTEGER DEFAULT 0,
      maghrib INTEGER DEFAULT 0,
      isha INTEGER DEFAULT 0,
      tahajjud INTEGER DEFAULT 0,
      tilawat_pages REAL DEFAULT 0,
      duas_read INTEGER DEFAULT 0,
      truthfulness_score INTEGER DEFAULT 5,
      adab_score INTEGER DEFAULT 5,
      total_score REAL DEFAULT 0,
      notes TEXT,
      verified_by_user_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE (tenant_id, student_id, date)
    );

    CREATE TABLE IF NOT EXISTS canteen_inventory (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      item_name_bn TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL DEFAULT 0.0,
      min_stock_alert REAL DEFAULT 10.0,
      unit_price REAL DEFAULT 0.0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS canteen_transactions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      total_cost REAL NOT NULL,
      supplier_name TEXT,
      voucher_no TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (item_id) REFERENCES canteen_inventory(id)
    );

    CREATE TABLE IF NOT EXISTS canteen_meal_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      menu_description TEXT NOT NULL,
      headcount_students INTEGER DEFAULT 0,
      headcount_staff INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0.0,
      prepared_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS class_routines (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_name_bn TEXT NOT NULL,
      teacher_id TEXT,
      teacher_name_bn TEXT NOT NULL,
      room_number TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS voice_broadcast_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      audio_url_or_tts_text TEXT NOT NULL,
      recipients_count INTEGER DEFAULT 0,
      channel TEXT DEFAULT 'voice_sms',
      status TEXT DEFAULT 'sent',
      sent_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS institution_settings (
      id TEXT PRIMARY KEY,
      tenant_id TEXT UNIQUE NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      logo_url TEXT,
      address TEXT,
      email TEXT,
      phone TEXT,
      established_year INTEGER,
      madrasa_type TEXT DEFAULT 'Qawmi',
      tagline TEXT,
      primary_color TEXT DEFAULT '#059669',
      currency_symbol TEXT DEFAULT '৳',
      hijri_year_enabled INTEGER DEFAULT 1,
      academic_year_type TEXT DEFAULT 'hijri',
      sms_sender_id TEXT,
      brevo_api_key TEXT,
      gemini_api_key TEXT,
      whatsapp_enabled INTEGER DEFAULT 1,
      messenger_enabled INTEGER DEFAULT 1,
      email_enabled INTEGER DEFAULT 1,
      late_fee_settings_json TEXT DEFAULT '{"grace_days":10,"amount":50,"type":"fixed","description":"১০ তারিখের পর বিলম্ব ফি"}',
      designation_labels_json TEXT DEFAULT '{}',
      custom_departments_json TEXT DEFAULT '[]',
      security_settings_json TEXT DEFAULT '{"two_factor_auth":false,"password_expiry_days":90,"session_timeout_minutes":60,"ip_restriction":false}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS fee_categories (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0.0,
      frequency TEXT DEFAULT 'monthly',
      ledger_type TEXT DEFAULT 'non_residential',
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS class_definitions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      department TEXT DEFAULT 'কওমী বিভাগ',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    
    CREATE TABLE IF NOT EXISTS grading_policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      effective_from TEXT,
      effective_to TEXT,
      pass_rule TEXT NOT NULL,
      min_subjects_to_pass INTEGER,
      overall_pass_percent REAL,
      core_subjects TEXT,
      default_pass_marks REAL,
      subject_pass_marks TEXT,
      grade_table TEXT,
      merit_by TEXT,
      tie_breaker TEXT,
      on_fail TEXT,
      created_by TEXT,
      approved_by TEXT,
      approved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS policy_audits (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_fields TEXT,
      changed_by TEXT,
      changed_at TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS mark_audits (
      id TEXT PRIMARY KEY,
      mark_id TEXT NOT NULL,
      old_value REAL,
      new_value REAL,
      old_marks REAL,
      new_marks REAL,
      changed_by TEXT,
      changed_at TEXT,
      reason TEXT,
      change_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS result_overrides (
      id TEXT PRIMARY KEY,
      result_id TEXT NOT NULL,
      old_grade TEXT,
      new_grade TEXT,
      old_gpa REAL,
      new_gpa REAL,
      reason TEXT,
      approved_by TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notice_delivery_logs (
      id TEXT PRIMARY KEY,
      notice_id TEXT NOT NULL,
      guardian_id TEXT,
      phone TEXT,
      channel TEXT,
      status TEXT,
      reason TEXT,
      sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role TEXT UNIQUE NOT NULL,
      can_post_notice INTEGER DEFAULT 0,
      can_push INTEGER DEFAULT 0,
      can_send_sms INTEGER DEFAULT 0,
      needs_sms_approval INTEGER DEFAULT 0,
      max_sms_recipients INTEGER DEFAULT 0,
      allowed_notice_targets TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      total_marks REAL,
      obtained_marks REAL,
      percentage REAL,
      gpa REAL,
      grade TEXT,
      merit_position INTEGER,
      is_locked INTEGER DEFAULT 0,
      published_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subject_definitions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'inst_main',
      class_id TEXT,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      code TEXT,
      total_marks REAL DEFAULT 100.0,
      pass_marks REAL DEFAULT 33.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );
    CREATE TABLE IF NOT EXISTS document_photos (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      ref_id TEXT,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      captured_by TEXT,
      captured_at TEXT NOT NULL,
      note TEXT
    );
  `);

  // Migration: Ensure ledger_type column exists on fee_invoices for existing databases
  try {
    const tableInfo = await db.all<any>("PRAGMA table_info(fee_invoices)");
    const hasLedgerType = tableInfo.some((col: any) => col.name === 'ledger_type');
    if (!hasLedgerType) {
      await db.exec(`ALTER TABLE fee_invoices ADD COLUMN ledger_type TEXT DEFAULT 'non_residential';`);
    }
  } catch {
    // Already added or error handled
  }

  // Migration: Ensure ledger_type column exists on fee_categories for existing databases
  try {
    const tableInfo = await db.all<any>("PRAGMA table_info(fee_categories)");
    const hasLedgerType = tableInfo.some((col: any) => col.name === 'ledger_type');
    if (!hasLedgerType) {
      await db.exec(`ALTER TABLE fee_categories ADD COLUMN ledger_type TEXT DEFAULT 'non_residential';`);
    }
  } catch {
    // Already added or error handled
  }

  // Create indexes for high performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_students_tenant_class ON students(tenant_id, class_id);
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(tenant_id, class_id, date);
    CREATE INDEX IF NOT EXISTS idx_hifz_student ON hifz_records(tenant_id, student_id, date);
    CREATE INDEX IF NOT EXISTS idx_invoices_student ON fee_invoices(tenant_id, student_id, status);
    CREATE INDEX IF NOT EXISTS idx_invoices_ledger ON fee_invoices(tenant_id, ledger_type);
    CREATE INDEX IF NOT EXISTS idx_donors_tenant ON donors(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_donors_category ON donors(tenant_id, category);
    CREATE INDEX IF NOT EXISTS idx_donation_receipts_fund ON donation_receipts(tenant_id, fund_type);
    CREATE INDEX IF NOT EXISTS idx_donation_receipts_donor ON donation_receipts(donor_id);
    CREATE INDEX IF NOT EXISTS idx_donation_receipts_created ON donation_receipts(tenant_id, created_at);
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_name TEXT,
      entity_id TEXT,
      details TEXT,
      timestamp TEXT NOT NULL,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS automation_logs (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      ok INTEGER DEFAULT 1,
      processed INTEGER DEFAULT 0,
      created INTEGER DEFAULT 0,
      sent INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      messages TEXT DEFAULT '[]',
      data TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS backup_logs (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      size_bytes INTEGER DEFAULT 0,
      ok INTEGER DEFAULT 1,
      message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON bank_accounts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_bank_deposits_tenant_date ON bank_deposits(tenant_id, deposit_date);
    CREATE INDEX IF NOT EXISTS idx_cash_book_daily_tenant_date ON cash_book_daily(tenant_id, date);
    CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_audit_logs ON audit_logs(tenant_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_payroll_profiles_org ON staff_payroll_profiles(organization_id);
    CREATE INDEX IF NOT EXISTS idx_payroll_profiles_user ON staff_payroll_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_payroll_vouchers_org ON payroll_vouchers(organization_id);
    CREATE INDEX IF NOT EXISTS idx_payroll_vouchers_profile ON payroll_vouchers(profile_id);
    CREATE INDEX IF NOT EXISTS idx_payroll_vouchers_month_year ON payroll_vouchers(month, year);
    CREATE INDEX IF NOT EXISTS idx_payroll_vouchers_status ON payroll_vouchers(status);
    CREATE INDEX IF NOT EXISTS idx_payroll_vouchers_qr ON payroll_vouchers(qr_code_token);
    CREATE INDEX IF NOT EXISTS idx_befaq_tenant_roll ON befaq_registrations(tenant_id, roll_number);
    CREATE INDEX IF NOT EXISTS idx_muhasaba_student_date ON muhasaba_records(tenant_id, student_id, date);
    CREATE INDEX IF NOT EXISTS idx_canteen_inventory_tenant ON canteen_inventory(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_canteen_txn_tenant ON canteen_transactions(tenant_id, date);
    CREATE INDEX IF NOT EXISTS idx_canteen_meals_tenant ON canteen_meal_logs(tenant_id, date);
    CREATE INDEX IF NOT EXISTS idx_routines_class_day ON class_routines(tenant_id, class_id, day_of_week);
    CREATE INDEX IF NOT EXISTS idx_inst_settings_tenant ON institution_settings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_fee_categories_tenant ON fee_categories(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_class_definitions_tenant ON class_definitions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_subject_definitions_tenant ON subject_definitions(tenant_id);
  `);

  try {
    await db.exec(`ALTER TABLE institution_settings ADD COLUMN gemini_api_key TEXT;`);
  } catch {
    // Column already exists
  }
  try { await db.exec('ALTER TABLE exam_marks ADD COLUMN status TEXT DEFAULT "draft"'); } catch {}
  try { await db.exec('ALTER TABLE exam_results ADD COLUMN is_locked INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE exam_results ADD COLUMN published_by TEXT'); } catch {}

  // Admissions table (missing from original schema)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admissions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      application_number TEXT UNIQUE NOT NULL,
      applicant_name_bn TEXT NOT NULL,
      applicant_name_en TEXT,
      date_of_birth TEXT,
      guardian_name_bn TEXT,
      guardian_phone TEXT,
      applied_department TEXT,
      applied_class TEXT,
      status TEXT DEFAULT 'submitted',
      interview_score REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );
  `);

  // MadrasaOS AI v3.0 Migration Extensions
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabak_line INTEGER DEFAULT 1'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabak_mistakes INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabki_para INTEGER DEFAULT 1'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabki_pages REAL DEFAULT 2.0'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabki_mistakes INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabki_para_from INTEGER'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN sabki_para_to INTEGER'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN amukhta_para_from INTEGER'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN amukhta_para_to INTEGER'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN amukhta_mistakes INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN dour_para_from INTEGER'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN dour_para_to INTEGER'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN dour_mistakes INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN client_uuid TEXT'); } catch {}
  try { await db.exec('ALTER TABLE hifz_records ADD COLUMN is_offline_sync INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN marks_open_at TEXT'); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN marks_close_at TEXT'); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN semester_id TEXT'); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN stream_id TEXT'); } catch {}
  try { await db.exec("ALTER TABLE exams ADD COLUMN status TEXT DEFAULT 'DRAFT'"); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN audited_at TEXT'); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN approved_at TEXT'); } catch {}
  try { await db.exec('ALTER TABLE exams ADD COLUMN published_at TEXT'); } catch {}
  try { await db.exec('ALTER TABLE exam_results ADD COLUMN rank_scope TEXT DEFAULT "class"'); } catch {}
  try { await db.exec('ALTER TABLE institution_settings ADD COLUMN hifz_alert_settings_json TEXT'); } catch {}
  try { await db.exec('ALTER TABLE institution_settings ADD COLUMN semester_settings_json TEXT'); } catch {}
  try { await db.exec('ALTER TABLE audit_logs ADD COLUMN created_at TEXT'); } catch {}
  try { await db.exec('ALTER TABLE audit_logs ADD COLUMN old_values TEXT'); } catch {}
  try { await db.exec('ALTER TABLE audit_logs ADD COLUMN new_values TEXT'); } catch {}
  try { await db.exec('ALTER TABLE audit_logs ADD COLUMN entity_type TEXT'); } catch {}
  try { await db.exec('UPDATE audit_logs SET created_at = timestamp WHERE created_at IS NULL'); } catch {}
  try { await db.exec('ALTER TABLE exam_marks ADD COLUMN full_marks REAL DEFAULT 100'); } catch {}
  try { await db.exec('ALTER TABLE mark_audits ADD COLUMN old_marks REAL'); } catch {}
  try { await db.exec('ALTER TABLE mark_audits ADD COLUMN new_marks REAL'); } catch {}
  try { await db.exec('ALTER TABLE mark_audits ADD COLUMN change_reason TEXT'); } catch {}
  try { await db.exec('ALTER TABLE mark_audits ADD COLUMN old_value REAL'); } catch {}
  try { await db.exec('ALTER TABLE mark_audits ADD COLUMN new_value REAL'); } catch {}
  try { await db.exec('ALTER TABLE mark_audits ADD COLUMN reason TEXT'); } catch {}

  // v3.0 Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS hifz_conflicts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      teacher_a_id TEXT NOT NULL,
      teacher_a_payload_json TEXT NOT NULL,
      teacher_b_id TEXT NOT NULL,
      teacher_b_payload_json TEXT NOT NULL,
      resolved_at TEXT,
      resolved_by TEXT,
      resolution_json TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS marks_submission (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      submitted_at TEXT,
      audited_at TEXT,
      rejection_reason TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(exam_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS re_evaluation_requests (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      status TEXT DEFAULT 'REQUESTED' NOT NULL,
      requested_at TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      outcome_json TEXT,
      reason TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER DEFAULT 40 NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS timetable_slots (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period INTEGER NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      room_id TEXT,
      effective_from TEXT NOT NULL,
      effective_to TEXT,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS timetable_versions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      published_at TEXT NOT NULL,
      published_by TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES institutions(id)
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      guardian_id TEXT NOT NULL,
      type TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      evidence_file_id TEXT
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      response_body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
