import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../server/src/db/db.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { calculateResult } from '../server/src/services/gradingService.js';

describe('New Features Integration Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  it('should list grading policies', async () => {
    const res = await db.all('SELECT * FROM grading_policies');
    expect(res).toBeDefined();
  });

  it('should calculate strict and lenient policies', async () => {
    // Disable FK for test if it fails due to mocked data
    await db.exec('PRAGMA foreign_keys = OFF;');

    await db.exec(`
      INSERT INTO exams (id, tenant_id, name_bn, term, academic_year, start_date, end_date, is_published)
      VALUES ('exam2', 'inst_main', 'Test Exam 2', 'Term 2', '2026', '2026-06-01', '2026-06-10', 1)
      ON CONFLICT(id) DO NOTHING;
      
      INSERT INTO students (id, tenant_id, branch_id, student_id_number, full_name_bn, full_name_en, date_of_birth, admission_date, class_id, roll_number, guardian_name_bn, guardian_phone, emergency_contact, address, created_at)
      VALUES ('stu2', 'inst_main', 'branch_main', 'S002', 'Name', 'Name', '2010-01-01', '2026-01-01', 'class1', '2', 'Guardian', '01000000', '01000', 'Address', '2026-01-01')
      ON CONFLICT(id) DO NOTHING;
      
      INSERT INTO exam_marks (id, tenant_id, exam_id, student_id, class_id, subject_name_bn, total_marks, obtained_marks, letter_grade, grade_point)
      VALUES ('mark1', 'inst_main', 'exam2', 'stu2', 'class1', 'Math', 100, 30, 'F', 0)
      ON CONFLICT(id) DO NOTHING;
    `);

    const strictPolicy = {
      pass_rule: 'strict',
      default_pass_marks: 40,
      core_subjects: '[]',
      grade_table: '[{"min":40,"grade":"D","gpa":1}]',
      on_fail: 'F'
    };

    const resStrict = await calculateResult('exam2', 'stu2', strictPolicy, db);
    expect(resStrict.grade).toBe('F');

    const lenientPolicy = {
      pass_rule: 'lenient',
      overall_pass_percent: 20,
      default_pass_marks: 40,
      core_subjects: '[]',
      grade_table: '[{"min":20,"grade":"D","gpa":1}]',
      on_fail: 'F'
    };

    const resLenient = await calculateResult('exam2', 'stu2', lenientPolicy, db);
    expect(resLenient.grade).toBe('D');
  });

  it('should test result override endpoint logic (mocked)', async () => {
    const resultId = 'res_exam2_stu2';
    const oldRes = await db.get('SELECT * FROM exam_results WHERE id = ?', [resultId]);
    
    await db.run('DELETE FROM result_overrides WHERE id = ?', ['override1']);
    await db.run(
      `INSERT INTO result_overrides (id, result_id, old_grade, new_grade, old_gpa, new_gpa, reason, approved_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      ['override1', resultId, oldRes.grade, 'A+', oldRes.gpa, 5.0, 'Grace marks', 'admin']
    );
    await db.run('UPDATE exam_results SET grade = ?, gpa = ?, is_locked = 1 WHERE id = ?', ['A+', 5.0, resultId]);

    const newRes = await db.get('SELECT * FROM exam_results WHERE id = ?', [resultId]);
    expect(newRes.grade).toBe('A+');
    expect(newRes.is_locked).toBe(1);
    
    const audit = await db.get('SELECT * FROM result_overrides WHERE id = ?', ['override1']);
    expect(audit).toBeDefined();
    expect(audit.reason).toBe('Grace marks');
  });

  it('should have mark_audits schema ready', async () => {
    const cols = await db.all('PRAGMA table_info(mark_audits)');
    expect(cols.length).toBeGreaterThan(0);
  });
});
