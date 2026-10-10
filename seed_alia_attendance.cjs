const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('data/madrasaos.sqlite');

db.serialize(() => {
  // 1. Seed Alia students if not present
  db.get("SELECT count(*) as c FROM students WHERE class_id = 'cls_dakhil_6'", (err, row) => {
    if (row && row.c === 0) {
      console.log('Seeding Alia students...');
      const stmt = db.prepare(`INSERT INTO students (
        id, tenant_id, branch_id, class_id, student_id_number, full_name_bn, full_name_en,
        gender, roll_number, date_of_birth, admission_date, blood_group, is_hifz_student, is_residential,
        status, guardian_name_bn, guardian_phone, guardian_relation, emergency_contact, monthly_fee, address, created_at
      ) VALUES (?, 'inst_main', 'branch_mirpur', ?, ?, ?, ?, 'male', ?, '2012-05-10', '2025-01-01', 'O+', 0, 0, 'active', ?, '01712345678', 'Father', '01712345678', 1500, 'ঢাকা, বাংলাদেশ', datetime('now'))`);

      stmt.run('std_alia_001', 'cls_dakhil_6', 'ALIA-2026-001', 'মুহাম্মদ তানভীর আহমেদ', 'Muhammad Tanvir Ahmed', '1', 'জনাব রফিকুল ইসলাম');
      stmt.run('std_alia_002', 'cls_dakhil_6', 'ALIA-2026-002', 'আব্দুর রহমান শাকিল', 'Abdur Rahman Shakil', '2', 'জনাব খলিলুর রহমান');
      stmt.run('std_alia_003', 'cls_alim_1', 'ALIA-2026-003', 'মাহমুদুল হাসান ফুয়াদ', 'Mahmudul Hasan Fuad', '1', 'মাওলানা নুরুল ইসলাম');
      stmt.run('std_alia_004', 'cls_ibtedaee_5', 'ALIA-2026-004', 'আহমাদুল্লাহ আল-গালিব', 'Ahmadullah Al-Ghalib', '1', 'জনাব আনোয়ার হোসেন');
      stmt.finalize();
      console.log('Alia students seeded.');
    } else {
      console.log('Alia students already exist.');
    }
  });

  // 2. Ensure attendance exists for today (2026-09-23)
  const today = '2026-09-23';
  db.get('SELECT count(*) as c FROM attendance_records WHERE date = ?', [today], (err, row) => {
    if (row && row.c === 0) {
      console.log('Copying recent attendance records to today (' + today + ')...');
      db.run(`INSERT INTO attendance_records (id, tenant_id, branch_id, class_id, student_id, date, status, check_in_time, remarks, recorded_by_user_id)
        SELECT 'att_' || hex(randomblob(8)), tenant_id, branch_id, class_id, student_id, '${today}', status, check_in_time, remarks, recorded_by_user_id
        FROM attendance_records WHERE date = '2026-09-20'`, (err) => {
          if (err) console.error('Error copying attendance:', err);
          else console.log('Today attendance seeded successfully.');
        });
    } else {
      console.log('Today attendance already exists: ' + row.c);
    }
  });
});
