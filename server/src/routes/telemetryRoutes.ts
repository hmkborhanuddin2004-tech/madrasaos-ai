import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { telemetryService } from '../services/telemetryService.js';

const router = Router();

/**
 * GET /api/v1/telemetry
 * Super admin only — zero PII platform health dashboard.
 */
router.get(
  '/',
  authenticate,
  requireRole('super_admin'),
  async (_req: Request, res: Response, next: any) => {
    try {
      const data = await telemetryService.getPlatformTelemetry();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
