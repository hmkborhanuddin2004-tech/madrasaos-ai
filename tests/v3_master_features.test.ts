import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';
import { db } from '../server/src/db/db.js';
import { v4 as uuidv4 } from 'uuid';

let adminToken: string;
let teacherToken: string;
let hifzTeacherToken: string;
let secondHifzTeacherToken: string;
let superAdminToken: string;

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();

  // 1. Login as Muhtamim (Admin)
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'muhtamim', password: 'admin123' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.data.token;

  // 2. Login as Super Admin
  const superAdminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'superadmin', password: 'admin123' });
  expect(superAdminRes.status).toBe(200);
  superAdminToken = superAdminRes.body.data.token;

  // 3. Login as Teacher
  const teacherRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_rashid', password: 'teacher123' });
  expect(teacherRes.status).toBe(200);
  teacherToken = teacherRes.body.data.token;

  // 4. Login as Hifz Teacher (hafez_zubair)
  const hifzRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'hafez_zubair', password: 'hifz123' });
  expect(hifzRes.status).toBe(200);
  hifzTeacherToken = hifzRes.body.data.token;

  // 5. Create a second Hifz Teacher to test cross-teacher conflict
  const bcrypt = await import('bcryptjs');
  const hifzTeacherPassHash = await bcrypt.default.hash('hifz123', 10);
  await db.run(
    `INSERT OR REPLACE INTO users (id, tenant_id, branch_id, username, phone, full_name_bn, full_name_en, role, password_hash, status, created_at)
     VALUES ('usr_hifz_teacher_2', 'inst_main', 'branch_mirpur', 'hafez_tariq', '01799999991', 'হাফেজ তারিকুর রহমান', 'Hafez Tariqur Rahman', 'hifz_teacher', ?, 'active', ?)`,
    [hifzTeacherPassHash, new Date().toISOString()]
  );

  const secondHifzRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'hafez_tariq', password: 'hifz123' });
  expect(secondHifzRes.status).toBe(200);
  secondHifzTeacherToken = secondHifzRes.body.data.token;
});

