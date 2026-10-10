import { Router, Response } from 'express';
import { aiAgentService } from '../services/aiAgentService.js';
import { voiceService } from '../services/voiceService.js';
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
      fullNameBn: req.user!.fullNameBn,
      linkedStudentIds: req.user!.linkedStudentIds,
      assignedClassIds: req.user!.assignedClassIds
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
      fullNameBn: req.user!.fullNameBn,
      linkedStudentIds: req.user!.linkedStudentIds,
      assignedClassIds: req.user!.assignedClassIds
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ai/transcribe-voice
 * Speech-to-text audio transcription via Google Gemini
 */
router.post('/transcribe-voice', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { audioBase64, mimeType } = req.body;
    const clientKey = req.headers['x-gemini-key'] as string | undefined;
    const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'inst_main';

    const result = await voiceService.transcribeAudio(audioBase64, mimeType, tenantId, clientKey);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
