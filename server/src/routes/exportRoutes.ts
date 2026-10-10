import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { exportToCsv, exportToXlsx } from '../utils/exportUtils.js';
import { db } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';

import fs from 'fs';

const router = Router();

// Middleware for admin/accountant/principal
const exportAuth = [authenticate, (req: any, res: any, next: any) => next()];

router.get('/students.csv', exportAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'inst_main';

    const students = await db.all(`SELECT student_id_number, full_name_en, class_id, roll_number, is_residential FROM students WHERE tenant_id = ? AND status = 'active'`, [tenantId]);
    const headers = ['Student ID', 'Name', 'Class', 'Roll', 'Residential Status'];
    const rows = students.map((s: any) => [s.student_id_number, s.full_name_en, s.class_id, s.roll_number, s.is_residential ? 'Residential' : 'Non-residential']);

    const filePath = path.join(process.cwd(), 'uploads', 'exports', `students_${Date.now()}.csv`);
    await exportToCsv(filePath, headers, rows);
    
    if (!fs.existsSync(filePath)) {
      console.error('FILE DOES NOT EXIST', filePath);
    } else {
      console.error('FILE EXISTS', filePath);
    }

    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.setHeader('Content-Type', 'text/csv');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(filePath, () => {}));
    stream.on('error', (err) => next(err));
  } catch (error) {
    next(error);
  }
});

router.get('/students.xlsx', exportAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'inst_main';

    const students = await db.all(`SELECT student_id_number, full_name_en, class_id, roll_number, is_residential FROM students WHERE tenant_id = ? AND status = 'active'`, [tenantId]);
    const headers = ['Student ID', 'Name', 'Class', 'Roll', 'Residential Status'];
    const rows = students.map((s: any) => [s.student_id_number, s.full_name_en, s.class_id, s.roll_number, s.is_residential ? 'Residential' : 'Non-residential']);

    const filePath = path.join(process.cwd(), 'uploads', 'exports', `students_${Date.now()}.xlsx`);
    await exportToXlsx(filePath, headers, rows);

    res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(filePath, () => {}));
    stream.on('error', (err) => next(err));
  } catch (error) {
    next(error);
  }
});

router.get('/attendance.csv', exportAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'inst_main';
    const date = req.query.date as string;

    const attendance = await db.all(`
      SELECT s.student_id_number, s.full_name_en, s.class_id, a.status 
      FROM attendance_records a
      JOIN students s ON a.student_id = s.id
      WHERE a.tenant_id = ? AND a.date = ?
    `, [tenantId, date]);

    const headers = ['Student ID', 'Name', 'Class', 'Status'];
    const rows = attendance.map((a: any) => [a.student_id_number, a.full_name_en, a.class_id, a.status]);

    const filePath = path.join(process.cwd(), 'uploads', 'exports', `attendance_${Date.now()}.csv`);
    await exportToCsv(filePath, headers, rows);

    res.download(filePath, 'attendance.csv', (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    next(error);
  }
});

router.get('/fee-dues.csv', exportAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'inst_main';

    const dues = await db.all(`
      SELECT i.invoice_number, s.full_name_en, s.class_id, i.total_amount, i.due_amount, i.due_date 
      FROM fee_invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.tenant_id = ? AND i.due_amount > 0
    `, [tenantId]);

    const headers = ['Invoice', 'Name', 'Class', 'Total', 'Due', 'Due Date'];
    const rows = dues.map((d: any) => [d.invoice_number, d.full_name_en, d.class_id, d.total_amount, d.due_amount, d.due_date]);

    const filePath = path.join(process.cwd(), 'uploads', 'exports', `fee_dues_${Date.now()}.csv`);
    await exportToCsv(filePath, headers, rows);

    res.download(filePath, 'fee-dues.csv', (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    next(error);
  }
});

router.get('/results.csv', exportAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'inst_main';
    const examId = req.query.examId as string;
    const results = await db.all(`
      SELECT s.student_id_number, s.full_name_en, s.class_id, r.total_marks, r.grade
      FROM exam_results r
      JOIN students s ON r.student_id = s.id
      WHERE s.tenant_id = ? AND r.exam_id = ?
    `, [tenantId, examId]);

    const headers = ['Student ID', 'Name', 'Class', 'Total Marks', 'Grade'];
    const rows = results.map((r: any) => [r.student_id_number, r.full_name_en, r.class_id, r.total_marks, r.grade]);

    const filePath = path.join(process.cwd(), 'uploads', 'exports', `results_${Date.now()}.csv`);
    await exportToCsv(filePath, headers, rows);

    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    res.setHeader('Content-Type', 'text/csv');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(filePath, () => {}));
    stream.on('error', (err) => next(err));
  } catch (error) {
    next(error);
  }
});

export default router;