describe('MadrasaOS AI v3.0 Master Features Suite', () => {

  describe('1. Super Admin Break-Glass Flow', () => {
    it('rejects break-glass request if reason is under 20 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/break-glass')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          targetTenantId: 'inst_main',
          reason: 'Short reason'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BREAK_GLASS_REASON_TOO_SHORT');
    });

    it('successfully initiates break-glass with reason >= 20 chars and returns ephemeral token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/break-glass')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          targetTenantId: 'inst_main',
          reason: 'Emergency database corruption recovery after electricity failure'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('ephemeralToken');
      expect(res.body.data.targetTenantId).toBe('inst_main');
      expect(res.body.data.expiresIn).toBe('15m');

      // Verify audit log entry
      const audit = await db.get<any>(
        "SELECT * FROM audit_logs WHERE action = 'BREAK_GLASS_ACCESS' ORDER BY created_at DESC LIMIT 1"
      );
      expect(audit).toBeDefined();
      expect(audit.tenant_id).toBe('inst_main');
      expect(audit.details).toContain('Emergency database corruption');
    });
  });

  describe('2. Idempotency Support', () => {
    it('returns cached response when identical Idempotency-Key is sent twice', async () => {
      const idempotencyKey = `idemp_${uuidv4()}`;

      // Pick a student
      const student = await db.get<any>('SELECT id FROM students WHERE is_hifz_student = 1 LIMIT 1');

      const payload = {
        studentId: student.id,
        date: '2026-10-15',
        sabaqPara: 5,
        sabaqSurah: 'সূরা আন-নিসা',
        sabaqAyahRange: '১-১৫',
        sabaqPages: 1.5,
        sabaqRating: 'excellent',
        sabkiPara: 4,
        amukhtaParaFrom: 1,
        amukhtaParaTo: 3,
        dourParaFrom: 1,
        dourParaTo: 2,
        teacherNotes: 'আলহামদুলিল্লাহ চমৎকার'
      };

      // First Request
      const firstRes = await request(app)
        .post('/api/v1/hifz/progress')
        .set('Authorization', `Bearer ${hifzTeacherToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.success).toBe(true);

      // Second Request with SAME key
      const secondRes = await request(app)
        .post('/api/v1/hifz/progress')
        .set('Authorization', `Bearer ${hifzTeacherToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(secondRes.status).toBe(200);
      expect(secondRes.headers['x-cache-lookup']).toBe('IDEMPOTENT_HIT');
    });
  });

  describe('3. Hifz Multi-Teacher Conflict & LWW Rules', () => {
    it('enforces Last-Write-Wins (LWW) when same teacher updates existing daily record', async () => {
      const student = await db.get<any>('SELECT id FROM students WHERE is_hifz_student = 1 LIMIT 1');
      const testDate = '2026-10-20';

      // Initial progress submission
      await request(app)
        .post('/api/v1/hifz/progress')
        .set('Authorization', `Bearer ${hifzTeacherToken}`)
        .send({
          studentId: student.id,
          date: testDate,
          sabaqPara: 7,
          sabaqSurah: 'সূরা আল-আনআম',
          sabaqPages: 1.0,
          sabaqRating: 'good'
        });

      // Same teacher submits updated progress on same date -> LWW
      const updateRes = await request(app)
        .post('/api/v1/hifz/progress')
        .set('Authorization', `Bearer ${hifzTeacherToken}`)
        .send({
          studentId: student.id,
          date: testDate,
          sabaqPara: 7,
          sabaqPages: 2.0,
          sabaqRating: 'excellent',
          teacherNotes: 'পরবর্তীতে আরও ১ পৃষ্ঠা শুনিয়েছেন'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.mode).toBe('lww_merged');

      // Verify updated values in DB
      const record = await db.get<any>(
        'SELECT * FROM hifz_records WHERE student_id = ? AND date = ?',
        [student.id, testDate]
      );
      expect(record.sabaq_pages).toBe(2.0);
      expect(record.sabaq_rating).toBe('excellent');
      expect(record.teacher_notes).toContain('পরবর্তীতে');
    });

    it('returns HTTP 409 Conflict when a DIFFERENT teacher submits on the same (student, date)', async () => {
      const student = await db.get<any>('SELECT id FROM students WHERE is_hifz_student = 1 LIMIT 1');
      const testDate = '2026-10-22';

      // Teacher A submits
      const resA = await request(app)
        .post('/api/v1/hifz/progress')
        .set('Authorization', `Bearer ${hifzTeacherToken}`)
        .send({
          studentId: student.id,
          date: testDate,
          sabaqPara: 8,
          sabaqPages: 1.0,
          sabaqRating: 'good'
        });
      expect(resA.status).toBe(200);

      // Teacher B submits for SAME student and SAME date -> Conflict!
      const resB = await request(app)
        .post('/api/v1/hifz/progress')
        .set('Authorization', `Bearer ${secondHifzTeacherToken}`)
        .send({
          studentId: student.id,
          date: testDate,
          sabaqPara: 8,
          sabaqPages: 0.5,
          sabaqRating: 'weak',
          sabkiMistakes: 5
        });

      expect(resB.status).toBe(409);
      expect(resB.body.code).toBe('HIFZ_TEACHER_CONFLICT');
      expect(resB.body).toHaveProperty('conflictId');

      // Verify conflict was recorded in hifz_conflicts table
      const conflict = await db.get<any>(
        'SELECT * FROM hifz_conflicts WHERE student_id = ? AND date = ?',
        [student.id, testDate]
      );
      expect(conflict).toBeDefined();
      expect(conflict.teacher_a_payload_json).toContain('good');
      expect(conflict.teacher_b_payload_json).toContain('weak');
    });

    it('allows Head-Teacher to fetch and adjudicate the conflict', async () => {
      // Fetch conflicts
      const listRes = await request(app)
        .get('/api/v1/hifz/conflicts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      const conflictToResolve = listRes.body.data[0];

      // Resolve choosing Teacher A's payload
      const resolveRes = await request(app)
        .post(`/api/v1/hifz/conflicts/${conflictToResolve.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chosenTeacher: 'a',
          notes: 'উস্তাদ জুবায়েরের মূল্যায়ন সঠিক বলে গণ্য হলো'
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.success).toBe(true);

      // Verify conflict is now resolved
      const resolvedConflict = await db.get<any>(
        'SELECT * FROM hifz_conflicts WHERE id = ?',
        [conflictToResolve.id]
      );
      expect(resolvedConflict.resolved_at).not.toBeNull();
      expect(resolvedConflict.resolution_json).toContain('উস্তাদ জুবায়ের');
    });

    it('allows inline editing of student info with audit logging', async () => {
      const student = await db.get<any>('SELECT id, full_name_bn, roll_number FROM students LIMIT 1');

      const res = await request(app)
        .put(`/api/v1/hifz/students/${student.id}/inline-edit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rollNumber: '99',
          reason: 'ভুল রোল নম্বর সংশোধন'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify student updated
      const updated = await db.get<any>('SELECT roll_number FROM students WHERE id = ?', [student.id]);
      expect(updated.roll_number).toBe('99');

      // Verify audit log
      const audit = await db.get<any>(
        "SELECT * FROM audit_logs WHERE action = 'STUDENT_INLINE_EDIT' AND entity_id = ? ORDER BY COALESCE(created_at, timestamp) DESC LIMIT 1",
        [student.id]
      );
      expect(audit).toBeDefined();
      expect(audit.new_values).toContain('99');
    });
  });

  describe('4. Timetable 4-Vector Conflict Detection & Publishing', () => {
    it('detects period time bounds violation (period > 12)', async () => {
      const res = await request(app)
        .post('/api/v1/academic/routine/check-conflict')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: 'cls_nahbemir',
          dayOfWeek: 'শনিবার',
          periodNumber: 15
        });

      expect(res.status).toBe(200);
      expect(res.body.data.hasConflict).toBe(true);
      expect(res.body.data.conflicts.some((c: any) => c.vector === 'time')).toBe(true);
    });

    it('detects class period conflict if class already scheduled', async () => {
      // First create a slot
      await request(app)
        .post('/api/v1/academic/routine/slot')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          class_id: 'cls_nahbemir',
          day_of_week: 'রবিবার',
          period_number: 2,
          start_time: '09:00',
          end_time: '09:45',
          subject_name_bn: 'নাহবেমীর মূল কিতাব',
          teacher_name_bn: 'মাওলানা মাহমুদ',
          room_number: '১০৫'
        });

      // Check conflict for same class, same day, same period
      const res = await request(app)
        .post('/api/v1/academic/routine/check-conflict')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: 'cls_nahbemir',
          dayOfWeek: 'রবিবার',
          periodNumber: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.data.hasConflict).toBe(true);
      expect(res.body.data.conflicts.some((c: any) => c.vector === 'class')).toBe(true);
    });

    it('detects teacher and room conflicts across classes', async () => {
      // Check conflict for a different class but SAME teacher and SAME room
      const res = await request(app)
        .post('/api/v1/academic/routine/check-conflict')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: 'cls_hidayah',
          dayOfWeek: 'রবিবার',
          periodNumber: 2,
          teacherNameBn: 'মাওলানা মাহমুদ',
          roomNumber: '১০৫'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.hasConflict).toBe(true);
      expect(res.body.data.conflicts.some((c: any) => c.vector === 'teacher')).toBe(true);
      expect(res.body.data.conflicts.some((c: any) => c.vector === 'room')).toBe(true);
    });

    it('publishes immutable timetable version approved by Majlis-e-Ilmi', async () => {
      const res = await request(app)
        .post('/api/v1/academic/routine/publish')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('versionId');

      // Verify versions list
      const listRes = await request(app)
        .get('/api/v1/academic/routine/versions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('5. Term/Semester & Hifz Alert Dynamic Configurations', () => {
    it('fetches and updates semester settings (Qawmi 3-term & Alia 4-term)', async () => {
      // GET semesters
      const getRes = await request(app)
        .get('/api/v1/settings/semesters')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data).toHaveProperty('terms');

      // PUT semesters
      const putRes = await request(app)
        .put('/api/v1/settings/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          system: 'qawmi_3_term',
          terms: [
            { id: 'term_1', nameBn: 'ছয়মাহী (১ম সাময়িক)', order: 1, weightage: 30 },
            { id: 'term_2', nameBn: 'নভমাহী (২য় সাময়িক)', order: 2, weightage: 30 },
            { id: 'term_3', nameBn: 'সালানা (বার্ষিক পরীক্ষা)', order: 3, weightage: 40 }
          ]
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.terms[0].nameBn).toContain('ছয়মাহী');
    });

    it('fetches and updates dynamic Hifz alert thresholds', async () => {
      const getRes = await request(app)
        .get('/api/v1/settings/hifz-alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data).toHaveProperty('maxSabkiMistakes');

      const putRes = await request(app)
        .put('/api/v1/settings/hifz-alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maxSabkiMistakes: 4,
          maxAmukhtaMistakes: 5
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.maxSabkiMistakes).toBe(4);
    });
  });

  describe('6. Exam Two-Level State Machine & Re-Evaluation Protection', () => {
    let examId: string;
    let studentId: string;

    beforeAll(async () => {
      examId = `exam_${uuidv4().slice(0, 8)}`;
      await db.run(
        `INSERT INTO exams (id, tenant_id, name_bn, term, academic_year, start_date, end_date, is_published, status)
         VALUES (?, 'inst_main', 'ছয়মাহী পরীক্ষা ২০২৬', 'term_1', '1447-1448', '2026-10-01', '2026-10-10', 0, 'DRAFT')`,
        [examId]
      );

      const st = await db.get<any>('SELECT id FROM students LIMIT 1');
      studentId = st.id;

      // Add student marks for 2 subjects
      await db.run(
        `INSERT INTO exam_marks (id, tenant_id, exam_id, class_id, student_id, subject_name_bn, total_marks, obtained_marks, letter_grade, grade_point, is_absent)
         VALUES (?, 'inst_main', ?, 'cls_nahbemir', ?, 'মিশকাতুল মাসাবীহ', 100, 88, 'A+', 5.0, 0)`,
        [`mk_${uuidv4()}`, examId, studentId]
      );

      await db.run(
        `INSERT INTO exam_marks (id, tenant_id, exam_id, class_id, student_id, subject_name_bn, total_marks, obtained_marks, letter_grade, grade_point, is_absent)
         VALUES (?, 'inst_main', ?, 'cls_nahbemir', ?, 'হেদায়া ৩য় খণ্ড', 100, 75, 'A', 4.0, 0)`,
        [`mk_${uuidv4()}`, examId, studentId]
      );
    });

    it('advances exam through states: DRAFT -> MARKS_OPEN -> MARKS_CLOSED', async () => {
      // Open marks
      const openRes = await request(app)
        .post(`/api/v1/exams/${examId}/open-marks`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(openRes.status).toBe(200);
      expect(openRes.body.data.status).toBe('MARKS_OPEN');

      // Close marks
      const closeRes = await request(app)
        .post(`/api/v1/exams/${examId}/close-marks`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.status).toBe('MARKS_CLOSED');
    });

    it('submits, audits, and handles rejection at the Subject Level', async () => {
      // Teacher submits subject 1
      const sub1 = await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_mishkat/submit`)
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(sub1.status).toBe(200);
      expect(sub1.body.data.status).toBe('SUBMITTED');

      // Auditor audits subject 1
      const aud1 = await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_mishkat/audit`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(aud1.status).toBe(200);
      expect(aud1.body.data.status).toBe('AUDITED');

      // Teacher submits subject 2
      await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_hidaya/submit`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // Auditor rejects subject 2 without reason -> 400
      const rejFail = await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_hidaya/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: '' });
      expect(rejFail.status).toBe(400);

      // Auditor rejects subject 2 with proper reason
      const rejSuccess = await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_hidaya/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'রোল ১২ এর খাতার নম্বর গণনায় অমিল রয়েছে' });
      expect(rejSuccess.status).toBe(200);
      expect(rejSuccess.body.data.status).toBe('REJECTED');

      // Teacher re-submits subject 2
      await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_hidaya/submit`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // Auditor audits subject 2
      await request(app)
        .post(`/api/v1/exams/${examId}/subjects/sub_hidaya/audit`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('progresses exam: AUDIT -> APPROVE -> PUBLISH (computes DENSE_RANK)', async () => {
      // Audit exam
      const auditRes = await request(app)
        .post(`/api/v1/exams/${examId}/audit`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.status).toBe('UNDER_REVIEW');

      // Approve exam
      const appRes = await request(app)
        .post(`/api/v1/exams/${examId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(appRes.status).toBe(200);
      expect(appRes.body.data.status).toBe('APPROVED');

      // Publish exam
      const pubRes = await request(app)
        .post(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('PUBLISHED');

      // Check DENSE_RANK in exam_results table
      const resRow = await db.get<any>(
        'SELECT * FROM exam_results WHERE exam_id = ? AND student_id = ?',
        [examId, studentId]
      );
      expect(resRow).toBeDefined();
      expect(resRow.merit_position).toBe(1);
      expect(resRow.is_locked).toBe(1);
    });

    it('STRICT CONSTRAINT: Blocks unpublish while re-evaluations are pending (HTTP 422)', async () => {
      // 1. Submit re-evaluation request
      const reevalReq = await request(app)
        .post(`/api/v1/exams/${examId}/re-evaluation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId,
          subjectId: 'মিশকাতুল মাসাবীহ',
          reason: '৩ নম্বর প্রশ্নের খাতা পুনঃনিরীক্ষণ চাওয়া হয়েছে'
        });

      expect(reevalReq.status).toBe(201);
      const reevalId = reevalReq.body.data.id;

      // 2. Attempt UNPUBLISH while re-evaluation is in progress -> MUST FAIL with 422
      const unpubBlocked = await request(app)
        .post(`/api/v1/exams/${examId}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unpubBlocked.status).toBe(422);
      expect(unpubBlocked.body.code).toBe('PUBLISH_WHILE_LOCKED');
      expect(unpubBlocked.body.detail).toContain('Cannot unpublish exam while re-evaluation is in progress');

      // 3. Resolve the pending re-evaluation
      const reviewRes = await request(app)
        .put(`/api/v1/exams/re-evaluation/${reevalId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
          newMarks: 92,
          notes: 'নম্বর ৮৮ থেকে বাড়িয়ে ৯২ প্রদান করা হলো'
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.data.status).toBe('RESOLVED');

      // 4. Now attempt UNPUBLISH -> Must SUCCEED!
      const unpubSuccess = await request(app)
        .post(`/api/v1/exams/${examId}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unpubSuccess.status).toBe(200);
      expect(unpubSuccess.body.data.status).toBe('APPROVED');

      // Verify exam is now unpublished
      const examDb = await db.get<any>('SELECT is_published, status FROM exams WHERE id = ?', [examId]);
      expect(examDb.is_published).toBe(0);
      expect(examDb.status).toBe('APPROVED');
    });
  });
});
