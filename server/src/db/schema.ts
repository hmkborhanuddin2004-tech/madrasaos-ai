import { db } from './db.js';

export async function initializeDatabase(): Promise<void> {
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
  `);

  // Create indexes for high performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_students_tenant_class ON students(tenant_id, class_id);
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(tenant_id, class_id, date);
    CREATE INDEX IF NOT EXISTS idx_hifz_student ON hifz_records(tenant_id, student_id, date);
    CREATE INDEX IF NOT EXISTS idx_invoices_student ON fee_invoices(tenant_id, student_id, status);
    CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_audit_logs ON audit_logs(tenant_id, timestamp);
  `);
}
