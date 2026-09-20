import { Router, Response } from 'express';
import { aiAgentService } from '../services/aiAgentService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.post('/query', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { query } = req.body;
    if (!query) throw new Error('query string is required');

    const result = await aiAgentService.processQuery(query, {
      userId: req.user!.userId,
      tenantId: req.user!.tenantId,
      role: req.user!.role,
      fullNameBn: req.user!.fullNameBn
    });

    await logAudit(req, 'AI_AGENT_QUERY', 'ai_assistant', 'query', `এআই জিজ্ঞাসা: "${query.slice(0, 40)}..."`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/daily-brief', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await aiAgentService.processQuery('আজকের অবস্থা বলো', {
      userId: req.user!.userId,
      tenantId: req.user!.tenantId,
      role: req.user!.role,
      fullNameBn: req.user!.fullNameBn
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
