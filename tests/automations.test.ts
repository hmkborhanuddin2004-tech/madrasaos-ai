import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../server/src/db/db.js';
import { AutomationContext } from '../server/src/services/automations/context.js';
import { ConsoleSms } from '../server/src/services/sms/smsGateway.js';
import { globalRegistry } from '../server/src/services/automations/registry.js';
import fs from 'fs';
import path from 'path';

describe('Phase 2: Automation Engine Tests', () => {
  let db: DatabaseService;
  let ctx: AutomationContext;

  beforeAll(async () => {
    // Use in-memory database with minimal schema matching automation SQL
    db = new DatabaseService(':memory:');

    // Create only the tables needed by automations (simplified, no multi-tenancy)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, name TEXT);
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY, class_id TEXT, name_bn TEXT,
        guardian_phone TEXT, is_active INTEGER DEFAULT 1, is_residential INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY, class_id TEXT, name TEXT,
        pass_marks REAL DEFAULT 33, full_marks REAL DEFAULT 100, is_core INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS fee_structures (
        id TEXT PRIMARY KEY, class_id TEXT, is_residential INTEGER, total_amount REAL
      );
      CREATE TABLE IF NOT EXISTS fee_invoices (
        id TEXT PRIMARY KEY, student_id TEXT, year INTEGER, month INTEGER,
        total_amount REAL, paid_amount REAL DEFAULT 0, due_date TEXT,
        status TEXT DEFAULT 'unpaid', created_at TEXT, updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, student_id TEXT, date TEXT, status TEXT
      );
      CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name_bn TEXT, is_active INTEGER DEFAULT 1);
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id TEXT PRIMARY KEY, staff_id TEXT, date TEXT, status TEXT
      );
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY, class_id TEXT, name TEXT, start_date TEXT
      );
      CREATE TABLE IF NOT EXISTS marks (
        id TEXT PRIMARY KEY, exam_id TEXT, student_id TEXT,
        subject_id TEXT, obtained_marks REAL
      );
      CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY, exam_id TEXT, student_id TEXT,
        total_marks REAL, percent REAL, grade TEXT, gpa REAL,
        is_pass INTEGER DEFAULT 0, merit_position INTEGER, is_locked INTEGER DEFAULT 0,
        published_at TEXT, published_by TEXT
      );
      CREATE TABLE IF NOT EXISTS grading_policies (
        id TEXT PRIMARY KEY, name TEXT, effective_from TEXT, pass_rule TEXT,
        min_subjects_to_pass INTEGER, overall_pass_percent REAL, merit_by TEXT,
        grade_table TEXT, is_active INTEGER DEFAULT 0, core_subjects TEXT,
        default_pass_marks REAL, subject_pass_marks TEXT
      );
      CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY, title TEXT, body TEXT,
        target_type TEXT, target_ids TEXT, channel TEXT,
        approval_status TEXT, dispatched_at TEXT,
        total_recipients INTEGER DEFAULT 0, sms_sent INTEGER DEFAULT 0,
        sms_failed INTEGER DEFAULT 0, sms_cost REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS notice_delivery_logs (
        id TEXT PRIMARY KEY, notice_id TEXT, phone TEXT,
        status TEXT, channel TEXT, reason TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY, kind TEXT, ref TEXT, phone TEXT, sent_at TEXT,
        UNIQUE(kind, ref, phone)
      );
      CREATE TABLE IF NOT EXISTS backup_logs (
        id TEXT PRIMARY KEY, path TEXT, size_bytes INTEGER,
        ok INTEGER DEFAULT 1, message TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS automation_logs (
        id TEXT PRIMARY KEY, key TEXT, started_at TEXT, finished_at TEXT,
        ok INTEGER DEFAULT 1, processed INTEGER DEFAULT 0, created INTEGER DEFAULT 0,
        sent INTEGER DEFAULT 0, failed INTEGER DEFAULT 0,
        messages TEXT DEFAULT '[]', data TEXT DEFAULT '{}'
      );
    `);

    const sms = new ConsoleSms();
    const config = {
      madrasa_name: 'Test Madrasa',
      fee_due_day: '10',
      sms_rate: '0.35',
      backup_dir: path.join(process.cwd(), 'tests', 'temp_backups'),
      backup_keep_days: '14'
    };
    ctx = new AutomationContext(db, sms, config, true);

    // Seed basic data needed for automations
    await db.exec(
      "INSERT INTO classes (id, name) VALUES ('c1', 'Class 1');" +
      "INSERT INTO subjects (id, class_id, name, pass_marks, full_marks, is_core) VALUES " +
        "('sub1', 'c1', 'Math', 33, 100, 1)," +
        "('sub2', 'c1', 'English', 33, 100, 1);" +
      "INSERT INTO students (id, class_id, name_bn, guardian_phone, is_active, is_residential) VALUES " +
        "('s1', 'c1', 'Student 1', '01700000001', 1, 0)," +
        "('s2', 'c1', 'Student 2', '01700000001', 1, 0)," +
        "('s3', 'c1', 'Student 3', '01700000002', 1, 1);" +
      "INSERT INTO fee_structures (id, class_id, is_residential, total_amount) VALUES " +
        "('f1', 'c1', 0, 500)," +
        "('f2', 'c1', 1, 1500);" +
      "INSERT INTO exams (id, class_id, name, start_date) VALUES ('exam1', 'c1', 'Term 1', '2023-01-01');" +
      "INSERT INTO grading_policies (id, name, effective_from, pass_rule, min_subjects_to_pass, overall_pass_percent, merit_by, grade_table, is_active) VALUES " +
        "('gp1', 'Strict', '2020-01-01', 'strict', 2, 33, 'total', '[{\"min_percent\":80,\"grade\":\"A+\",\"gpa\":5.0},{\"min_percent\":33,\"grade\":\"D\",\"gpa\":1.0}]', 1);"
    );
  });

  afterAll(async () => {
    await db.close();
    const backupDir = path.join(process.cwd(), 'tests', 'temp_backups');
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
  });

  it('should generate fee invoices correctly', async () => {
    const res = await globalRegistry.runOne('fee_invoice_generate', ctx, { year: 2023, month: 1 });
    expect(res.ok).toBe(true);
    expect(res.created).toBe(3); // 3 students
    
    // running again should skip duplicates
    const res2 = await globalRegistry.runOne('fee_invoice_generate', ctx, { year: 2023, month: 1 });
    expect(res2.skipped).toBe(3);
    expect(res2.created).toBe(0);
  });

  it('should group fee reminders by phone and send SMS', async () => {
    // Modify one invoice to be past due
    const today = ctx.today();
    await db.run("UPDATE fee_invoices SET due_date = '2022-01-01' WHERE year = 2023 AND month = 1");
    
    const res = await globalRegistry.runOne('fee_due_reminder', ctx);
    expect(res.ok).toBe(true);
    expect(res.sent).toBe(2); // 2 unique phones (01700000001, 01700000002)
  });

  it('should send absence SMS grouped by phone', async () => {
    const today = ctx.today();
    await db.exec(
      "INSERT INTO attendance (id, student_id, date, status) VALUES " +
        "('a1', 's1', '" + today + "', 'A')," +
        "('a2', 's2', '" + today + "', 'A')," +
        "('a3', 's3', '" + today + "', 'A');"
    );

    const res = await globalRegistry.runOne('attendance_absent_sms', ctx, { on_date: today });
    expect(res.ok).toBe(true);
    expect(res.sent).toBe(2); // Grouped s1 & s2 to one phone
  });

  it('should dispatch notices with conditional targets', async () => {
    await db.exec(
      "INSERT INTO notices (id, title, body, target_type, target_ids, channel, approval_status) VALUES " +
        "('n1', 'Test Notice', 'Body', 'conditional', 'due_fee', 'sms', 'approved');"
    );

    const res = await globalRegistry.runOne('notice_dispatch', ctx);
    expect(res.ok).toBe(true);
    expect(res.sent).toBeGreaterThan(0);
  });

  it('should process results with strict policy', async () => {
    await db.exec(
      "INSERT INTO marks (id, exam_id, student_id, subject_id, obtained_marks) VALUES " +
        "('m1', 'exam1', 's1', 'sub1', 80)," +
        "('m2', 'exam1', 's1', 'sub2', 85)," +
        "('m3', 'exam1', 's2', 'sub1', 20)," +
        "('m4', 'exam1', 's2', 'sub2', 40);"
    );

    const res = await globalRegistry.runOne('result_process', ctx, { exam_id: 'exam1' });
    expect(res.ok).toBe(true);
    
    const r1 = await db.get("SELECT is_pass, gpa, grade, merit_position FROM results WHERE student_id = 's1'");
    expect(r1.is_pass).toBe(1);
    expect(r1.gpa).toBe(5.0);
    expect(r1.merit_position).toBe(1);

    const r2 = await db.get("SELECT is_pass, gpa, grade FROM results WHERE student_id = 's2'");
    expect(r2.is_pass).toBe(0);
    expect(r2.grade).toBe('F');
  });

  it('should handle db backup correctly', async () => {
    // Create dummy db file in data dir
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbFile = path.join(dataDir, 'madrasa.sqlite');
    fs.writeFileSync(dbFile, 'dummy data');

    const res = await globalRegistry.runOne('db_backup', ctx);
    expect(res.ok).toBe(true);
    expect(res.data.size).toBeGreaterThan(0);

    const logs = await db.all("SELECT * FROM backup_logs");
    expect(logs.length).toBe(1);
    
    // cleanup
    fs.unlinkSync(dbFile);
  });
});
