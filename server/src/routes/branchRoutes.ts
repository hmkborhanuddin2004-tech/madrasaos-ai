import { Router, Response } from 'express';
import { branchService } from '../services/branchService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await branchService.getBranches(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await branchService.createBranch(req.user!.tenantId, req.body);
    await logAudit(req, 'CREATE_BRANCH', 'branch', result.id, `নতুন শাখা ক্যাম্পাস যোগ করা হয়েছে: ${req.body.name_bn}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/stats', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await branchService.getBranchStats(req.user!.tenantId, branchId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
