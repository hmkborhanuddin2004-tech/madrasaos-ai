const fs = require('fs');
let content = fs.readFileSync('server/src/db/seed.ts', 'utf8');

const newSeed = `
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
    await db.run(\`
      INSERT INTO grading_policies (
        id, name, is_active, pass_rule, default_pass_marks,
        grade_table, created_by
      ) VALUES (
        'pol_qawmi_std', 'Standard Bangladesh Qawmi', 1, 'strict', 40,
        ?, 'usr_super'
      )
    \`, [JSON.stringify(gradeTable)]);
  }

  const existingRoles = await db.get('SELECT id FROM role_permissions LIMIT 1');
  if (!existingRoles) {
    const roles = ['super_admin', 'madrasa_admin', 'principal', 'teacher', 'hifz_teacher', 'accountant', 'hostel_manager', 'guardian', 'student'];
    for (const r of roles) {
      await db.run(\`
        INSERT INTO role_permissions (id, role, can_post_notice, can_push, can_send_sms, needs_sms_approval, max_sms_recipients, allowed_notice_targets)
        VALUES (?, ?, 1, 1, 1, 0, 1000, '[]')
      \`, [\`rp_\${r}\`, r]);
    }
  }

  // Check if exam results exist, if not, create one
  const existingResult = await db.get('SELECT id FROM exam_results LIMIT 1');
  if (!existingResult) {
    await db.run(\`
      INSERT INTO exam_results (id, exam_id, student_id, total_marks, obtained_marks, percentage, gpa, grade, merit_position, is_locked, published_by, created_at)
      VALUES ('res_demo_01', 'exam_first_term_2026', 'std_001', 200, 180, 90.0, 5.0, 'A+', 1, 1, 'usr_principal', ?)
    \`, [now]);
  }
}
`;

content = content.replace('export async function seedSettingsAndDefinitionsIfEmpty', newSeed + '\nexport async function seedSettingsAndDefinitionsIfEmpty');
content = content.replace('await seedSettingsAndDefinitionsIfEmpty(now);', 'await seedSettingsAndDefinitionsIfEmpty(now);\n    await seedGradingAndRolesIfEmpty(now);');

fs.writeFileSync('server/src/db/seed.ts', content);
