import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';
import { db } from '../server/src/db/db.js';

let adminToken: string;
let teacherToken: string;
let studentToken: string;

beforeAll(async () => {
  await initializeDatabase();
  await db.run("DELETE FROM institution_settings WHERE tenant_id = 'inst_main'");
  await seedDatabase();

  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'muhtamim', password: 'admin123' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.data.token;

  const teacherRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_rashid', password: 'teacher123' });
  expect(teacherRes.status).toBe(200);
  teacherToken = teacherRes.body.data.token;

  const studentRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_abdullah', password: 'student123' });
  expect(studentRes.status).toBe(200);
  studentToken = studentRes.body.data.token;
});

describe('Madrasa Customization & Institution Settings Module', () => {
  describe('1. Authentication & RBAC on Settings', () => {
    it('1.1 Denies unauthenticated access to GET /api/v1/settings', async () => {
      const res = await request(app).get('/api/v1/settings');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('1.2 Denies teacher from accessing GET /api/v1/settings (madrasa_admin only)', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('1.3 Denies student from modifying settings via PUT /api/v1/settings', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ nameBn: 'অননুমোদিত মাদ্রাসা' });
      expect(res.status).toBe(403);
    });

    it('1.4 Allows madrasa_admin to fetch full settings and seed defaults', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('settings');
      expect(res.body.data).toHaveProperty('feeCategories');
      expect(res.body.data).toHaveProperty('classDefinitions');
      expect(res.body.data).toHaveProperty('subjectDefinitions');

      const s = res.body.data.settings;
      expect(s.currencySymbol).toBe('৳');
      expect(s.madrasaType).toBe('Qawmi');
      expect(Array.isArray(s.customDepartments)).toBe(true);
      expect(s.customDepartments.length).toBeGreaterThan(0);
      expect(typeof s.designationLabels).toBe('object');
      expect(s.designationLabels).toHaveProperty('muhtamim');
    });
  });

  describe('2. Institution Settings Update via PUT /api/v1/settings', () => {
    it('2.1 Updates all general settings, branding, Brevo API key, SMS ID, and notification toggles', async () => {
      const updates = {
        nameBn: 'জামিয়া ইসলামিয়া দারুল উলূম মডেল মাদ্রাসা',
        nameEn: 'Jamia Islamia Darul Uloom Model Madrasa',
        logoUrl: 'https://example.com/madrasa-logo-custom.png',
        address: 'রোড ৫, সেক্টর ১১, উত্তরা, ঢাকা',
        email: 'info@jamia-model.edu.bd',
        phone: '01799887766',
        establishedYear: 1998,
        madrasaType: 'Mixed',
        tagline: 'দ্বীনি ও আধুনিক শিক্ষার অপূর্ব সমন্বয়',
        primaryColor: '#059669', // Tiya Green
        currencySymbol: '৳',
        academicYearType: 'hijri',
        hijriYearEnabled: true,
        smsSenderId: 'JAMIA_SMS',
        brevoApiKey: 'xkeysib-live-custom-key-998877',
        whatsappEnabled: true,
        messengerEnabled: false,
        emailEnabled: true,
        lateFeeSettings: {
          grace_days: 15,
          amount: 100,
          type: 'fixed',
          description: '১৫ তারিখের পর বিলম্ব ফি ১০০ ৳'
        }
      };

      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nameBn).toBe(updates.nameBn);
      expect(res.body.data.nameEn).toBe(updates.nameEn);
      expect(res.body.data.logoUrl).toBe(updates.logoUrl);
      expect(res.body.data.establishedYear).toBe(1998);
      expect(res.body.data.madrasaType).toBe('Mixed');
      expect(res.body.data.smsSenderId).toBe('JAMIA_SMS');
      expect(res.body.data.brevoApiKey).toBe('xkeysib-live-custom-key-998877');
      expect(res.body.data.messengerEnabled).toBe(false);
      expect(res.body.data.lateFeeSettings.amount).toBe(100);

      // Verify institutions table is synchronized
      const inst = await db.get<any>('SELECT * FROM institutions WHERE id = "inst_main"');
      expect(inst.name_bn).toBe(updates.nameBn);
      expect(inst.address).toBe(updates.address);
    });

    it('2.2 Public branding endpoint returns updated custom name and color', async () => {
      const res = await request(app).get('/api/v1/settings/public');
      expect(res.status).toBe(200);
      expect(res.body.data.nameBn).toBe('জামিয়া ইসলামিয়া দারুল উলূম মডেল মাদ্রাসা');
      expect(res.body.data.primaryColor).toBe('#059669');
      expect(res.body.data.currencySymbol).toBe('৳');
    });
  });

  describe('3. Fee Structure Customization (fee_categories)', () => {
    let createdFeeCatId: string;

    it('3.1 GET /api/v1/settings/fee-categories returns seeded categories', async () => {
      const res = await request(app)
        .get('/api/v1/settings/fee-categories')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((f: any) => f.nameBn.includes('মাসিক বেতন'))).toBe(true);
    });

    it('3.2 POST /api/v1/settings/fee-categories creates a new custom fee category', async () => {
      const res = await request(app)
        .post('/api/v1/settings/fee-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'কম্পিউটার ও আইটি ল্যাব ফি',
          nameEn: 'Computer & IT Lab Fee',
          amount: 350,
          frequency: 'monthly',
          description: 'কম্পিউটার ল্যাব রক্ষণাবেক্ষণ ও ইন্টারনেট খরচ'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.nameBn).toBe('কম্পিউটার ও আইটি ল্যাব ফি');
      expect(res.body.data.amount).toBe(350);
      createdFeeCatId = res.body.data.id;
    });

    it('3.3 PUT /api/v1/settings/fee-categories/:id updates amount and description', async () => {
      const res = await request(app)
        .put(`/api/v1/settings/fee-categories/${createdFeeCatId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 400,
          description: 'আপডেটেড ল্যাব ফি'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(400);
      expect(res.body.data.description).toBe('আপডেটেড ল্যাব ফি');
    });

    it('3.4 DELETE /api/v1/settings/fee-categories/:id removes category', async () => {
      const res = await request(app)
        .delete(`/api/v1/settings/fee-categories/${createdFeeCatId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('4. Class / Jamaat Customization (class_definitions)', () => {
    let createdClassId: string;

    it('4.1 GET /api/v1/settings/classes returns seeded classes', async () => {
      const res = await request(app)
        .get('/api/v1/settings/classes')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((c: any) => c.nameBn.includes('ইবতেদায়ী'))).toBe(true);
    });

    it('4.2 POST /api/v1/settings/classes creates a new custom class', async () => {
      const res = await request(app)
        .post('/api/v1/settings/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'উচ্চতর আরবি ডিপ্লোমা জামাত',
          nameEn: 'Advanced Arabic Diploma Class',
          orderIndex: 12,
          department: 'উচ্চতর গবেষণা বিভাগ'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.nameBn).toBe('উচ্চতর আরবি ডিপ্লোমা জামাত');
      createdClassId = res.body.data.id;
    });

    it('4.3 PUT /api/v1/settings/classes/:id updates class name and order', async () => {
      const res = await request(app)
        .put(`/api/v1/settings/classes/${createdClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'আরবি সাহিত্য ও গবেষণা জামাত',
          orderIndex: 13
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nameBn).toBe('আরবি সাহিত্য ও গবেষণা জামাত');
      expect(res.body.data.orderIndex).toBe(13);
    });

    it('4.4 DELETE /api/v1/settings/classes/:id removes class definition', async () => {
      const res = await request(app)
        .delete(`/api/v1/settings/classes/${createdClassId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('5. Subject Customization (subject_definitions)', () => {
    let createdSubjectId: string;

    it('5.1 GET /api/v1/settings/subjects returns seeded subjects', async () => {
      const res = await request(app)
        .get('/api/v1/settings/subjects')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('5.2 POST /api/v1/settings/subjects creates a new custom subject', async () => {
      const res = await request(app)
        .post('/api/v1/settings/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'ইসলামিক অর্থনীতি ও ব্যাংকিং',
          nameEn: 'Islamic Economics & Banking',
          code: 'ECO-501',
          totalMarks: 100,
          passMarks: 40
        });

      expect(res.status).toBe(201);
      expect(res.body.data.nameBn).toBe('ইসলামিক অর্থনীতি ও ব্যাংকিং');
      createdSubjectId = res.body.data.id;
    });

    it('5.3 PUT /api/v1/settings/subjects/:id updates marks', async () => {
      const res = await request(app)
        .put(`/api/v1/settings/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          passMarks: 45
        });

      expect(res.status).toBe(200);
      expect(res.body.data.passMarks).toBe(45);
    });

    it('5.4 DELETE /api/v1/settings/subjects/:id deletes custom subject', async () => {
      const res = await request(app)
        .delete(`/api/v1/settings/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('6. Department and Designation Customization', () => {
    it('6.1 Adds and deletes custom departments', async () => {
      const addRes = await request(app)
        .post('/api/v1/settings/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'কারিগরি ও ভাষা ইনস্টিটিউট' });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data).toContain('কারিগরি ও ভাষা ইনস্টিটিউট');

      const delRes = await request(app)
        .delete('/api/v1/settings/departments/কারিগরি ও ভাষা ইনস্টিটিউট')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data).not.toContain('কারিগরি ও ভাষা ইনস্টিটিউট');
    });

    it('6.2 Updates custom staff designations dynamically', async () => {
      const updateRes = await request(app)
        .put('/api/v1/settings/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          muhtamim: 'মহাপরিচালক (মুহতামিম)',
          it_officer: 'আইটি কোঅর্ডিনেটর'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.muhtamim).toBe('মহাপরিচালক (মুহতামিম)');
      expect(updateRes.body.data.it_officer).toBe('আইটি কোঅর্ডিনেটর');

      // Verify GET returns updated designations
      const getRes = await request(app)
        .get('/api/v1/settings/designations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.body.data.muhtamim).toBe('মহাপরিচালক (মুহতামিম)');
    });
  });

  describe('7. No Hardcoding Verification across Services', () => {
    it('7.1 Certificate generation uses updated institution name from settings', async () => {
      const certRes = await request(app)
        .post('/api/v1/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: 'std_001',
          certificateType: 'student_certificate'
        });
      expect(certRes.status).toBe(201);
      expect(certRes.body.data.metadata.institutionNameBn).toBe('জামিয়া ইসলামিয়া দারুল উলূম মডেল মাদ্রাসা');
    });

    it('7.2 Payslip retrieval uses updated institution name from settings', async () => {
      const payslipRes = await request(app)
        .get('/api/v1/payroll/vouchers/vch_01/payslip')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(payslipRes.status).toBe(200);
      expect(payslipRes.body.data.institutionNameBn).toBe('জামিয়া ইসলামিয়া দারুল উলূম মডেল মাদ্রাসা');
    });
  });

  describe('8. Logo Upload, Fee Ledger Types & Class Synchronization', () => {
    it('8.1 POST /api/v1/settings/logo-upload uploads logo and updates institution_settings', async () => {
      const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // Unauthorized check
      const denied = await request(app)
        .post('/api/v1/settings/logo-upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ image: sampleBase64, filename: 'logo.png' });
      expect(denied.status).toBe(403);

      // Admin upload
      const uploadRes = await request(app)
        .post('/api/v1/settings/logo-upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ image: sampleBase64, filename: 'logo.png' });

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.data.logoUrl).toMatch(/^\/uploads\/logos\/logo_inst_main_.*\.png$/);

      // Verify public endpoint serves this logo URL
      const pubRes = await request(app).get('/api/v1/settings/public');
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.logoUrl).toBe(uploadRes.body.data.logoUrl);
    });

    it('8.2 Fee Category supports explicit ledgerType for residential isolation', async () => {
      const catRes = await request(app)
        .post('/api/v1/settings/fee-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'হোস্টেল ও খাবার মেস ফি',
          nameEn: 'Hostel & Food Mess Fee',
          amount: 3000,
          frequency: 'monthly',
          ledgerType: 'residential',
          description: 'মাসিক তিন বেলা খানা ও ছাত্রাবাস রক্ষণাবেক্ষণ'
        });

      expect(catRes.status).toBe(201);
      expect(catRes.body.data.ledgerType).toBe('residential');

      // Verify database row
      const dbRow = await db.get<any>(
        'SELECT ledger_type FROM fee_categories WHERE id = ?',
        [catRes.body.data.id]
      );
      expect(dbRow.ledger_type).toBe('residential');

      // Clean up
      await request(app)
        .delete(`/api/v1/settings/fee-categories/${catRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('8.3 Synchronizes class_definitions with classes table across CRUD operations', async () => {
      // 1. Create class definition
      const createRes = await request(app)
        .post('/api/v1/settings/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'তাকমীলুল উলূম (দাওরা)',
          nameEn: 'Takmilul Uloom Dawrah',
          orderIndex: 25,
          department: 'কিতাব বিভাগ'
        });

      expect(createRes.status).toBe(201);
      const classDefId = createRes.body.data.id;

      // Verify row in classes table exists and matches
      const classRow = await db.get<any>(
        'SELECT * FROM classes WHERE id = ?',
        [classDefId]
      );
      expect(classRow).toBeDefined();
      expect(classRow.name_bn).toBe('তাকমীলুল উলূম (দাওরা)');

      // 2. Update class definition
      const updateRes = await request(app)
        .put(`/api/v1/settings/classes/${classDefId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameBn: 'তাকমীলুল উলূম ও ইফতা গবেষণা',
          orderIndex: 26
        });

      expect(updateRes.status).toBe(200);

      // Verify row in classes table updated
      const updatedClassRow = await db.get<any>(
        'SELECT * FROM classes WHERE id = ?',
        [classDefId]
      );
      expect(updatedClassRow.name_bn).toBe('তাকমীলুল উলূম ও ইফতা গবেষণা');

      // 3. Delete class definition
      const delRes = await request(app)
        .delete(`/api/v1/settings/classes/${classDefId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Verify row in classes table removed
      const deletedClassRow = await db.get<any>(
        'SELECT * FROM classes WHERE id = ?',
        [classDefId]
      );
      expect(deletedClassRow).toBeUndefined();
    });
  });

  afterAll(async () => {
    // Restore default settings
    await db.run("DELETE FROM institution_settings WHERE tenant_id = 'inst_main'");
    await seedDatabase();
  });
});
