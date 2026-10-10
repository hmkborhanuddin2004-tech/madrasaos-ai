import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { verifyQrSignature } from '../server/src/utils/qrCodeUtils.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';
import crypto from 'crypto';

describe('QR Code Generation and Verification', () => {
  let adminToken: string;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    
    adminToken = loginRes.body.data?.token || '';
  });

  it('should verify a valid signature', () => {
    const type = 'result';
    const id = 'RES-123';
    const payload = `${type}:${id}`;
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'madrasa_super_secret_jwt_key_2024').update(payload).digest('hex');
    
    const isValid = verifyQrSignature(type, id, sig);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid signature', () => {
    const type = 'result';
    const id = 'RES-123';
    const isValid = verifyQrSignature(type, id, 'invalid-signature-123');
    expect(isValid).toBe(false);
  });

  it('GET /api/v1/verify?type=payment&id=X&sig=valid_sig returns 200 with payment data', async () => {
    const type = 'payment';
    const id = 'PAY-001';
    const payload = `${type}:${id}`;
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'madrasa_super_secret_jwt_key_2024').update(payload).digest('hex');
    
    const res = await request(app)
      .get(`/api/v1/verify?type=${type}&id=${id}&sig=${sig}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.receiptNo).toBe('PAY-001');
  });

  it('GET /api/v1/verify?type=payment&id=X&sig=invalid_sig returns 400 INVALID_QR', async () => {
    const res = await request(app)
      .get('/api/v1/verify?type=payment&id=PAY-001&sig=invalid_sig');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_QR');
  });

  it('GET /api/v1/qr/payment/:id returns base64 QR image data', async () => {
    const res = await request(app)
      .get('/api/v1/qr/payment/PAY-001')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.qr).toMatch(/^data:image\/png;base64,/);
  });

  it('QR signature is tamper-proof: modifying id or type makes sig invalid', async () => {
    const type = 'payment';
    const id = 'PAY-001';
    const payload = `${type}:${id}`;
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'madrasa_super_secret_jwt_key_2024').update(payload).digest('hex');
    
    // Tamper with ID
    const res1 = await request(app).get(`/api/v1/verify?type=${type}&id=PAY-002&sig=${sig}`);
    expect(res1.status).toBe(400);

    // Tamper with type
    const res2 = await request(app).get(`/api/v1/verify?type=result&id=${id}&sig=${sig}`);
    expect(res2.status).toBe(400);
  });
});
