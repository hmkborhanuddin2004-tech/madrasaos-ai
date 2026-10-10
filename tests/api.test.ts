import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

let adminToken: string;
let teacherToken: string;
let guardianToken: string;
let studentToken: string;

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();

  // Login as Admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'muhtamim', password: 'admin123' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.data.token;

  // Login as Teacher
  const teacherRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_rashid', password: 'teacher123' });
  expect(teacherRes.status).toBe(200);
  teacherToken = teacherRes.body.data.token;

  // Login as Guardian
  const guardianRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: '01811111111', password: 'parent123' });
  expect(guardianRes.status).toBe(200);
  guardianToken = guardianRes.body.data.token;

  // Login as Student
  const studentRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_abdullah', password: 'student123' });
  expect(studentRes.status).toBe(200);
  studentToken = studentRes.body.data.token;
});

describe('1. System & Authentication', () => {
  it('GET /health returns status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.product).toBe('MadrasaOS AI');
  });

  it('Rejects login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Enforces tenant isolation: Rejects request with mismatched tenant header', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('X-Tenant-ID', 'foreign_unauthorized_tenant');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('TENANT_MISMATCH');
  });
});

describe('2. Role-Based Access Control (RBAC)', () => {
  it('Allows Madrasa Admin to access financial summary', async () => {
    const res = await request(app)
      .get('/api/v1/finance/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalCollected');
  });

  it('Blocks Teacher from accessing financial summary', async () => {
    const res = await request(app)
      .get('/api/v1/finance/summary')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Blocks Teacher from accessing institution invoice list', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Restricts Guardian to only view linked child profile', async () => {
    // std_001 is linked to guardian_salam
    const ownChildRes = await request(app)
      .get('/api/v1/students/std_001')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(ownChildRes.status).toBe(200);

    // std_005 is NOT linked to guardian_salam
    const foreignChildRes = await request(app)
      .get('/api/v1/students/std_005')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(foreignChildRes.status).toBe(403);
  });

  it('Restricts Student to only view own profile and blocks foreign student profile', async () => {
    // std_001 is linked to student_abdullah
    const ownRes = await request(app)
      .get('/api/v1/students/std_001')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data.full_name_bn).toBe('আব্দুল্লাহ আল-মামুন');

    // std_002 is NOT linked to student_abdullah
    const foreignRes = await request(app)
      .get('/api/v1/students/std_002')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(foreignRes.status).toBe(403);
    expect(foreignRes.body.error.code).toBe('FORBIDDEN');
  });

  it('Restricts Student to only view own invoices', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // All returned invoices must belong to std_001
    for (const inv of res.body.data) {
      expect(inv.student_id).toBe('std_001');
    }
  });

  it('Protects Admissions management: Admin allowed, Teacher blocked', async () => {
    const adminRes = await request(app)
      .get('/api/v1/admissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);

    const teacherRes = await request(app)
      .get('/api/v1/admissions')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherRes.status).toBe(403);
  });
});

describe('3. Students & Student 360', () => {
  it('GET /api/v1/students returns paginated list of students', async () => {
    const res = await request(app)
      .get('/api/v1/students?limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.students.length).toBe(10);
    expect(res.body.data.total).toBeGreaterThanOrEqual(100);
  });

  it('GET /api/v1/students/:id returns complete Student 360 profile with timeline & stats', async () => {
    const res = await request(app)
      .get('/api/v1/students/std_001')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const s = res.body.data;
    expect(s.full_name_bn).toBe('আব্দুল্লাহ আল-মামুন');
    expect(s).toHaveProperty('attendanceStats');
    expect(s).toHaveProperty('timeline');
    expect(Array.isArray(s.timeline)).toBe(true);
  });

  it('POST /api/v1/students creates new student successfully', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullNameBn: 'মুহাম্মদ তাওহীদ হাসান',
        fullNameEn: 'Muhammad Tawhid Hasan',
        dateOfBirth: '2013-04-10',
        classId: 'cls_nahbemir',
        guardianNameBn: 'জনাব রফিকুল ইসলাম',
        guardianPhone: '01799887766',
        isHifzStudent: true,
        monthlyFee: 2200
      });
    expect(res.status).toBe(201);
    expect(res.body.data.full_name_bn).toBe('মুহাম্মদ তাওহীদ হাসান');
  });
});

