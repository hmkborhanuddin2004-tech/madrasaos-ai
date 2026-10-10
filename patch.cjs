const fs = require('fs');

function updateSchema() {
  const file = 'server/src/db/schema.ts';
  let content = fs.readFileSync(file, 'utf8');

  const tables = `
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
      changed_by TEXT,
      changed_at TEXT,
      reason TEXT
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
`;

  content = content.replace('CREATE TABLE IF NOT EXISTS subject_definitions (', tables + '\n    CREATE TABLE IF NOT EXISTS subject_definitions (');

  content += `
  try { await db.exec('ALTER TABLE exam_marks ADD COLUMN status TEXT DEFAULT "draft"'); } catch {}
  try { await db.exec('ALTER TABLE exam_results ADD COLUMN is_locked INTEGER DEFAULT 0'); } catch {}
  try { await db.exec('ALTER TABLE exam_results ADD COLUMN published_by TEXT'); } catch {}
`;

  fs.writeFileSync(file, content);
}

function updateSeed() {
  const file = 'server/src/db/seed.ts';
  let content = fs.readFileSync(file, 'utf8');

  const seedSnippet = `
  // Seed role_permissions
  await db.exec(\`
    INSERT INTO role_permissions (id, role, can_post_notice, can_push, can_send_sms, needs_sms_approval, max_sms_recipients, allowed_notice_targets)
    VALUES 
      ('rp1', 'muhtamim', 1, 1, 1, 0, 10000, '["all"]'),
      ('rp2', 'teacher', 1, 1, 0, 1, 50, '["class"]'),
      ('rp3', 'accountant', 1, 0, 1, 1, 1000, '["defaulters"]'),
      ('rp4', 'guardian', 0, 0, 0, 0, 0, '[]'),
      ('rp5', 'student', 0, 0, 0, 0, 0, '[]')
    ON CONFLICT(role) DO NOTHING;
  \`);

  // Seed grading_policies
  await db.exec(\`
    INSERT INTO grading_policies (id, name, is_active, pass_rule, default_pass_marks, grade_table, created_by, approved_at)
    VALUES (
      'policy1', 'Standard Bangladesh Qawmi', 1, 'strict', 40,
      '[{"min":90,"grade":"A+","gpa":5},{"min":80,"grade":"A","gpa":4},{"min":70,"grade":"A-","gpa":3.5},{"min":60,"grade":"B","gpa":3},{"min":50,"grade":"C","gpa":2},{"min":40,"grade":"D","gpa":1},{"min":0,"grade":"F","gpa":0}]',
      'system', '2026-01-01'
    ) ON CONFLICT(id) DO NOTHING;
  \`);
  
  // Create sample exam and result if missing
  try {
    await db.exec(\`
      INSERT INTO exams (id, tenant_id, name_bn, term, academic_year, start_date, end_date, is_published)
      VALUES ('exam1', 'inst_main', 'Test Exam', 'Term 1', '2026', '2026-01-01', '2026-01-10', 1)
      ON CONFLICT(id) DO NOTHING;
      
      INSERT INTO exam_results (id, exam_id, student_id, total_marks, obtained_marks, percentage, gpa, grade, merit_position, created_at)
      VALUES ('res1', 'exam1', 'stu1', 100, 85, 85, 4.0, 'A', 1, '2026-01-15')
      ON CONFLICT(id) DO NOTHING;
    \`);
  } catch(e) {}
`;

  content = content.replace("console.log('Database seeded successfully');", seedSnippet + "\n  console.log('Database seeded successfully');");

  fs.writeFileSync(file, content);
}

updateSchema();
updateSeed();
console.log('Done');
