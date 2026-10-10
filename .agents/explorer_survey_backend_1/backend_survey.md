# Backend Architecture & Codebase Survey Report: MadrasaOS AI v3.0

**Surveyor:** teamwork_preview_explorer (Backend Surveyor)  
**Date:** 2026-09-20  
**Target Repository:** `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai`  
**Execution Environment:** Node.js (ES Module `"type": "module"`), Windows, TypeScript 5+ / 7+  

---

## 1. Executive Summary

A comprehensive architectural and code-level investigation of the MadrasaOS AI v3.0 backend was conducted. The project has a clean, well-structured Express 5 backend with SQLite3 persistence, structured TypeScript domain types, JWT-based RBAC with multi-tenancy, and functional controllers for core madrasa operations (Student 360, attendance POS, Hifz workspace, Kitab progress, basic fee collections, and admissions). 

However, there are major functional gaps against the v3.0 requirements defined in `ORIGINAL_REQUEST.md`, primarily around:
1. **R1 Finance:** Lack of residential vs non-residential invoice/ledger segregation; total absence of teacher/staff payroll models and disbursement lifecycle; total absence of donor registry, donation recording, and ring-fenced fund accounting (Lillah/Zakat vs General vs Waqf); lack of daily Cash Book and bank ledger tracking.
2. **R2 Notifications & Automation:** Absence of external messaging adapters (SMS Gateway with Bengali unicode & balance tracking, WhatsApp Cloud API, Facebook Messenger Webhooks, Brevo/SMTP Email); lack of pre-built event trigger listeners (consecutive absence, fee reminder on 10th, instant notice broadcast, Hifz stagnation, monthly payroll generation on 1st); lack of the >50 recipient threshold check for human-in-the-loop approval.
3. **R4 AI Assistant:** Grounded queries are functioning for attendance, general fees, Hifz, and hostel, but payroll and donor tools/guardrails are absent.
4. **R5 Telemetry:** Super Admin telemetry dashboard endpoint aggregating active institutions, student counts, SQLite db size, and messaging balances without leaking PII is missing.
5. **Test Suite Baseline:** 33 of 34 unit/integration tests pass. 1 test (`POST /api/v1/finance/payments/collect processes fee payment via bKash`) fails because existing SQLite seed data lacks `overdue` invoices due to an early-return check in `seedDatabase()`.

---

## 2. Technology Stack & Dependencies

### 2.1 Runtime & Frameworks
| Layer | Technology | Version | Location / Config |
|---|---|---|---|
| **Server Framework** | Express.js | `^5.2.1` | `package.json:53`, `server/src/app.ts` |
| **Language & Runtime** | TypeScript / Node.js ESM | `NodeNext`, `ES2022` | `package.json:6`, `tsconfig.server.json` |
| **Database Engine** | SQLite 3 | `^6.0.1` (`sqlite3`) | `package.json:58`, `server/src/db/db.ts` |
| **Database File Path** | SQLite on Disk | WAL Mode enabled | `data/madrasaos.sqlite` |
| **Authentication** | JWT + bcryptjs | `jsonwebtoken: ^9.0.3`, `bcryptjs: ^3.0.3` | `server/src/middleware/auth.ts`, `server/src/services/authService.ts` |
| **Test Runner** | Vitest + Supertest | `vitest: ^5.0.1`, `supertest: ^7.2.2` | `package.json:42,47`, `vitest.config.ts`, `tests/api.test.ts` |
| **Client Bundler** | Vite 8 + React 19 + Tailwind v4 | `vite: ^8.3.0`, `react: ^19.3.0` | `package.json:43,46,56` |

### 2.2 Scripts Defined in `package.json`
```json
"scripts": {
  "dev:server": "node --loader ts-node/esm server/src/index.ts",
  "dev:client": "vite",
  "build:client": "vite build",
  "build:server": "tsc -p tsconfig.server.json",
  "build": "npm run build:client && npm run build:server",
  "test": "vitest run",
  "start": "node dist/server/index.js"
}
```
*Verification note:* Both `npm run build:server` and `npm run build:client` compile with zero TypeScript errors or missing imports.

### 2.3 Database Driver & Architecture Details
- **Technology:** Raw SQLite3 with a custom Promise-based wrapper class `DatabaseService` (`server/src/db/db.ts:5-76`).
- **Pragmas:**
  - `PRAGMA foreign_keys = ON;` (`db.ts:16`)
  - `PRAGMA journal_mode = WAL;` (`db.ts:17`)
