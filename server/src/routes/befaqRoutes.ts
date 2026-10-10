import { Router, Response } from 'express';
import { befaqService } from '../services/befaqService.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';

export const befaqRoutes = Router();

// Public or student/guardian certificate verification
befaqRoutes.get('/verify/:rollOrReg', async (req, res, next) => {
  try {
    const result = await befaqService.verifyCertificate(req.params.rollOrReg);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Authenticated endpoints
befaqRoutes.use(authenticate);

// Get list of registered students
befaqRoutes.get('/registrations', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await befaqService.getRegistrations(tenantId, req.query as any);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Register new student for Befaq board
befaqRoutes.post('/registrations', authorize('super_admin', 'madrasa_admin', 'principal', 'teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await befaqService.registerStudent(tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Generate Admit Card
befaqRoutes.get('/admit-card/:id', async (req, res, next) => {
  try {
    const data = await befaqService.getAdmitCard(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Update result & grade
befaqRoutes.put('/registrations/:id/result', authorize('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await befaqService.updateResult(req.params.id as string, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
