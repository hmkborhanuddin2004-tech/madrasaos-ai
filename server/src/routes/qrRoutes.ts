import { Router } from 'express';
import { generateVerificationQr } from '../utils/qrCodeUtils.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Middleware: Allow unauthenticated image fetching for <img> tags
router.use((req, res, next) => {
  if (req.query.format === 'image' || req.headers.accept?.includes('image/') || req.path.endsWith('.png')) {
    return next();
  }
  return authenticate(req, res, next);
});

router.get('/payment/:paymentId', async (req: any, res) => {
  try {
    const { paymentId } = req.params;
    const tenantId = req.user?.tenantId || 'tenant_1';
    const qrDataUrl = await generateVerificationQr('payment', paymentId, tenantId);
    if (req.query.format === 'image' || req.headers.accept?.includes('image/')) {
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      res.setHeader('Content-Type', 'image/png');
      return res.send(Buffer.from(base64Data, 'base64'));
    }
    res.json({ ok: true, qr: qrDataUrl });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.get('/result/:resultId', async (req: any, res) => {
  try {
    const { resultId } = req.params;
    const tenantId = req.user?.tenantId || 'tenant_1';
    const qrDataUrl = await generateVerificationQr('result', resultId, tenantId);
    if (req.query.format === 'image' || req.headers.accept?.includes('image/')) {
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      res.setHeader('Content-Type', 'image/png');
      return res.send(Buffer.from(base64Data, 'base64'));
    }
    res.json({ ok: true, qr: qrDataUrl });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.get('/student/:studentId', async (req: any, res) => {
  try {
    const { studentId } = req.params;
    const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'tenant_1';
    const qrDataUrl = await generateVerificationQr('student', studentId, tenantId);
    if (req.query.format === 'image' || req.headers.accept?.includes('image/')) {
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      res.setHeader('Content-Type', 'image/png');
      return res.send(Buffer.from(base64Data, 'base64'));
    }
    res.json({ ok: true, qr: qrDataUrl });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.get('/payslip/:payslipId', async (req: any, res) => {
  try {
    const { payslipId } = req.params;
    const tenantId = req.user?.tenantId || 'tenant_1';
    const qrDataUrl = await generateVerificationQr('payslip', payslipId, tenantId);
    res.json({ ok: true, qr: qrDataUrl });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;
