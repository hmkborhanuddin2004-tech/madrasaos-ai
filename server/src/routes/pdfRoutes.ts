import express from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ─── helper: header with institution name ──────────────────────────────────
async function getInstitution() {
  const inst = await db.get(
    `SELECT name_bn, name_en, address, phone, logo_url FROM institution_settings LIMIT 1`
  ).catch(() => null);
  return inst || { name_bn: 'মাদরাসা', name_en: 'Madrasa', address: '', phone: '' };
}

function addHeader(doc: PDFKit.PDFDocument, inst: any) {
  doc.rect(0, 0, doc.page.width, 70).fill('#059669');
  doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
    .text(inst.name_en || inst.name_bn || 'Madrasa', 0, 15, { align: 'center' });
  if (inst.address) {
    doc.fontSize(9).font('Helvetica').text(inst.address, 0, 36, { align: 'center' });
  }
  if (inst.phone) {
    doc.fontSize(9).text(`Phone: ${inst.phone}`, 0, 50, { align: 'center' });
  }
  doc.fillColor('#111827').moveDown(0);
}

// ─── GET /api/v1/pdf/result/:exam_id ─────────────────────────────────────────
router.get('/result/:exam_id', authenticate, async (req, res) => {
  try {
    const { exam_id } = req.params;
    const inst = await getInstitution();

    const exam = await db.get(`SELECT * FROM exams WHERE id = ?`, [exam_id]);
    if (!exam) return res.status(404).json({ ok: false, error: 'Exam not found' });

    // Get all results with student details
    const results = await db.all(`
      SELECT
        r.*, s.full_name_bn, s.full_name_en, s.student_id_number,
        c.name_bn as class_name
      FROM results r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE r.exam_id = ?
      ORDER BY COALESCE(r.merit_position, 9999) ASC, s.full_name_bn ASC
    `, [exam_id]);

    if (results.length === 0) {
      return res.status(404).json({ ok: false, error: 'No results found for this exam' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="result_${exam_id}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    addHeader(doc, inst);

    doc.moveDown(0.5).fontSize(14).font('Helvetica-Bold')
      .text(`Result Sheet`, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text(`Exam: ${exam.name_bn || exam.name_en || exam_id}`, { align: 'center' });
    if (exam.academic_year) {
      doc.text(`Academic Year: ${exam.academic_year}`, { align: 'center' });
    }
    doc.moveDown(0.5);

    // Table header
    const cols = { rank: 40, id: 70, name: 180, total: 70, pct: 55, grade: 55, gpa: 45, pass: 50 };
    const startX = 40;
    let y = doc.y;

    doc.rect(startX, y, doc.page.width - 80, 22).fill('#D1FAE5');
    doc.fillColor('#065F46').fontSize(9).font('Helvetica-Bold');
    let x = startX + 4;
    doc.text('Rank', x, y + 6, { width: cols.rank }); x += cols.rank;
    doc.text('Student ID', x, y + 6, { width: cols.id }); x += cols.id;
    doc.text('Name', x, y + 6, { width: cols.name }); x += cols.name;
    doc.text('Total', x, y + 6, { width: cols.total }); x += cols.total;
    doc.text('%', x, y + 6, { width: cols.pct }); x += cols.pct;
    doc.text('Grade', x, y + 6, { width: cols.grade }); x += cols.grade;
    doc.text('GPA', x, y + 6, { width: cols.gpa }); x += cols.gpa;
    doc.text('Pass', x, y + 6, { width: cols.pass });

    y += 22;

    // Table rows
    results.forEach((r: any, i: number) => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 40;
      }
      const bg = i % 2 === 0 ? '#F9FAFB' : 'white';
      doc.rect(startX, y, doc.page.width - 80, 18).fill(bg);
      doc.fillColor(r.is_pass ? '#111827' : '#DC2626').fontSize(8).font('Helvetica');
      x = startX + 4;
      doc.text(String(r.merit_position || '—'), x, y + 5, { width: cols.rank }); x += cols.rank;
      doc.text(r.student_id_number || '—', x, y + 5, { width: cols.id }); x += cols.id;
      doc.text(r.full_name_en || r.full_name_bn || '—', x, y + 5, { width: cols.name }); x += cols.name;
      doc.text(String(r.total_marks ?? '—'), x, y + 5, { width: cols.total }); x += cols.total;
      doc.text(r.percent != null ? `${Number(r.percent).toFixed(1)}%` : '—', x, y + 5, { width: cols.pct }); x += cols.pct;
      doc.text(r.grade || '—', x, y + 5, { width: cols.grade }); x += cols.grade;
      doc.text(r.gpa != null ? String(Number(r.gpa).toFixed(2)) : '—', x, y + 5, { width: cols.gpa }); x += cols.gpa;
      doc.text(r.is_pass ? 'Pass' : 'Fail', x, y + 5, { width: cols.pass });
      y += 18;
    });

    // Footer
    doc.moveDown(2).fontSize(8).fillColor('#6B7280').font('Helvetica')
      .text(`Generated: ${new Date().toLocaleString('en-BD')} | Total Students: ${results.length}`, { align: 'center' });

    doc.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
});

// ─── GET /api/v1/pdf/result-card/:student_id/:exam_id ────────────────────────
// Individual student result card (printable, A5 size)
router.get('/result-card/:student_id/:exam_id', authenticate, async (req, res) => {
  try {
    const { student_id, exam_id } = req.params;
    const inst = await getInstitution();

    const student = await db.get(`
      SELECT s.*, c.name_bn as class_name
      FROM students s LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [student_id]);
    if (!student) return res.status(404).json({ ok: false, error: 'Student not found' });

    const exam = await db.get(`SELECT * FROM exams WHERE id = ?`, [exam_id]);
    if (!exam) return res.status(404).json({ ok: false, error: 'Exam not found' });

    const result = await db.get(`SELECT * FROM results WHERE student_id = ? AND exam_id = ?`, [student_id, exam_id]);
    if (!result) return res.status(404).json({ ok: false, error: 'Result not found' });

    // Subject-wise marks
    const marks = await db.all(`
      SELECT m.obtained_marks, sd.name_en, sd.name_bn, sd.full_marks, sd.pass_marks
      FROM exam_marks m
      JOIN subject_definitions sd ON m.subject_id = sd.id
      WHERE m.student_id = ? AND m.exam_id = ?
      ORDER BY sd.name_en
    `, [student_id, exam_id]).catch(() => []);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="result_card_${student?.student_id_number || student_id}.pdf"`);

    const doc = new PDFDocument({ margin: 30, size: 'A5' });
    doc.pipe(res);

    // Green header
    doc.rect(0, 0, doc.page.width, 65).fill('#059669');
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text(inst.name_en || inst.name_bn, 0, 10, { align: 'center' });
    doc.fontSize(8).font('Helvetica').text(inst.address || '', 0, 30, { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('RESULT CARD', 0, 46, { align: 'center' });

    doc.fillColor('#111827').moveDown(0.3);
    const y0 = 75;

    // Student info box
    doc.rect(30, y0, doc.page.width - 60, 55).fill('#F0FDF4').stroke('#D1FAE5');
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
    doc.text(`Name: ${student.full_name_en || student.full_name_bn}`, 38, y0 + 6);
    doc.text(`Student ID: ${student.student_id_number}`, 38, y0 + 20);
    doc.font('Helvetica');
    doc.text(`Class: ${student.class_name || '—'}`, 38, y0 + 34);
    doc.text(`Exam: ${exam.name_en || exam.name_bn}`, 200, y0 + 6);
    doc.text(`Year: ${exam.academic_year || '—'}`, 200, y0 + 20);
    doc.text(`Date: ${exam.start_date || '—'}`, 200, y0 + 34);

    let y = y0 + 65;

    // Marks table
    if (marks.length > 0) {
      doc.rect(30, y, doc.page.width - 60, 18).fill('#D1FAE5');
      doc.fillColor('#065F46').fontSize(8).font('Helvetica-Bold');
      doc.text('Subject', 34, y + 5, { width: 150 });
      doc.text('Full', 185, y + 5, { width: 40 });
      doc.text('Pass', 225, y + 5, { width: 40 });
      doc.text('Obtained', 265, y + 5, { width: 50 });
      doc.text('Result', 315, y + 5, { width: 40 });
      y += 18;

      marks.forEach((m: any, i: number) => {
        const bg = i % 2 === 0 ? '#F9FAFB' : 'white';
        const pass = m.obtained_marks >= m.pass_marks;
        doc.rect(30, y, doc.page.width - 60, 16).fill(bg);
        doc.fillColor(pass ? '#111827' : '#DC2626').fontSize(8).font('Helvetica');
        doc.text(m.name_en || m.name_bn, 34, y + 4, { width: 150 });
        doc.text(String(m.full_marks || 100), 185, y + 4, { width: 40 });
        doc.text(String(m.pass_marks || 33), 225, y + 4, { width: 40 });
        doc.text(String(m.obtained_marks), 265, y + 4, { width: 50 });
        doc.text(pass ? 'P' : 'F', 315, y + 4, { width: 40 });
        y += 16;
      });
      y += 8;
    }

    // Summary box
    const passColor = result.is_pass ? '#059669' : '#DC2626';
    doc.rect(30, y, doc.page.width - 60, 50).fill(result.is_pass ? '#F0FDF4' : '#FEF2F2').stroke(passColor);
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
    doc.text(`Total: ${result.total_marks ?? '—'}`, 38, y + 8);
    doc.text(`Percent: ${result.percent != null ? Number(result.percent).toFixed(1) + '%' : '—'}`, 38, y + 24);
    doc.text(`Grade: ${result.grade || '—'}`, 200, y + 8);
    doc.text(`GPA: ${result.gpa != null ? Number(result.gpa).toFixed(2) : '—'}`, 200, y + 24);
    doc.fillColor(passColor).fontSize(12).font('Helvetica-Bold')
      .text(result.is_pass ? '✓ PASS' : '✗ FAIL', 0, y + 16, { align: 'center', width: doc.page.width });

    if (result.merit_position) {
      doc.fillColor('#111827').fontSize(8).font('Helvetica')
        .text(`Merit Position: ${result.merit_position}`, 0, y + 36, { align: 'center' });
    }
    y += 60;

    // Signature line
    doc.moveTo(40, y + 20).lineTo(160, y + 20).stroke('#9CA3AF');
    doc.moveTo(doc.page.width - 160, y + 20).lineTo(doc.page.width - 40, y + 20).stroke('#9CA3AF');
    doc.fillColor('#6B7280').fontSize(7).font('Helvetica');
    doc.text("Class Teacher's Signature", 40, y + 24, { width: 120 });
    doc.text("Principal's Signature", doc.page.width - 160, y + 24, { width: 120 });
    doc.text(`Printed: ${new Date().toLocaleDateString('en-BD')}`, 0, y + 40, { align: 'center' });

    doc.end();
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/v1/pdf/fee-receipt/:invoice_id ─────────────────────────────────
router.get('/fee-receipt/:invoice_id', authenticate, async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const inst = await getInstitution();

    const invoice = await db.get(`
      SELECT i.*, s.full_name_bn, s.full_name_en, s.student_id_number, c.name_bn as class_name
      FROM fee_invoices i
      JOIN students s ON i.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE i.id = ?
    `, [invoice_id]);

    if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${invoice.invoice_number || invoice_id}.pdf"`);

    // A5 receipt
    const doc = new PDFDocument({ margin: 30, size: 'A5' });
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 60).fill('#059669');
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
      .text(inst.name_en || inst.name_bn, 0, 8, { align: 'center' });
    doc.fontSize(8).font('Helvetica').text(inst.address || '', 0, 26, { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('FEE RECEIPT / ফি রশিদ', 0, 42, { align: 'center' });

    doc.fillColor('#111827').moveDown(0.5);

    const y0 = 70;
    // Invoice info
    doc.rect(30, y0, doc.page.width - 60, 45).fill('#F0FDF4').stroke('#D1FAE5');
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
    doc.text(`Receipt No: ${invoice.invoice_number || invoice_id.slice(0, 8)}`, 38, y0 + 6);
    doc.text(`Date: ${new Date().toLocaleDateString('en-BD')}`, 200, y0 + 6);
    doc.font('Helvetica');
    doc.text(`Student: ${invoice.full_name_en || invoice.full_name_bn}`, 38, y0 + 20);
    doc.text(`ID: ${invoice.student_id_number || '—'}`, 200, y0 + 20);
    doc.text(`Class: ${invoice.class_name || '—'}`, 38, y0 + 34);
    doc.text(`Month: ${invoice.month}/${invoice.year}`, 200, y0 + 34);

    let y = y0 + 55;

    // Fee breakdown
    let feeItems: any[] = [];
    try { feeItems = JSON.parse(invoice.fee_items_json || '[]'); } catch { feeItems = []; }

    if (feeItems.length > 0) {
      doc.rect(30, y, doc.page.width - 60, 18).fill('#D1FAE5');
      doc.fillColor('#065F46').fontSize(8).font('Helvetica-Bold');
      doc.text('Description', 34, y + 5, { width: 200 });
      doc.text('Amount (৳)', 240, y + 5, { width: 90, align: 'right' });
      y += 18;

      feeItems.forEach((item: any, i: number) => {
        doc.rect(30, y, doc.page.width - 60, 16).fill(i % 2 === 0 ? '#F9FAFB' : 'white');
        doc.fillColor('#111827').fontSize(8).font('Helvetica');
        doc.text(item.name || item.label || 'Fee', 34, y + 4, { width: 200 });
        doc.text(String(item.amount || 0), 240, y + 4, { width: 90, align: 'right' });
        y += 16;
      });
      y += 5;
    }

    // Totals
    doc.rect(30, y, doc.page.width - 60, 60).fill('#F9FAFB').stroke('#E5E7EB');
    doc.fillColor('#111827').fontSize(9).font('Helvetica');
    doc.text('Total Amount:', 38, y + 8, { width: 180 });
    doc.text(`৳ ${Number(invoice.total_amount || 0).toFixed(0)}`, 38, y + 8, { align: 'right', width: doc.page.width - 76 });
    if (invoice.discount_amount > 0) {
      doc.text('Discount:', 38, y + 22, { width: 180 });
      doc.text(`- ৳ ${Number(invoice.discount_amount).toFixed(0)}`, 38, y + 22, { align: 'right', width: doc.page.width - 76 });
    }
    doc.text('Paid:', 38, y + 36, { width: 180 });
    doc.text(`৳ ${Number(invoice.paid_amount || 0).toFixed(0)}`, 38, y + 36, { align: 'right', width: doc.page.width - 76 });
    doc.fillColor(Number(invoice.due_amount) > 0 ? '#DC2626' : '#059669').font('Helvetica-Bold').fontSize(10);
    doc.text('Due:', 38, y + 48, { width: 180 });
    doc.text(`৳ ${Number(invoice.due_amount || 0).toFixed(0)}`, 38, y + 48, { align: 'right', width: doc.page.width - 76 });
    y += 70;

    // Status badge
    const statusColor = invoice.status === 'paid' ? '#059669' : invoice.status === 'partial' ? '#D97706' : '#DC2626';
    const statusText = invoice.status === 'paid' ? '✓ PAID' : invoice.status === 'partial' ? 'PARTIAL' : 'UNPAID';
    doc.rect(doc.page.width / 2 - 40, y, 80, 24).fill(statusColor);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(statusText, doc.page.width / 2 - 40, y + 6, { width: 80, align: 'center' });
    y += 35;

    // Signature
    doc.moveTo(40, y + 20).lineTo(160, y + 20).stroke('#9CA3AF');
    doc.fillColor('#6B7280').fontSize(7).font('Helvetica');
    doc.text("Accountant Signature", 40, y + 24, { width: 120 });
    doc.text(`Printed: ${new Date().toLocaleDateString('en-BD')}`, 0, y + 35, { align: 'center' });

    doc.end();
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
