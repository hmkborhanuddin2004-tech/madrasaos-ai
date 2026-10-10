import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/check-slug', async (req, res, next) => {
  try {
    const slug = (req.query.slug as string) || '';
    const result = await authService.checkSlugAvailability(slug);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { madrasaName, slug, phone, email, address, adminName, username, password, referralCode, studentCapacity, staffCapacity, planType } = req.body;
    if (!madrasaName || !adminName || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'সকল আবশ্যকীয় তথ্য (মাদ্রাসার নাম, অ্যাডমিনের নাম, ইউজারনেম ও পাসওয়ার্ড) পূরণ করুন।' }
      });
    }

    const result = await authService.registerMadrasa({
      madrasaName,
      slug: slug || username,
      phone: phone || '',
      email: email || '',
      address: address || '',
      adminName,
      username,
      passwordPlain: password,
      referralCode,
      studentCapacity,
      staffCapacity,
      planType
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'মাদ্রাসা সফলভাবে নিবন্ধিত হয়েছে।'
    });
  } catch (err) {
    next(err);
  }
});

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

router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        type: 'https://madrasaos.ai/errors/VALIDATION_ERROR',
        title: 'রিফ্রেশ টোকেন আবশ্যক',
        status: 400,
        code: 'MISSING_TOKEN',
        detail: 'অনুগ্রহ করে ভ্যালিড রিফ্রেশ টোকেন প্রদান করুন।'
      });
    }

    const result = await authService.refreshToken(refreshToken);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await logAudit(req, 'LOGOUT', 'user', req.user!.userId, 'ইউজার সফলভাবে লগআউট করেছেন।');
    res.json({
      success: true,
      message: 'লগআউট সফল হয়েছে।'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/break-glass', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.user!.role !== 'super_admin') {
      return res.status(403).json({
        type: 'https://madrasaos.ai/errors/FORBIDDEN',
        title: 'অনুমতি অস্বীকৃত',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'ব্রেক-গ্লাস জরুরি প্রবেশাধিকার শুধুমাত্র সিস্টেম সুপার এডমিনের জন্য সংরক্ষিত।'
      });
    }

    const { targetTenantId, reason, mfaToken } = req.body;
    if (!targetTenantId) {
      return res.status(400).json({
        type: 'https://madrasaos.ai/errors/VALIDATION_ERROR',
        title: 'প্রতিষ্ঠান আইডি আবশ্যক',
        status: 400,
        code: 'MISSING_TENANT_ID',
        detail: 'টার্গেট প্রতিষ্ঠান আইডি (targetTenantId) আবশ্যক।'
      });
    }

    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const requestId = (req.headers['x-request-id'] as string) || ('req_' + Date.now());

    const result = await authService.breakGlass(
      req.user!.userId,
      targetTenantId,
      reason,
      clientIp,
      requestId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
