import { Router, Request, Response } from 'express';
import { certificateService } from '../services/certificateService.js';

const router = Router();

router.get('/verify-certificate/:certNumber', async (req: Request, res: Response) => {
  try {
    const certNumber = req.params.certNumber as string;
    const result = await certificateService.verifyCertificate(certNumber);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'VERIFICATION_FAILED', message: err.message } });
  }
});

export default router;
