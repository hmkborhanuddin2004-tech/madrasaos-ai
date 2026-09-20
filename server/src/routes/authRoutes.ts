import { Router, Response } from 'express';
import { authService } from '../services/authService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'ব্যবহারকারীর নাম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।' }
      });
    }

    const result = await authService.login(identifier, password);
    
    // Log audit for successful login
    const reqWithUser = req as AuthenticatedRequest;
    reqWithUser.user = {
      userId: result.user.id,
      tenantId: result.user.tenantId,
      branchId: result.user.branchId,
      username: result.user.username,
      role: result.user.role,
      fullNameBn: result.user.fullNameBn
    };
    await logAudit(reqWithUser, 'LOGIN_SUCCESS', 'user', result.user.id, `ইউজার ${result.user.username} সফলভাবে লগইন করেছেন।`);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await authService.getMe(req.user!.userId);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

router.post('/switch-branch', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { branchId } = req.body;
    if (!branchId) throw new Error('branchId is required');

    const result = await authService.switchBranch(req.user!.userId, branchId);
    await logAudit(req, 'SWITCH_BRANCH', 'branch', branchId, `ক্যাম্পাস শাখা পরিবর্তন করা হয়েছে: ${result.branch.name_bn}`);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
