import { Router, Response } from 'express';
import { certificateService } from '../services/certificateService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.post('/generate', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { studentId, certificateType } = req.body;
    if (!studentId || !certificateType) {
      throw new Error('studentId and certificateType are required');
    }

    const result = await certificateService.generateCertificate(
      req.user!.tenantId,
      studentId,
      certificateType,
      req.user!.fullNameBn
    );

    await logAudit(
      req,
      'GENERATE_CERTIFICATE',
      'certificate',
      result.certificateId,
      `ডিজিটাল প্রত্যয়নপত্র প্রস্তুত: সনদ নং ${result.certificateNumber} (ধরন: ${certificateType})`
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
