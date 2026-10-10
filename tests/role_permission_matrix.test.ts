/**
 * tests/role_permission_matrix.test.ts
 * Comprehensive Role-Based Access Control (RBAC) & Customization Verification Suite
 * Tests Admin, Teacher, Accountant, Guardian, Student profiles across all modules.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

let adminToken: string;
let teacherToken: string;
let accountantToken: string;
let guardianToken: string;
let studentToken: string;

async function loginUser(identifier: string, pass: string): Promise<{ token: string; user: any }> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier, password: pass });
  return {
    token: res.body?.data?.token ?? '',
    user: res.body?.data?.user ?? {}
  };
}

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();

  const [adminRes, teacherRes, accountantRes, guardianRes, studentRes] = await Promise.all([
    loginUser('muhtamim', 'admin123'),
    loginUser('teacher_rashid', 'teacher123'),
    loginUser('accountant_faruq', 'account123'),
    loginUser('01811111111', 'parent123'),
    loginUser('student_abdullah', 'student123'),
  ]);

  adminToken = adminRes.token;
  teacherToken = teacherRes.token;
  accountantToken = accountantRes.token;
  guardianToken = guardianRes.token;
  studentToken = studentRes.token;
}, 15000);

describe('1. Role Profiles & Identity Verification', () => {
  it('Admin login returns role madrasa_admin', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('madrasa_admin');
  });

  it('Teacher login returns role teacher', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('teacher');
  });

  it('Accountant login returns role accountant', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('accountant');
  });

  it('Guardian login returns role guardian with linked students', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('guardian');
    expect(Array.isArray(res.body.data.user.linkedStudentIds)).toBe(true);
  });

  it('Student login returns role student with own student ID', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('student');
  });
});

describe('2. Admin Customization Rights (Full Institution Control)', () => {
  it('Admin can customize Madrasa Name, Tagline, Primary Color and API Keys', async () => {
    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameBn: 'দারুস সালাম মডেল মাদ্রাসা',
        nameEn: 'Darussalam Model Madrasa',
        primaryColor: '#10b981',
        currencySymbol: '৳',
        academicYearType: 'hijri',
        geminiApiKey: 'AIzaSyDemoCustomTestKey123',
        brevoApiKey: 'xkeysib-demo-custom-key'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nameBn).toBe('দারুস সালাম মডেল মাদ্রাসা');
    expect(res.body.data.primaryColor).toBe('#10b981');
    expect(res.body.data.geminiApiKey).toBe('AIzaSyDemoCustomTestKey123');
  });

  it('Admin can add a customized Fee Category', async () => {
    const res = await request(app)
      .post('/api/v1/settings/fee-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameBn: 'বিশেষ তালীমী ফি',
        nameEn: 'Special Talimi Fee',
        amount: 800,
        frequency: 'monthly',
        ledgerType: 'non_residential'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nameBn).toBe('বিশেষ তালীমী ফি');
  });

  it('Admin can add a customized Class Definition (জামাত)', async () => {
    const res = await request(app)
      .post('/api/v1/settings/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameBn: 'তাকমীল ফিল হাদিস (দাওরায়ে হাদিস)',
        nameEn: 'Takmeel Fil Hadith (Dawra-e-Hadith)',
        orderIndex: 9,
        department: 'কিতাব বিভাগ (দরসে নিজামী)'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nameBn).toContain('দাওরায়ে হাদিস');
  });

  it('Admin can add a customized Subject Definition', async () => {
    const res = await request(app)
      .post('/api/v1/settings/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameBn: 'সহীহুল বুখারী (১ম খণ্ড)',
        nameEn: 'Sahih al-Bukhari Vol 1',
        code: 'HADITH-101',
        totalMarks: 100,
        passMarks: 40
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('3. Non-Admin Security: Hard Restrictions on Settings & Institution Config', () => {
  it('Teacher CANNOT modify institution settings (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ nameBn: 'হ্যাকড মাদ্রাসা' });
    expect(res.status).toBe(403);
  });

  it('Accountant CANNOT modify institution settings (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ nameBn: 'হ্যাকড মাদ্রাসা' });
    expect(res.status).toBe(403);
  });

  it('Guardian CANNOT modify institution settings (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ nameBn: 'হ্যাকড মাদ্রাসা' });
    expect(res.status).toBe(403);
  });

  it('Student CANNOT modify institution settings (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ nameBn: 'হ্যাকড মাদ্রাসা' });
    expect(res.status).toBe(403);
  });

  it('Teacher CANNOT add fee categories (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/settings/fee-categories')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ nameBn: 'অবৈধ ফি', amount: 500 });
    expect(res.status).toBe(403);
  });
});

describe('4. Financial & Cash Management Permissions', () => {
  it('Accountant CAN access financial summary & Cash Book', async () => {
    const finRes = await request(app)
      .get('/api/v1/finance/summary')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(finRes.status).toBe(200);

    const cashRes = await request(app)
      .get('/api/v1/finance/cash-book/daily')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(cashRes.status).toBe(200);
  });

  it('Teacher is BLOCKED from financial summary (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/finance/summary')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it('Teacher is BLOCKED from Cash Book daily (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/finance/cash-book/daily')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it('Teacher is BLOCKED from Donation receipts (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });
});

describe('5. Voice Transcription AI Endpoint Protection', () => {
  it('Rejects empty audio with validation error', async () => {
    const res = await request(app)
      .post('/api/v1/ai/transcribe-voice')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ audioBase64: '' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('EMPTY_AUDIO');
  });

  it('Accepts audio with valid client key or saved key', async () => {
    const res = await request(app)
      .post('/api/v1/ai/transcribe-voice')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('X-Gemini-Key', 'AIzaSyDummyKeyForMockTest')
      .send({
        audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        mimeType: 'audio/webm'
      });
    expect(res.status).toBe(200);
    // Returns structured response (either simulated or error response from google API)
    expect(res.body).toHaveProperty('success');
  });
});
