import { Router, Response } from 'express';
import { admissionService } from '../services/admissionService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status } = req.query;
    const data = await admissionService.getApplications(req.user!.tenantId, status as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await admissionService.submitApplication(req.user!.tenantId, req.body);
    await logAudit(req, 'SUBMIT_ADMISSION', 'admission', result.id, `নতুন ভর্তি আবেদন জমা হয়েছে: ${req.body.applicantNameBn} (${result.applicationNumber})`);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status, score, notes } = req.body;
    const admissionId = req.params.id as string;
    const result = await admissionService.updateStatus(req.user!.tenantId, admissionId, status, score, notes);
    await logAudit(req, 'UPDATE_ADMISSION_STATUS', 'admission', admissionId, `ভর্তি আবেদন স্ট্যাটাস পরিবর্তন: ${status} (নম্বর: ${score || 'N/A'})`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
