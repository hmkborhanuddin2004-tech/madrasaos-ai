import { Request, Response, NextFunction } from 'express';
import { db } from '../db/db.js';

export function idempotencyMiddleware(options?: { required?: boolean }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string;

    if (!key) {
      if (options?.required) {
        return res.status(400).json({
          type: 'https://madrasaos.ai/errors/VALIDATION_ERROR',
          title: 'Idempotency-Key Header Missing',
          status: 400,
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          detail: 'This state-changing request requires a valid Idempotency-Key header.'
        });
      }
      return next();
    }

    try {
      const existing = await db.get<any>(
        'SELECT status_code, response_body, created_at FROM idempotency_keys WHERE key = ?',
        [key]
      );

      if (existing) {
        const ageHours = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
        if (ageHours < 24) {
          res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_HIT');
          res.setHeader('Content-Type', 'application/json');
          return res.status(existing.status_code).send(existing.response_body);
        }
      }

      // Intercept response
      const originalSend = res.send.bind(res);
      res.send = (body: any): Response => {
        const statusCode = res.statusCode;
        const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'inst_main';
        const userId = (req as any).user?.userId || 'anonymous';
        const stringBody = typeof body === 'string' ? body : JSON.stringify(body);

        db.run(
          'INSERT OR REPLACE INTO idempotency_keys (key, tenant_id, user_id, status_code, response_body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [key, tenantId, userId, statusCode, stringBody, new Date().toISOString()]
        ).catch((err) => console.error('Failed to save idempotency key:', err));

        return originalSend(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
