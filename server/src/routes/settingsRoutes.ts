import { db } from '../db/db.js';
import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { settingsService } from '../services/settingsService.js';

export const router = Router();

// ==================== Primary Settings Endpoints ====================

/**
 * GET /api/v1/settings/public or /branding
 * Open or authenticated branding configuration
 */
router.get('/public', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || req.user?.tenantId || 'inst_main';
    const branding = await settingsService.getPublicSettings(tenantId);
    return res.json({ success: true, data: branding });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/branding', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || req.user?.tenantId || 'inst_main';
    const branding = await settingsService.getPublicSettings(tenantId);
    return res.json({ success: true, data: branding });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/settings
 * Full institution settings (madrasa_admin & super_admin only)
 */
router.get(
  '/',
  authenticate,
  requireRole('madrasa_admin', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const data = await settingsService.getSettings(tenantId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
);

/**
 * PUT /api/v1/settings
 * Update institution settings (madrasa_admin & super_admin only)
 */
router.put(
  '/',
  authenticate,
  requireRole('madrasa_admin', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const updated = await settingsService.updateSettings(tenantId, req.body);
      return res.json({
        success: true,
        message: 'মাদ্রাসার সেটিংস সফলভাবে আপডেট হয়েছে।',
        data: updated
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

/**
 * POST /api/v1/settings/logo-upload
 * Upload madrasa logo image (supports base64 data URI or raw base64, saves to /uploads/logos)
 */
router.post(
  '/logo-upload',
  authenticate,
  requireRole('madrasa_admin', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const { image, filename } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: { message: 'ছবি বা লোগো ডেটা আবশ্যক (image is required)।' }
        });
      }

      let base64Data = image;
      let extension = 'png';

      const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        extension = match[1] === 'jpeg' ? 'jpg' : match[1];
        base64Data = match[2];
      } else if (filename && filename.includes('.')) {
        extension = filename.split('.').pop() || 'png';
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
      await fs.promises.mkdir(uploadsDir, { recursive: true });

      const safeFilename = `logo_${tenantId}_${Date.now()}.${extension}`;
      const filePath = path.join(uploadsDir, safeFilename);

      await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));

      const publicUrl = `/uploads/logos/${safeFilename}`;

      // Update institution_settings and institutions
      await settingsService.updateSettings(tenantId, { logoUrl: publicUrl });

      return res.status(201).json({
        success: true,
        message: 'লোগো সফলভাবে আপলোড হয়েছে।',
        data: {
          logoUrl: publicUrl
        }
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

// ==================== Fee Categories Endpoints ====================

router.get('/fee-categories', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const categories = await settingsService.listFeeCategories(tenantId);
    return res.json({ success: true, data: categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post(
  '/fee-categories',
  authenticate,
  requireRole('madrasa_admin', 'accountant', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const created = await settingsService.createFeeCategory(tenantId, req.body);
      return res.status(201).json({
        success: true,
        message: 'ফি ক্যাটাগরি সফলভাবে তৈরি করা হয়েছে।',
        data: created
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.put(
  '/fee-categories/:id',
  authenticate,
  requireRole('madrasa_admin', 'accountant', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const updated = await settingsService.updateFeeCategory(tenantId, String(req.params.id), req.body);
      return res.json({
        success: true,
        message: 'ফি ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে।',
        data: updated
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.delete(
  '/fee-categories/:id',
  authenticate,
  requireRole('madrasa_admin', 'accountant', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const deleted = await settingsService.deleteFeeCategory(tenantId, String(req.params.id));
      return res.json({
        success: true,
        message: 'ফি ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।',
        data: { deleted }
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

// ==================== Class Definitions Endpoints ====================

router.get('/classes', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const classes = await settingsService.listClassDefinitions(tenantId);
    return res.json({ success: true, data: classes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post(
  '/classes',
  authenticate,
  requireRole('madrasa_admin', 'principal', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const created = await settingsService.createClassDefinition(tenantId, req.body);
      return res.status(201).json({
        success: true,
        message: 'ক্লাস/জামাত সফলভাবে তৈরি করা হয়েছে।',
        data: created
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.put(
  '/classes/:id',
  authenticate,
  requireRole('madrasa_admin', 'principal', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const updated = await settingsService.updateClassDefinition(tenantId, String(req.params.id), req.body);
      return res.json({
        success: true,
        message: 'ক্লাস/জামাত সফলভাবে আপডেট করা হয়েছে।',
        data: updated
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.delete(
  '/classes/:id',
  authenticate,
  requireRole('madrasa_admin', 'principal', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const deleted = await settingsService.deleteClassDefinition(tenantId, String(req.params.id));
      return res.json({
        success: true,
        message: 'ক্লাস/জামাত সফলভাবে মুছে ফেলা হয়েছে।',
        data: { deleted }
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

// ==================== Subject Definitions Endpoints ====================

router.get('/subjects', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const subjects = await settingsService.listSubjectDefinitions(tenantId);
    return res.json({ success: true, data: subjects });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post(
  '/subjects',
  authenticate,
  requireRole('madrasa_admin', 'principal', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const created = await settingsService.createSubjectDefinition(tenantId, req.body);
      return res.status(201).json({
        success: true,
        message: 'পাঠ্য বিষয় সফলভাবে তৈরি করা হয়েছে।',
        data: created
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.put(
  '/subjects/:id',
  authenticate,
  requireRole('madrasa_admin', 'principal', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const updated = await settingsService.updateSubjectDefinition(tenantId, String(req.params.id), req.body);
      return res.json({
        success: true,
        message: 'পাঠ্য বিষয় সফলভাবে আপডেট করা হয়েছে।',
        data: updated
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.delete(
  '/subjects/:id',
  authenticate,
  requireRole('madrasa_admin', 'principal', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const deleted = await settingsService.deleteSubjectDefinition(tenantId, String(req.params.id));
      return res.json({
        success: true,
        message: 'পাঠ্য বিষয় সফলভাবে মুছে ফেলা হয়েছে।',
        data: { deleted }
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

// ==================== Department Endpoints ====================

router.get('/departments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const departments = await settingsService.getDepartments(tenantId);
    return res.json({ success: true, data: departments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post(
  '/departments',
  authenticate,
  requireRole('madrasa_admin', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const { name } = req.body;
      const departments = await settingsService.addDepartment(tenantId, name);
      return res.status(201).json({
        success: true,
        message: 'বিভাগ সফলভাবে যোগ করা হয়েছে।',
        data: departments
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

router.delete(
  '/departments/:name',
  authenticate,
  requireRole('madrasa_admin', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const departments = await settingsService.deleteDepartment(tenantId, String(req.params.name));
      return res.json({
        success: true,
        message: 'বিভাগ সফলভাবে মুছে ফেলা হয়েছে।',
        data: departments
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);

// ==================== Designation Labels Endpoints ====================

router.get('/designations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const labels = await settingsService.getDesignations(tenantId);
    return res.json({ success: true, data: labels });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put(
  '/designations',
  authenticate,
  requireRole('madrasa_admin', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const labels = req.body.labels || req.body;
      const updated = await settingsService.updateDesignations(tenantId, labels);
      return res.json({
        success: true,
        message: 'পদবি লেবেল সফলভাবে আপডেট করা হয়েছে।',
        data: updated
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
);


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
    const id = `policy_${Date.now()}`;
    await db.run(
      `INSERT INTO grading_policies (id, name, is_active, pass_rule, min_subjects_to_pass, overall_pass_percent, core_subjects, default_pass_marks, subject_pass_marks, grade_table, merit_by, tie_breaker, on_fail, created_by, approved_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
    const id = `policy_${Date.now()}`;
    await db.run(
      `INSERT INTO grading_policies (id, name, is_active, pass_rule, min_subjects_to_pass, overall_pass_percent, core_subjects, default_pass_marks, subject_pass_marks, grade_table, merit_by, tie_breaker, on_fail, created_by, approved_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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

// Hifz Alert Settings
router.get('/hifz-alerts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await settingsService.getHifzAlertSettings(tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/hifz-alerts', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'hifz_teacher'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await settingsService.updateHifzAlertSettings(tenantId, req.body);
    res.json({ success: true, data, message: 'হিফজ সতর্কতা কনফিগারেশন সংরক্ষিত হয়েছে।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Semester / Term Settings
router.get('/semesters', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await settingsService.getSemesterSettings(tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/semesters', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await settingsService.updateSemesterSettings(tenantId, req.body);
    res.json({ success: true, data, message: 'শিক্ষাবর্ষের টার্ম/সেমিস্টার কনফিগারেশন সংরক্ষিত হয়েছে।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