describe('4. Smart Attendance & Repeated Absences', () => {
  it('GET /api/v1/attendance/summary returns today statistics', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('attendanceRate');
    expect(res.body.data.totalStudents).toBeGreaterThan(0);
  });

  it('GET /api/v1/attendance/repeated-absences flags repeated absent students', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/repeated-absences?days=7&minAbsences=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('5. Hifz Management Workspace', () => {
  it('GET /api/v1/hifz/today returns daily Sabaq workspace', async () => {
    const res = await request(app)
      .get('/api/v1/hifz/today')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalHifzStudents');
    expect(res.body.data.students.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/hifz/record saves daily Sabaq and mistake evaluation', async () => {
    const res = await request(app)
      .post('/api/v1/hifz/record')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'std_001',
        sabaqPara: 5,
        sabaqSurah: 'সূরা আন-নিসা',
        sabaqAyahRange: '১-১৫',
        sabaqPages: 1.0,
        sabaqRating: 'excellent',
        sabqiMistakes: 1,
        manzilMistakes: 0,
        teacherNotes: 'মাশাআল্লাহ খুব সুন্দর তেলাওয়াত হয়েছে'
      });
    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });

  it('GET /api/v1/hifz/student/:id/summary computes Quran memorization percentage', async () => {
    const res = await request(app)
      .get('/api/v1/hifz/student/std_001/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('progressPercentage');
    expect(res.body.data).toHaveProperty('trend');
  });
});

describe('6. Finance & Payment Collection', () => {
  it('POST /api/v1/finance/payments/collect processes fee payment via bKash', async () => {
    const invoicesRes = await request(app)
      .get('/api/v1/finance/invoices?status=overdue')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(invoicesRes.status).toBe(200);
    expect(invoicesRes.body.data.length).toBeGreaterThan(0);

    const targetInvoice = invoicesRes.body.data[0];
    const txnId = `TXN_TEST_BKASH_${Date.now()}`;
    const collectRes = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: targetInvoice.id,
        amount: 500,
        paymentMethod: 'bkash',
        transactionId: txnId
      });
    expect(collectRes.status).toBe(200);
    expect(collectRes.body.data.success).toBe(true);
    expect(collectRes.body.data.amount).toBe(500);

    // Idempotency: Duplicate transactionId must be rejected with 409 DUPLICATE_TRANSACTION
    const duplicateRes = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: targetInvoice.id,
        amount: 500,
        paymentMethod: 'bkash',
        transactionId: txnId
      });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('DUPLICATE_TRANSACTION');

    // Validation: Negative or zero amount must be rejected with 400
    const zeroAmountRes = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: targetInvoice.id,
        amount: 0,
        paymentMethod: 'bkash',
        transactionId: `TXN_TEST_ZERO_${Date.now()}`
      });
    expect(zeroAmountRes.status).toBe(400);

    // Validation: Overpayment exceeding due amount must be rejected with 400
    const overpayRes = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: targetInvoice.id,
        amount: 999999,
        paymentMethod: 'bkash',
        transactionId: `TXN_TEST_OVER_${Date.now()}`
      });
    expect(overpayRes.status).toBe(400);
  });
});

describe('7. AI Agent Grounding & Deterministic Tools', () => {
  it('POST /api/v1/ai/query handles "আজকের অবস্থা বলো" for admin with factual data and actions', async () => {
    const res = await request(app)
      .post('/api/v1/ai/query')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ query: 'আজকের অবস্থা বলো' });
    expect(res.status).toBe(200);
    expect(res.body.data.dataType).toBe('brief');
    expect(res.body.data.summaryBn).toContain('উপস্থিত');
    expect(res.body.data.actions.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/ai/query hides financial metrics from teacher briefing', async () => {
    const res = await request(app)
      .post('/api/v1/ai/query')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ query: 'আজকের অবস্থা বলো' });
    expect(res.status).toBe(200);
    expect(res.body.data.dataType).toBe('brief');
    // Financial collection numbers must not appear in teacher daily briefing
    expect(res.body.data.summaryBn).not.toContain('ফি আদায়');
  });

  it('POST /api/v1/ai/query handles "বকেয়া ফি তালিকা দেখাও" with overdue invoice data', async () => {
    const res = await request(app)
      .post('/api/v1/ai/query')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ query: 'বকেয়া ফি তালিকা দেখাও' });
    expect(res.status).toBe(200);
    expect(res.body.data.dataType).toBe('fees');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('POST /api/v1/ai/query returns personal student summary for student role', async () => {
    const res = await request(app)
      .post('/api/v1/ai/query')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ query: 'আমার উপস্থিতি ও সবক স্ট্যাটাস কেমন?' });
    expect(res.status).toBe(200);
    expect(res.body.data.summaryBn).toContain('আব্দুল্লাহ');
  });
});

