
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
      `INSERT INTO result_overrides (id, result_id, old_grade, new_grade, old_gpa, new_gpa, reason, approved_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [`override_${Date.now()}`, resultId, result.grade, new_grade, result.gpa, new_gpa, reason, approved_by]
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
