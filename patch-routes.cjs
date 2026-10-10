const fs = require('fs');
const path = require('path');

function patchSettingsRoutes() {
  const file = 'server/src/routes/settingsRoutes.ts';
  let content = fs.readFileSync(file, 'utf8');

  const newRoutes = `
// Grading Policies
router.get('/grading-policies', async (req, res) => {
  try {
    const policies = await db.all('SELECT * FROM grading_policies ORDER BY created_at DESC');
    res.json(policies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/grading-policies', async (req, res) => {
  try {
    const p = req.body;
    const id = \`policy_\${Date.now()}\`;
    await db.run(
      \`INSERT INTO grading_policies (id, name, is_active, pass_rule, min_subjects_to_pass, overall_pass_percent, core_subjects, default_pass_marks, subject_pass_marks, grade_table, merit_by, tie_breaker, on_fail, created_by, approved_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))\`,
      [id, p.name, p.is_active || 0, p.pass_rule, p.min_subjects_to_pass || 0, p.overall_pass_percent || 0, JSON.stringify(p.core_subjects || []), p.default_pass_marks || 40, JSON.stringify(p.subject_pass_marks || {}), JSON.stringify(p.grade_table || []), p.merit_by, p.tie_breaker, p.on_fail, p.created_by || 'system', p.approved_by]
    );
    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/grading-policies/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    await db.exec('UPDATE grading_policies SET is_active = 0');
    await db.run('UPDATE grading_policies SET is_active = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
`;

  // Find the place before export default router;
  content = content.replace('export default router;', newRoutes + '\nexport default router;');
  fs.writeFileSync(file, content);
}

function patchExamRoutes() {
  const file = 'server/src/routes/examRoutes.ts';
  let content = fs.readFileSync(file, 'utf8');

  const newRoutes = `
router.get('/:examId/marks/:studentId/audit', async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    // For simplicity, fetch marks and then audit logs
    const marks = await db.all('SELECT id FROM exam_marks WHERE exam_id = ? AND student_id = ?', [examId, studentId]);
    if (marks.length === 0) return res.json([]);
    const markIds = marks.map((m: any) => \`'\${m.id}'\`).join(',');
    const audits = await db.all(\`SELECT * FROM mark_audits WHERE mark_id IN (\${markIds}) ORDER BY changed_at DESC\`);
    res.json(audits);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
`;

  content = content.replace('export default router;', newRoutes + '\nexport default router;');
  fs.writeFileSync(file, content);
}

function patchNotificationRoutes() {
  const file = 'server/src/routes/notificationRoutes.ts';
  let content = fs.readFileSync(file, 'utf8');

  const newRoutes = `
router.get('/:noticeId/delivery-log', async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM notice_delivery_logs WHERE notice_id = ? ORDER BY sent_at DESC', [req.params.noticeId]);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
`;

  content = content.replace('export default router;', newRoutes + '\nexport default router;');
  fs.writeFileSync(file, content);
}

function createResultRoutes() {
  const file = 'server/src/routes/resultRoutes.ts';
  const content = `
import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

router.post('/:resultId/override', async (req, res) => {
  try {
    const { resultId } = req.params;
    const { new_grade, new_gpa, reason, approved_by } = req.body;
    
    const result = await db.get('SELECT * FROM exam_results WHERE id = ?', [resultId]);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    
    await db.run(
      \`INSERT INTO result_overrides (id, result_id, old_grade, new_grade, old_gpa, new_gpa, reason, approved_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))\`,
      [\`override_\${Date.now()}\`, resultId, result.grade, new_grade, result.gpa, new_gpa, reason, approved_by]
    );
    
    await db.run(
      'UPDATE exam_results SET grade = ?, gpa = ?, is_locked = 1 WHERE id = ?',
      [new_grade, new_gpa, resultId]
    );
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
`;
  fs.writeFileSync(file, content);
}

function patchIndex() {
  const file = 'server/src/routes/index.ts';
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('resultRoutes')) {
    content = content.replace("import authRoutes from './authRoutes.js';", "import authRoutes from './authRoutes.js';\nimport resultRoutes from './resultRoutes.js';");
    content = content.replace("router.use('/auth', authRoutes);", "router.use('/auth', authRoutes);\nrouter.use('/results', resultRoutes);");
    fs.writeFileSync(file, content);
  }
}

patchSettingsRoutes();
patchExamRoutes();
patchNotificationRoutes();
createResultRoutes();
patchIndex();
console.log('Routes patched');