- **Query Methods:** `db.run(sql, params)`, `db.get<T>(sql, params)`, `db.all<T>(sql, params)`, `db.exec(sql)`, and transaction support `db.transaction(async () => { ... })` (`db.ts:56-66`).
- **Data Dir:** `data/` containing `madrasaos.sqlite`, `madrasaos.sqlite-shm`, and `madrasaos.sqlite-wal`.
- **Schema Management:** DDL executed programmatically on startup via `initializeDatabase()` (`server/src/db/schema.ts`). No migration tool (e.g. Prisma or Drizzle) is used; tables and indexes are created via `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

---

## 3. Server Architecture & Directory Survey

The server codebase is modularly structured in `server/src/`:

```
server/src/
├── app.ts                  # Express application setup, CORS, JSON limit (10MB), health check, error handler
├── index.ts                # Entry point: calls initializeDatabase(), seedDatabase(), app.listen(5000)
├── db/
│   ├── db.ts               # DatabaseService class with sqlite3 wrapper & transaction support
│   ├── schema.ts           # DDL schema definitions (26 tables, 7 indexes)
│   └── seed.ts             # Realistic demo data seeding (Org, Inst, Branches, 100+ Students, Records)
├── middleware/
│   ├── auth.ts             # JWT authentication, AuthenticatedRequest, tenant isolation, requireRole()
│   ├── audit.ts            # Audit logging to audit_logs table
│   └── errorHandler.ts     # Centralized error handler with requestId and Bangla error fallback
├── routes/
│   ├── index.ts            # Master API router mounting 15 sub-routers under /api/v1
│   ├── authRoutes.ts       # POST /login, GET /me, POST /switch-branch
│   ├── studentRoutes.ts    # Student CRUD & Student 360 profile
│   ├── attendanceRoutes.ts # Daily attendance register, summary, repeated absence query
│   ├── hifzRoutes.ts       # Daily Sabaq/Sabqi/Manzil workspace, records, progress summary
│   ├── kitabRoutes.ts      # Kitab lesson logging and class tracking
│   ├── examRoutes.ts       # Exam listing, tabulation sheet, student marksheet
│   ├── financeRoutes.ts    # Summary, invoices, collect payment, expenses
│   ├── hostelRoutes.ts     # Room/bed occupancy status, outpass issuance
│   ├── admissionRoutes.ts  # Application intake, interview status update
│   ├── libraryRoutes.ts    # Book catalog and book addition
│   ├── certificateRoutes.ts# Certificate generation with QR verification URL
│   ├── aiAgentRoutes.ts    # Grounded assistant query and daily brief
│   ├── automationRoutes.ts # Workflow listing, executions, human-in-the-loop approvals, NL compiler
│   ├── onboardingRoutes.ts # Madrasa onboarding state machine
│   └── publicRoutes.ts     # Public certificate verification
├── services/               # Corresponding 13 business logic service classes
└── types/
    └── index.ts            # Master domain TypeScript definitions (428 lines)