describe('8. Advanced Automation Engine & Approvals', () => {
  it('GET /api/v1/automations returns pre-built Madrasa workflow templates', async () => {
    const res = await request(app)
      .get('/api/v1/automations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(20);
  });

  it('POST /api/v1/automations/compile-natural-language compiles Bangla prompt into DAG', async () => {
    const res = await request(app)
      .post('/api/v1/automations/compile-natural-language')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'যে ছাত্র ৩ দিন টানা অনুপস্থিত থাকবে, তার অভিভাবককে মেসেজ পাঠানোর আগে আমাকে দেখাবে।' });
    expect(res.status).toBe(200);
    expect(res.body.data.compiledWorkflow).toHaveProperty('nodes');
    expect(res.body.data.dryRunPreview).toHaveProperty('safetyCheck');
  });

  it('GET & POST /api/v1/automations/approvals decides pending approval and blocks duplicate decisions', async () => {
    const pendingRes = await request(app)
      .get('/api/v1/automations/approvals/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.data.length).toBeGreaterThan(0);

    const targetAppr = pendingRes.body.data[0];
    const decideRes = await request(app)
      .post(`/api/v1/automations/approvals/${targetAppr.id}/decide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'approved', remarks: 'মুহতামিম কর্তৃক অনুমোদিত' });
    expect(decideRes.status).toBe(200);
    expect(decideRes.body.data.success).toBe(true);

    // Duplicate decision must return 409 APPROVAL_ALREADY_DECIDED
    const duplicateRes = await request(app)
      .post(`/api/v1/automations/approvals/${targetAppr.id}/decide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'approved', remarks: 'পুনরায় অনুমোদন চেষ্টা' });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('APPROVAL_ALREADY_DECIDED');
  });
});

describe('9. Public QR Certificate Verification', () => {
  it('POST /api/v1/certificates/generate creates certificate with QR link', async () => {
    const res = await request(app)
      .post('/api/v1/certificates/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'std_001',
        certificateType: 'student_certificate'
      });
    expect(res.status).toBe(201);
    const certNum = res.body.data.certificateNumber;

    // Verify publicly without authentication
    const publicVerifyRes = await request(app)
      .get(`/api/v1/public/verify-certificate/${certNum}`);
    expect(publicVerifyRes.status).toBe(200);
    expect(publicVerifyRes.body.data.isValid).toBe(true);
    expect(publicVerifyRes.body.data.institutionNameBn).toBeTruthy();
  });
});

describe('10. Kitab Progress & Academic Tracking', () => {
  it('GET /api/v1/kitab/classes returns list of academic classes', async () => {
    const res = await request(app)
      .get('/api/v1/kitab/classes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET & POST /api/v1/kitab/progress manages Kitab completion and daily lessons', async () => {
    const listRes = await request(app)
      .get('/api/v1/kitab/progress?classId=cls_kafiya')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const postRes = await request(app)
      .post('/api/v1/kitab/progress')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: 'cls_kafiya',
        kitabName: 'কাফিয়া ও শরহে জামী',
        subjectNameBn: 'আরবি ব্যাকরণ (নাহু)',
        teacherNameBn: 'মাওলানা হারুনুর রশিদ',
        babOrChapter: 'বাবুস সালাত',
        lessonTitle: 'বাবুস সালাত ও তাহারাত অনুচ্ছেদ',
        pagesCompleted: 55,
        totalKitabPages: 220
      });
    expect(postRes.status).toBe(200);
    expect(postRes.body.data.success).toBe(true);
  });
});

describe('11. Admissions Pipeline', () => {
  let createdAdmissionId: string;

  it('POST /api/v1/admissions registers candidate application', async () => {
    const res = await request(app)
      .post('/api/v1/admissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        applicantNameBn: 'মুহাম্মদ হাবিবুর রহমান',
        applicantNameEn: 'Muhammad Habibur Rahman',
        guardianNameBn: 'মাওলানা আতিকুর রহমান',
        guardianPhone: '01712349988',
        targetDepartment: 'qawmi',
        targetClassId: 'cls_nahbemir',
        previousMadrasa: 'মাদ্রাসাতুল মদিনা',
        notes: 'হিফজ সমাপ্তকারী'
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('applicationNumber');
    createdAdmissionId = res.body.data.id;
  });

  it('GET /api/v1/admissions returns applicant list for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((a: any) => a.id === createdAdmissionId)).toBe(true);
  });

  it('PUT /api/v1/admissions/:id/status logs interview score and approves admission', async () => {
    const res = await request(app)
      .put(`/api/v1/admissions/${createdAdmissionId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'approved',
        score: 88,
        notes: 'মৌখিক পরীক্ষায় চমৎকার ফলাফল করেছে।'
      });
    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });
});

describe('12. Madrasa Library', () => {
  it('GET /api/v1/library returns catalog of kitabs', async () => {
    const res = await request(app)
      .get('/api/v1/library')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/library registers a new kitab into the catalog', async () => {
    const res = await request(app)
      .post('/api/v1/library')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        titleBn: 'আল-ফিকহুল আকবার',
        titleAr: 'الفقه الأكبر',
        author: 'ইমাম আবু হানিফা (রহ.)',
        category: 'আকাইদ ও কালাম',
        isbn: '978-984-01-0988-1',
        totalCopies: 10
      });
    expect(res.status).toBe(201);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });
});
