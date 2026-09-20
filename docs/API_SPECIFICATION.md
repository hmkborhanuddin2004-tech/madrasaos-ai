# MadrasaOS AI - RESTful API Specification & Module Structure

## Standard API Response Envelope
Every API response strictly follows this standardized JSON envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_8f1b2c3d",
    "timestamp": "2026-09-20T12:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1240,
      "totalPages": 50
    }
  }
}
```

On Error:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "আপনার এই তথ্যে প্রবেশ করার অনুমতি নেই।",
    "details": "User role 'teacher' does not hold 'fees:read' permission."
  },
  "meta": {
    "requestId": "req_8f1b2c3d",
    "timestamp": "2026-09-20T12:00:00.000Z"
  }
}
```

---

## 1. Authentication & Tenant Identity
- `POST /api/v1/auth/login` - Authenticate via phone/email and password. Returns JWT + tenant profile + active branch.
- `POST /api/v1/auth/refresh` - Issue new access token using secure refresh token.
- `GET  /api/v1/auth/me` - Retrieve current user profile, active permissions, and assigned classes.
- `POST /api/v1/auth/switch-branch` - Switch active branch context within same tenant.

## 2. Onboarding & Configuration
- `GET  /api/v1/onboarding/state` - Fetch current institutional setup progress and answers.
- `POST /api/v1/onboarding/step` - Submit conversational setup answer (Qawmi, Alia, Hifz, Boarding).
- `POST /api/v1/onboarding/finalize` - Commit configuration, scaffold default classes and fee types.

## 3. Students & Guardians
- `GET  /api/v1/students` - Paginated student list with multi-parameter filtering (class, branch, status, hifz).
- `POST /api/v1/students` - Create new student profile with linked guardian and enrollment.
- `GET  /api/v1/students/:id` - Full student 360 profile (overview, attendance stats, Hifz log, dues).
- `PUT  /api/v1/students/:id` - Update student details (requires `students:update`).
- `DELETE /api/v1/students/:id` - Soft delete student profile with audit entry.
- `GET  /api/v1/students/:id/timeline` - Chronological institutional timeline.

## 4. Smart Attendance
- `GET  /api/v1/attendance/summary` - Today's institutional attendance summary (present, absent, late).
- `GET  /api/v1/attendance/session` - Fetch or initialize attendance register for specific class and date.
- `POST /api/v1/attendance/session` - Submit daily attendance register (supports batch status updates).
- `GET  /api/v1/attendance/repeated-absences` - Fetch list of students with >= N absences in X days.

## 5. Hifz Management
- `GET  /api/v1/hifz/today` - Today's Sabaq entry workspace for teacher's assigned Hifz circle.
- `POST /api/v1/hifz/record` - Submit daily Sabaq, Sabqi, and Manzil record with mistake count.
- `GET  /api/v1/hifz/student/:id/summary` - Comprehensive Quran memorization progress (Para, Surah, Trend).
- `GET  /api/v1/hifz/declining-alerts` - Identify students exhibiting declining retention or increased mistakes.

## 6. Kitab & Academics
- `GET  /api/v1/academics/classes` - List Jamaats and sections.
- `POST /api/v1/academics/classes` - Create new Jamaat.
- `GET  /api/v1/academics/kitab-progress` - View syllabus completion status by Kitab/Subject.
- `POST /api/v1/academics/kitab-progress` - Log taught chapters and lessons.

## 7. Examinations & Results
- `GET  /api/v1/exams` - List academic examinations.
- `POST /api/v1/exams` - Create new examination term.
- `POST /api/v1/exams/:id/marks` - Batch submit student marks for a subject.
- `GET  /api/v1/exams/:id/tabulation` - Class-wide tabulation sheet with grades and positions.
- `GET  /api/v1/exams/:id/student/:studentId` - Individual marksheet with QR verification data.

## 8. Finance, Fees & Payments
- `GET  /api/v1/finance/summary` - Monthly fee billing, collection, dues, and categorized expenses.
- `GET  /api/v1/finance/invoices` - Query fee invoices with status filters (paid, unpaid, overdue).
- `POST /api/v1/finance/invoices/generate` - Batch generate monthly fee invoices for a class or session.
- `POST /api/v1/finance/payments/collect` - Process fee collection (Cash, bKash, Nagad, Rocket).
- `POST /api/v1/finance/expenses` - Record approved institutional expense voucher.

## 9. Hostel & Boarding
- `GET  /api/v1/hostels/status` - Total rooms, beds, occupancy rate, and active residents.
- `POST /api/v1/hostels/allocations` - Assign residential student to building/room/bed.
- `GET  /api/v1/hostels/outpasses` - Query active and pending student out-passes.
- `POST /api/v1/hostels/outpasses` - Issue new out-pass with return time check.

## 10. AI Agent Platform
- `POST /api/v1/ai/query` - Send conversational prompt in Bangla/English. Executes deterministic tools and returns grounded answers + UI cards.
- `GET  /api/v1/ai/daily-brief` - Retrieve AI-compiled Morning / Evening institutional brief.
- `POST /api/v1/ai/compile-workflow` - Translate natural language automation request to workflow graph.

## 11. Automation Engine
- `GET  /api/v1/automations` - List active and paused workflows.
- `POST /api/v1/automations` - Create or update workflow graph.
- `POST /api/v1/automations/:id/trigger` - Manually fire a workflow (with test payload).
- `GET  /api/v1/automations/templates` - Browse 20 pre-built Madrasa automation templates.
- `GET  /api/v1/automations/approvals` - Fetch pending human-in-the-loop approvals.
- `POST /api/v1/automations/approvals/:id/decide` - Approve or reject pending automation action.
- `GET  /api/v1/automations/executions` - Query detailed execution logs and retry states.

## 12. Public & Verification
- `GET  /api/v1/public/verify-certificate/:docId` - Cryptographically verify issued student/Hifz certificate via QR code.