```

### 3.1 Middleware & Security Deep-Dive
- **Authentication (`server/src/middleware/auth.ts`):**
  - Uses `jwt.verify` with bearer token.
  - Enforces **strict tenant isolation** (`auth.ts:41-52`): If `X-Tenant-ID` header is passed and differs from token tenant (unless `super_admin`), returns HTTP 403 `TENANT_MISMATCH`.
  - `requireRole(...allowedRoles)` (`auth.ts:67-89`): Blocks unauthorized roles with HTTP 403 `FORBIDDEN`.
- **Audit Logging (`server/src/middleware/audit.ts`):**
  - Inserts entries into `audit_logs` table (`user_id`, `user_role`, `action`, `entity_name`, `entity_id`, `details`, `timestamp`, `ip_address`).
- **Error Handling (`server/src/middleware/errorHandler.ts`):**
  - Traps technical exceptions, attaches `requestId`, outputs localized Bengali user-friendly messages for 500s without leaking stack traces.

---

## 4. Feature Implementation & Gap Analysis vs Requirements (R1–R5)

### 4.1 Requirement R1: Comprehensive Multi-Source Accountant & Financial Management

| Feature | Current State | Implemented Details | Missing / Gaps |
|---|---|---|---|
| **R1.1 Residential vs. Non-Residential Fee Segregation** | **Partially Implemented (Basic)** | `students` table has `is_residential` flag. `fee_invoices` stores JSON `fee_items_json` with monthly tuition and boarding fees. | 1. No `invoice_type` (`residential` vs `non_residential`) or fund tag.<br>2. No segregation of line items (Boarding/Mess খোরাকি, Bed Rent, Laundry, Medical vs Tuition বেতন, Session, Exam, Transport).<br>3. No separate financial ledgers or accounts preventing cross-fund leakage.<br>4. No dual-invoice billing generator for residential students. |
| **R1.2 Asatiza & Staff Payroll** | **Missing** | Only generic `expenses` table with `category: teacher_salary` exists. | 1. No payroll schema (`payroll_records` / `salary_slips`).<br>2. No designation profiles (Muhtamim, Shaykhul Hadith, Senior Muhaddis, Kitab Teachers, Hifz Teachers, Nazir, Cook/Hostel Staff, Security).<br>3. No salary breakdown fields: `base_salary`, `housing_allowance`, `food_allowance`, bonus, `advance_loan_deduction`, `absent_deduction`, `net_payable`.<br>4. No disbursement lifecycle (`draft` → `accountant_verified` → `principal_approved` → `disbursed`).<br>5. No QR-verifiable payslip generation.<br>6. No payroll API endpoints or service. |
| **R1.3 Donations, Grants & Lillah Boarding Collections** | **Missing** | None. | 1. No `donors` table (Name, Org, Category: আজীবন/বার্ষিক/এককালীন/বেনামী, Phone, WhatsApp, Target Fund, Commitment schedule).<br>2. No `donations` table / credit vouchers.<br>3. No fund isolation: Lillah Boarding & Orphan Fund (লিল্লাহ বোর্ডিং ও এতিম তহবিল: যাকাত, ফিতরা, চামড়া, ছদকা), General Operational Fund (সাধারণ তহবিল), Construction & Waqf Fund (ভবন ও মসজিদ ওয়াকফ).<br>3. No immutable credit voucher generation.<br>4. No donor endpoints or service. |
| **R1.4 Cash Book & Bank Ledgers** | **Missing** | Basic expense vouchers in `expenses`. | 1. No daily Cash Book calculation (Opening balance, daily cash collections, expenses, closing balance).<br>2. No bank account ledger or deposit slip tracking.<br>3. No dual-authorization journal vouchers. |
| **R1.5 Payment Idempotency & Validation** | **Implemented** | `financeService.collectPayment` (`financeService.ts:182-194`): rejects duplicate `transactionId` with HTTP 409 `DUPLICATE_TRANSACTION`. Rejects 0 or negative amount and overpayment with HTTP 400. | Fully compliant with acceptance criteria. |

---

### 4.2 Requirement R2: Multi-Channel Notification & Automation Engine

| Feature | Current State | Implemented Details | Missing / Gaps |
|---|---|---|---|
| **R2.1 Channel Adapters** | **Missing** | None. Workflow nodes mention `action:sms` and `action:notification` as config strings. | 1. SMS Gateway Adapter (SSL Wireless, Onnorokom, Greenweb) with Bengali unicode support & balance tracking.<br>2. WhatsApp Cloud API / Provider Adapter.<br>3. Facebook Messenger Adapter.<br>4. Brevo (Sendinblue) / SMTP Email Adapter with daily quota tracking and attachments.<br>5. Unified channel dispatch interface with mock/live mode. |
| **R2.2 Pre-Built Automation Triggers** | **Stubbed (DAG Simulation Only)** | `automationService.ts` has DAG simulation and Natural Language compiler returning static nodes. | The 5 required triggers are not hooked into live backend events:<br>1. *Consecutive Absence Alert* (2+ consecutive days missed → preferred parent channel alert).<br>2. *Automated Fee Reminder* (10th of month for overdue invoices with MFS payment link).<br>3. *Instant Notice Broadcast* (Muhtamim notice broadcast routed to WhatsApp, Messenger, SMS).<br>4. *Hifz Stagnation Warning* (Sabaq incomplete 3+ consecutive days → alert teacher & parent).<br>5. *Monthly Payroll Generation* (1st of month → auto-draft teacher salary slips). |
| **R2.3 Human-in-the-Loop Approval** | **Partially Implemented** | `workflow_approvals` table, `getPendingApprovals`, and `decideApproval` API endpoints work with audit logging. | Mass external notification threshold (>50 recipients) and fee adjustments auto-routing to `pending_approval` state before network dispatch is not enforced in an active dispatch pipeline. |

---

### 4.3 Requirement R3: Core Madrasa Management & Configurable Academic Hierarchy

| Feature | Current State | Implemented Details | Missing / Gaps |
|---|---|---|---|
| **R3.1 Student 360 Profile** | **Implemented** | `studentService.getStudentById` aggregates student demographic data, 30-day attendance rates, recent Hifz records, invoices, hostel room/bed assignment, and chronological timeline. | Needs linkage to the new segregated residential/non-residential invoices once R1 is extended. |
| **R3.2 Fast Daily Attendance POS** | **Implemented** | `attendanceService` handles one-tap mass submission (`submitClassAttendance`), class registers, today's summary, and repeated absence queries (`getRepeatedAbsences`). | Needs direct event dispatch trigger to R2 for consecutive absences. |
| **R3.3 Hifz Workspace** | **Implemented** | `hifzService` provides daily workspace by class/teacher (`getTodayWorkspace`), Sabaq (para/surah/ayah/pages/rating), Sabqi (para/pages/mistakes), Manzil (para/mistakes), teacher notes, upsert handling, and declining alerts. | Needs 30-Para visual matrix calculation helper and stagnation trigger hook. |
| **R3.4 Kitab & Syllabus Progress** | **Implemented** | `kitabService` tracks classes, Kitab chapters/babs, lesson titles, completed pages, total pages, and remarks. | Fully functional. |
| **R3.5 Admissions Pipeline** | **Partially Implemented** | `admissionService` supports online application submission, listing, interview score recording, and status updates (`submitted`, `under_review`, `interview_scheduled`, `approved`, `rejected`, `enrolled`). | 1-click conversion from approved application into active student record with auto student ID generation is not yet implemented. |
| **R3.6 Madrasa Library** | **Partially Implemented** | `libraryService` manages book catalog with Bengali/Arabic titles, authors, categories, ISBNs, and total copies. | Book checkout/loan tracking and returns are not yet modeled or implemented. |

---

### 4.4 Requirement R4: Deterministic AI Operating Assistant

| Feature | Current State | Implemented Details | Missing / Gaps |
|---|---|---|---|
| **R4.1 Grounded AI Tool Execution** | **Implemented** | `aiAgentService.processQuery` parses user queries in Bengali and invokes deterministic backend tools (`getDailyBriefing`, `getAttendance`, `getRepeatedAbsences`, `getFeeSummary`, `getOverdueFees`, `getDecliningHifzStudents`, `getHostelStatus`, `searchStudents`). | Need tools for Payroll and Donor/Fund inquiries (e.g. `getPayrollSummary`, `getDonorSummary`) once R1 is built. |
| **R4.2 Strict Role Isolation** | **Implemented** | `aiAgentService.ts:20-38` enforces strict guardrails: teachers are blocked from fee tools; accountants are blocked from Hifz tools; guardians and students are strictly scoped to their own linked records. | Need to ensure teachers cannot access payroll tools/records of other staff. |
| **R4.3 Bengali System Briefings** | **Implemented** | "আজকের অবস্থা বলো" generates rich Bengali briefing with attendance rate, absences, financial totals (admin only), and actionable UI buttons. | Fully compliant with current data. |

---

### 4.5 Requirement R5: Super Admin Platform Telemetry & Local-First Stack

| Feature | Current State | Implemented Details | Missing / Gaps |
|---|---|---|---|
| **R5.1 Super Admin Telemetry API** | **Missing** | Multi-tenancy structures exist in DB (`organizations`, `institutions`, `branches`, `users`). `/health` returns basic uptime. | Dedicated Super Admin telemetry endpoint (`GET /api/v1/telemetry` or `/api/v1/super-admin/telemetry`) is missing. Must aggregate: total active Madrasas, total enrolled students, SQLite db file size in MB, SMS/WhatsApp credit balance, and system health WITHOUT leaking student PII or private financial records. |
| **R5.2 Local-First Stack** | **Implemented** | Self-contained SQLite3 database with WAL mode and foreign key enforcement. Runs offline without mandatory external cloud services. | Fully compliant. |

---

## 5. Test Suite & Baseline Execution Analysis

When running `npm test` (`vitest run`), 34 tests execute across 12 suites in `tests/api.test.ts`:
- **Passing tests:** 33 / 34
- **Failing tests:** 1 / 34:
  - `tests/api.test.ts > 6. Finance & Payment Collection > POST /api/v1/finance/payments/collect processes fee payment via bKash`
  - **Failure line:** `expect(invoicesRes.body.data.length).toBeGreaterThan(0)` at `tests/api.test.ts:258:42`
  - **Root Cause Analysis:**
    1. In `server/src/db/seed.ts:44-59`, `seedDatabase()` performs an idempotency check:
       ```typescript
       const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1');
       if (existingOrg) {
         ...
         await seedModulesIfEmpty(now);
         return; // Already seeded
       }
       ```
    2. The SQLite database file on disk (`data/madrasaos.sqlite`) already contains rows in `organizations`, so `seedDatabase()` returns early without executing lines 275–306 where invoices are populated.
    3. Querying `SELECT status, count(*) FROM fee_invoices GROUP BY status` on `data/madrasaos.sqlite` revealed:
       - `paid`: 35
       - `partially_paid`: 70
       - `overdue`: 0
    4. The test at line 255 requests `GET /api/v1/finance/invoices?status=overdue`. Because there are 0 overdue invoices in the existing SQLite file, `invoicesRes.body.data` returns empty `[]`, causing the assertion to fail.
    5. **Recommendation for Implementers:** In `seedDatabase()`, either include an update to set overdue status for a subset of invoices when `existingOrg` is present, or add a test fixture helper that ensures at least one overdue invoice exists.

---

## 6. Detailed Schema & Database Findings

The current `server/src/db/schema.ts` has 26 tables:
1. `organizations`
2. `institutions`
3. `branches`
4. `users`
5. `academic_sessions`
6. `classes`
7. `students`
8. `attendance_records`
9. `hifz_records`
10. `kitab_progress`
11. `exams`
12. `exam_marks`
13. `fee_types`
14. `fee_invoices`
15. `fee_payments`
16. `expenses`
17. `hostel_rooms`
18. `hostel_outpasses`
19. `admissions`
20. `library_books`
21. `certificates`
22. `audit_logs`
23. `workflows`
24. `workflow_executions`
25. `workflow_approvals`
26. `onboarding_state`

### Required Additional Tables for R1 & R2:
To satisfy R1, R2, and R5 without breaking existing code, the following tables should be added:
1. **`payroll_records`:**
   - `id TEXT PRIMARY KEY`
   - `tenant_id TEXT NOT NULL`
   - `branch_id TEXT NOT NULL`
   - `user_id TEXT NOT NULL` (references teacher/staff)
   - `month TEXT NOT NULL`, `year INTEGER NOT NULL`
   - `designation TEXT NOT NULL` (Muhtamim, Shaykhul Hadith, Senior Muhaddis, Kitab Teacher, Hifz Teacher, Nazir, Cook/Hostel Staff, Security)
   - `base_salary REAL NOT NULL`, `housing_allowance REAL DEFAULT 0`, `food_allowance REAL DEFAULT 0`, `special_allowance REAL DEFAULT 0`
   - `advance_loan_deduction REAL DEFAULT 0`, `absent_deduction REAL DEFAULT 0`
   - `net_payable REAL NOT NULL`
   - `disbursement_status TEXT DEFAULT 'draft'` (`draft`, `accountant_verified`, `principal_approved`, `disbursed`)
   - `disbursement_method TEXT` (`cash`, `bank`, `bkash`, `nagad`)
   - `disbursed_at TEXT`, `disbursed_by TEXT`
   - `voucher_number TEXT UNIQUE NOT NULL`, `qr_verification_code TEXT`
   - `created_at TEXT NOT NULL`

2. **`donors`:**
   - `id TEXT PRIMARY KEY`
   - `tenant_id TEXT NOT NULL`
   - `donor_name TEXT NOT NULL`, `organization_name TEXT`
   - `category TEXT NOT NULL` (`permanent`, `annual`, `one_time`, `anonymous`)
   - `phone TEXT`, `whatsapp TEXT`, `email TEXT`, `address TEXT`
   - `preferred_fund TEXT NOT NULL` (`lillah_orphan`, `general_operational`, `construction_waqf`)
   - `recurring_commitment_schedule TEXT`
   - `created_at TEXT NOT NULL`

3. **`donations`:**
   - `id TEXT PRIMARY KEY`
   - `tenant_id TEXT NOT NULL`
   - `donor_id TEXT` (nullable for anonymous)
   - `donor_name TEXT NOT NULL`
   - `fund_category TEXT NOT NULL` (`lillah_orphan`, `general_operational`, `construction_waqf`)
   - `amount REAL NOT NULL`
   - `payment_method TEXT NOT NULL` (`cash`, `bank`, `bkash`, `nagad`)
   - `transaction_id TEXT`
   - `receipt_number TEXT UNIQUE NOT NULL`
   - `received_by TEXT NOT NULL`
   - `donation_date TEXT NOT NULL`
   - `is_immutable INTEGER DEFAULT 1`
   - `notes TEXT`

4. **`cash_book_entries` / `cash_book_daily`:**
   - `id TEXT PRIMARY KEY`, `tenant_id TEXT NOT NULL`, `date TEXT NOT NULL`
   - `opening_balance REAL NOT NULL`, `total_cash_in REAL NOT NULL`, `total_cash_out REAL NOT NULL`, `closing_balance REAL NOT NULL`
   - `verified_by TEXT`, `is_closed INTEGER DEFAULT 0`

5. **`notifications` / `notification_logs`:**
   - `id TEXT PRIMARY KEY`, `tenant_id TEXT NOT NULL`
   - `channel TEXT NOT NULL` (`sms`, `whatsapp`, `messenger`, `email`)
   - `recipient_identifier TEXT NOT NULL` (phone, PSID, email)
   - `recipient_name TEXT`, `recipient_role TEXT`
   - `template_name TEXT`, `message_content TEXT NOT NULL`
   - `status TEXT NOT NULL` (`pending_approval`, `queued`, `sent`, `failed`)
   - `requires_approval INTEGER DEFAULT 0`, `approved_by TEXT`, `dispatched_at TEXT`
   - `gateway_reference TEXT`, `cost_credits REAL DEFAULT 1`

---

## 7. Actionable Recommendations for Implementation Phase

1. **Fix Idempotent Test Data in `seedDatabase()`:**
   - In `server/src/db/seed.ts`, update existing invoices in `data/madrasaos.sqlite` so that students `std_007`, `std_014`, etc., have `status = 'overdue'` and `due_amount = total_amount`, unblocking `tests/api.test.ts`.
2. **Implement R1 Finance Enhancements:**
   - Add segregated invoice generation in `financeService.ts` with explicit line items for Residential (খোরাকি/সিট) vs Non-Residential (টিউশন/সেশন).
   - Implement `payrollService.ts` and `payrollRoutes.ts` with designation profiles, allowance/deduction calculations, approval lifecycle, and QR payslip voucher.
   - Implement `donorService.ts` and `donationRoutes.ts` with strict fund isolation (Lillah/Zakat vs General vs Waqf).
   - Implement daily Cash Book calculation in `financeService.ts`.
3. **Implement R2 Notification Adapters & Trigger Engine:**
   - Create `server/src/services/notifications/`:
     - `smsAdapter.ts` (SSL Wireless / Onnorokom / Greenweb Bengali unicode)
     - `whatsappAdapter.ts` (Cloud API template messaging)
     - `messengerAdapter.ts` (Page Webhook integration)
     - `emailAdapter.ts` (Brevo transactional SMTP)
   - Implement live event hooks for the 5 pre-built automation rules (2+ day consecutive absence, 10th-of-month fee reminder, instant notice broadcast, Hifz 3-day stagnation, 1st-of-month payroll draft).
   - Enforce the >50 recipient threshold check routing to `workflow_approvals`.
4. **Implement R5 Super Admin Telemetry Endpoint:**
   - Add `GET /api/v1/telemetry` (guarded by `requireRole('super_admin')`) calculating active Madrasas, total enrolled students, database file size in MB, SMS/WhatsApp credit balances, and system health without PII leakage.
5. **Expand Vitest Test Suite:**
   - Add test suites covering segregated residential invoices, payroll approval lifecycle, donor fund isolation, notification adapter dispatches, and telemetry endpoint.
