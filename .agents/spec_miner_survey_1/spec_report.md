# MadrasaOS AI v3.0 - Comprehensive Specification Report

**Document Version:** 3.0.0-PROD  
**Author:** Specification Miner (`teamwork_preview_spec_miner`)  
**Target Platform:** Production-grade, Local-First, Scalable Digital Operating System for 1,000–2,000 Student Bangladeshi Madrasas  
**Scope:** R1 (Segregated Accounting), R2 (Multi-Channel Automation Engine), R3 (Core Madrasa Management), R4 (Grounded AI Operating Assistant), R5 (Super Admin Platform Telemetry & Local-First Stack), and Acceptance Criteria.

---

## Executive Summary & System Overview

MadrasaOS AI v3.0 is engineered specifically for the complex organizational, financial, and pedagogical realities of Bangladeshi Islamic educational institutions (Qawmi, Alia, Hifz, Boarding, and Hybrid). Unlike standard school management systems, MadrasaOS AI provides:
1. **Segregated Multi-Source Financial Accounting**: Strict fund ring-fencing separating Residential (খোরাকি/সিট) from Non-Residential (টিউশন/সেশন) finances, automated staff payroll with deductions/allowances, donor/zakat fund tracking, and daily cash books.
2. **Multi-Channel Notification & Automation Engine**: Event-driven DAG automation delivering alerts over SMS (Bangla Unicode), WhatsApp Cloud API, Facebook Messenger, and Brevo Email with human-in-the-loop safeguards.
3. **Multi-Model Academic Management**: Poly-hierarchical student identity unifying concurrent enrollments (Qawmi Jamaat + Hifz Circle + Residential Hostel Bed) without record duplication.
4. **Deterministic AI Operating Assistant**: Role-isolated, tool-calling assistant grounded in verified database queries with zero hallucination.
5. **Local-First Architecture & Super Admin Telemetry**: Fast SQLite/PostgreSQL execution with Redis caching, PWA offline resilience, and privacy-preserving multi-tenant metrics.

---

## 1. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Finance | Residential Invoicing | Generates separated billing for boarding charges, meal/mess (মাসিক খোরাকি), room/bed rent, laundry/utilities, and medical aid. | `studentId`, `month`, `year`, `boardingCharge`, `mealCost`, `roomRent`, `utilityCost`, `medicalAid` | `Invoice` object with category `residential`, line items, `totalAmount`, `dueAmount`, `invoiceNumber` | Rejects non-residential students without bed allocation (HTTP 400); invalid amounts rejected | `ORIGINAL_REQUEST.md`, `docs/ARCHITECTURE.md` |
| 2 | R1: Finance | Non-Residential Invoicing | Generates academic billing for tuition fees (মাসিক বেতন), session fees, exam fees, and optional transport charges. | `studentId`, `month`, `year`, `tuitionFee`, `sessionFee`, `examFee`, `transportFee` | `Invoice` object with category `non_residential`, line items, `totalAmount`, `dueAmount` | Duplicate month invoice rejected (HTTP 400); invalid amounts rejected | `ORIGINAL_REQUEST.md`, `docs/DATABASE_ERD.md` |
| 3 | R1: Finance | Segregated Fund Ledgers | Dual-ledger accounting isolating academic general revenues from boarding mess expenses to prevent cross-fund leakage. | `ledgerType` (`residential` vs `non_residential`), `dateRange`, `branchId` | Segregated debit/credit balances, revenue vs expense summaries | Unauthorized cross-fund transfer blocked without explicit dual-signed journal voucher | `ORIGINAL_REQUEST.md` § R1.1 |
| 4 | R1: Finance | Staff Payroll Profiles | Designation-based salary configuration for Muhtamim, Shaykhul Hadith, Senior Muhaddis, Kitab Teachers, Hifz Teachers, Nazir/Staff, Cooks, Security. | `staffId`, `designation`, `baseSalary`, `housingAllowance`, `foodAllowance`, `bonusAllowance` | `PayrollProfile` record with computed gross salary | Missing mandatory `baseSalary` or invalid designation rejected (HTTP 400) | `ORIGINAL_REQUEST.md` § R1.2 |
| 5 | R1: Finance | Monthly Payroll Generation | Auto-calculates monthly payslips with base salary, allowances, advance loan deductions, and unexcused absence deductions. | `month`, `year`, `staffId` (optional batch for tenant) | `PayrollVoucher` records (`draft` status) with `netPayable = gross - deductions` | Negative net payable flagged for accountant adjustment; missing attendance handled gracefully | `ORIGINAL_REQUEST.md` § R1.2, R2.2 |
| 6 | R1: Finance | Payroll Voucher Lifecycle | Multi-step approval workflow: Draft Voucher → Accountant Verification → Principal/Muhtamim Approval → Disbursement. | `voucherId`, `action` (`verify`, `approve`, `disburse`), `paymentMethod`, `transactionRef` | Updated voucher status (`verified`, `approved`, `disbursed`), disbursement timestamp, digital signature | Premature disbursement without Muhtamim approval rejected (HTTP 403 / 400) | `ORIGINAL_REQUEST.md` § R1.2 |
| 7 | R1: Finance | Downloadable Payslip with QR | Generates digital PDF payslip voucher with verifiable QR code linking to cryptographic validation endpoint. | `voucherId` | PDF byte stream or download URL containing QR code, salary breakdown, and digital signatures | Voucher not found returns HTTP 404; unapproved voucher cannot generate finalized slip | `ORIGINAL_REQUEST.md` § R1.2 |
| 8 | R1: Finance | Lillah & Orphan Fund Isolation | Shariah-compliant ring-fenced fund exclusively for poor/orphan residential students (Zakat, Fitra, Qurbani skins, Sadaqah). | `donationType`, `amount`, `donorId`, `receiptNumber`, `isAnonymous`, `inKindDetails` | `DonationReceipt` voucher credited strictly to `lillah_orphan` ledger | Expenditures for non-destitute purposes or general salaries blocked (HTTP 400) | `ORIGINAL_REQUEST.md` § R1.3 |
| 9 | R1: Finance | General Operational & Waqf Funds | Segregated funds for General Operations (repairs, utilities, gifts) and Construction/Mosque Waqf endowments. | `fundCategory` (`general_operational`, `construction_waqf`), `amount`, `donorId`, `purpose` | Immutable credit voucher with assigned fund ledger sequence | Invalid fund category rejected | `ORIGINAL_REQUEST.md` § R1.3 |
| 10 | R1: Finance | Donor Registry & Pledges | Registry tracking Permanent Donors (আজীবন দাতা), Annual Donors, One-time donors, Anonymous donors, WhatsApp/Phone, and recurring commitments. | `donorName`, `orgName`, `category`, `contactPhone`, `targetFund`, `pledgeSchedule`, `pledgeAmount` | `Donor` profile with lifetime contribution counter and active pledge schedule | Duplicate phone per tenant flagged; invalid schedule rejected | `ORIGINAL_REQUEST.md` § R1.3 |
| 11 | R1: Finance | Daily Automated Cash Book | Daily automated cash journal (দৈনিক ক্যাশ বই) computing opening balance, cash receipts, cash expenses, bank deposits, and closing cash. | `date`, `tenantId`, `branchId` | `CashBookDailySummary` object (opening, receipts, expenses, bank deposits, closing) | Negative closing balance triggers financial reconciliation warning; unclosed prior day handled | `ORIGINAL_REQUEST.md` § R1.4 |
| 12 | R1: Finance | Bank Ledgers & Deposit Slips | Tracking institutional bank accounts, cash deposits from counter collections, bank transfers, and deposit slip image attachments. | `bankAccountId`, `depositAmount`, `slipNumber`, `slipImage`, `date`, `authorizedBy` | `BankTransaction` record, credit to bank account, debit to cash in hand | Deposit amount exceeding physical cash in hand rejected (HTTP 400) | `ORIGINAL_REQUEST.md` § R1.4 |
| 13 | R1: Finance | Dual-Authorization Journal Vouchers | Double-entry journal vouchers requiring dual authorization (Accountant prepared + Muhtamim approved) before committing to general ledger. | `debitAccountId`, `creditAccountId`, `amount`, `narration`, `voucherNumber` | Pending journal voucher awaiting approval; committed entry upon second signature | Unbalanced debit != credit rejected (HTTP 400); unauthorized role rejected (HTTP 403) | `ORIGINAL_REQUEST.md` § R1.4 |
| 14 | R1: Finance | Payment Idempotency & Conflict Guard | Prevents duplicate digital payment submissions across bKash, Nagad, Rocket, and Bank transfers. | `invoiceId`, `amount`, `paymentMethod`, `transactionId` | Confirmed `Payment` receipt and updated invoice due amount | Identical `transactionId` for same tenant returns HTTP 409 `DUPLICATE_TRANSACTION` | `ORIGINAL_REQUEST.md` § Acceptance Criteria |
| 15 | R2: Automation | SMS Gateway Adapter | Bangladesh telco aggregator connector (SSL Wireless, Onnorokom, Greenweb) with Bengali Unicode support and balance polling. | `recipientPhone`, `unicodeMessage`, `smsType` (`text` / `unicode`), `maskingName` | Delivery dispatch status, provider message ID, remaining SMS balance | Insufficient SMS credits triggers admin alert; invalid BD phone format rejected (HTTP 400) | `ORIGINAL_REQUEST.md` § R2.1 |
| 16 | R2: Automation | WhatsApp Cloud API Adapter | Meta WhatsApp Business API connector handling session messages and pre-approved HSM templates (attendance, Sabaq cards, fee reminders). | `recipientPhone`, `templateName`, `templateVariables`, `headerMediaUrl` | Message dispatch status, WhatsApp message ID, delivery ack | 24hr customer service window expiry triggers automatic fallback to approved HSM template | `ORIGINAL_REQUEST.md` § R2.1 |
| 17 | R2: Automation | FB Messenger Adapter | Page-scoped Webhook connector delivering official notices, fee receipts, and marksheet PDFs to connected guardian accounts. | `guardianPsid`, `messageText`, `attachmentUrl`, `quickReplies` | Delivery ack, Facebook message ID | Disconnected or blocked PSID marked; automatic fallback to SMS | `ORIGINAL_REQUEST.md` § R2.1 |
| 18 | R2: Automation | Brevo / SMTP Email Adapter | Transactional email delivery with daily quota management (e.g. 300/day tier) and dynamic PDF attachment injection. | `toEmail`, `subject`, `htmlBody`, `attachmentPdfBuffer`, `templateId` | Dispatch receipt, remaining quota counter | Daily quota exhaustion routes non-critical emails to deferred queue and notifies admin | `ORIGINAL_REQUEST.md` § R2.1 |
| 19 | R2: Automation | Consecutive Absence Trigger | Detects when a student is absent for 2+ consecutive instructional days and triggers multi-channel parent alerts. | Domain event: `attendance.recorded` | Automated notification payload formatted for guardian's preferred channel | Student with approved leave exempted; duplicate alert on same day suppressed | `ORIGINAL_REQUEST.md` § R2.2 |
| 20 | R2: Automation | Automated Fee Reminder Trigger | Scheduled monthly cron job firing on the 10th of every month at 9:00 AM for overdue fee invoices. | Cron trigger: `0 9 10 * *` | Filtered list of delinquent accounts, drafted SMS/WhatsApp reminder with MFS payment link | Invoices with status `paid` or `dueAmount <= 0` excluded | `ORIGINAL_REQUEST.md` § R2.2 |
| 21 | R2: Automation | Instant Notice Broadcast Trigger | Fires when Muhtamim publishes an official notice, formatting and routing across WhatsApp, Messenger, and SMS based on preferences. | Domain event: `notice.published` | Multi-channel broadcast job dispatched or routed to approval queue | If total recipients > 50, transitions to `pending_approval` | `ORIGINAL_REQUEST.md` § R2.2, R2.3 |
| 22 | R2: Automation | Hifz Stagnation Warning Trigger | Evaluates daily Hifz lessons and detects students whose Sabaq is incomplete, weak, or < 0.25 pages for 3+ consecutive days. | Daily evaluation cron / `hifz.recorded` | Early intervention alert sent to Hifz Teacher and Guardian with actionable recommendations | Students on approved leave or exam break excluded | `ORIGINAL_REQUEST.md` § R2.2 |
| 23 | R2: Automation | Monthly Payroll Generation Trigger | Scheduled cron job firing on the 1st of each month at 6:00 AM to automatically draft teacher salary slips. | Cron trigger: `0 6 1 * *` | Batch of `draft` salary vouchers with calculated attendance deductions ready for verification | Already generated vouchers for current month skipped to prevent duplication | `ORIGINAL_REQUEST.md` § R2.2 |
| 24 | R2: Automation | Human-in-the-Loop Approval Gate (>50) | Mandatory safety gate: any broadcast or action targeting >50 recipients requires explicit one-click approval from Admin/Muhtamim. | Workflow execution context, `recipientCount > 50` | `WorkflowApproval` item in pending queue, halts execution until decision | Direct external dispatch without approval blocked; duplicate decisions rejected (HTTP 409) | `ORIGINAL_REQUEST.md` § R2.3 |
| 25 | R3: Core | Student 360 Unified Profile | Multi-program profile unifying Qawmi Jamaat, Hifz Circle, and Hostel Bed without duplicating records. | `studentId` | Comprehensive profile: bio, academic enrollment, Hifz log, attendance stats, dues, hostel bed, timeline | Non-existent student returns HTTP 404; unauthorized role access blocked | `ORIGINAL_REQUEST.md` § R3 |
| 26 | R3: Core | Daily Attendance POS | High-speed mobile/touch attendance register with one-tap "Mark All Present", quick toggles (Absent, Late, Leave), and offline queue. | `classId`, `date`, `records: [{ studentId, status, remarks }]` | Committed attendance session, updated student attendance aggregates | Past locked attendance requires admin override; duplicate session updates existing records | `ORIGINAL_REQUEST.md` § R3, `docs/ARCHITECTURE.md` |
| 27 | R3: Core | Hifz Daily Workspace | Recording Sabaq (Para/Surah/Ayah range/pages/rating), Sabqi (recent 3-5 Paras/mistakes), and Manzil (revision/mistakes). | `studentId`, `date`, `sabaqPara`, `sabaqSurah`, `sabaqPages`, `sabaqRating`, `sabqiPara`, `sabqiMistakes`, `manzilPara`, `manzilMistakes` | Saved `HifzRecord`, updated Quran progress stats, updated 30-Para completion state | Invalid Para (<1 or >30) rejected; negative mistake count rejected | `ORIGINAL_REQUEST.md` § R3 |
| 28 | R3: Core | 30-Para Quran Progress Visualizer | Interactive 30-block grid rendering memorization status, retention percentage, and historical revision mastery per Para. | `studentId` | 30-item array with status (`not_started`, `memorizing`, `completed`, `mastered`), completion percentage | Handles students with non-linear memorization (e.g. starting from Para 30) | `ORIGINAL_REQUEST.md` § R3 |
| 29 | R3: Core | Kitab & Syllabus Progress Tracking | Tracking completion of Dars-e-Nizami text books by Bab/Chapter, daily lesson titles, completed pages, and syllabus percentage. | `classId`, `subjectName`, `kitabName`, `babOrChapter`, `lessonTitle`, `pagesCompleted`, `totalKitabPages` | Saved lesson log, updated completion percentage vs. academic calendar | Completed pages exceeding total pages rejected (HTTP 400) | `ORIGINAL_REQUEST.md` § R3 |
| 30 | R3: Core | Admissions Funnel & 1-Click Enrollment | Intake pipeline from application submission to viva/interview scoring and 1-click automatic student enrollment. | `applicationId`, `interviewScore`, `status` (`approved` / `enrolled`), `targetClassId`, `assignedBedId` (optional) | Enrolled `Student` record, generated student ID number, linked guardian account | Enrolling unapproved applicant rejected; duplicate application flagged | `ORIGINAL_REQUEST.md` § R3 |
| 31 | R3: Core | Madrasa Library & Circulation | Catalog supporting Bangla/Arabic titles, barcode/ISBN lookup, book checkout, return tracking, and overdue fine logging. | `bookId`, `borrowerId` (`student` or `teacher`), `issueDate`, `dueDate`, `returnDate`, `fineAmount` | `LibraryLoan` record, updated available copy counter | Borrowing when available copies = 0 rejected (HTTP 400); non-existent book returns 404 | `ORIGINAL_REQUEST.md` § R3 |
| 32 | R4: AI Agent | Role-Isolated Deterministic Tool Calling | AI assistant executing strictly authenticated backend tools with zero factual hallucination and role boundaries. | `userQuery` in Bangla/English, `userContext` (role, tenantId, permissions) | Structured response (`summaryBn`, `data`, `sources`, actionable UI buttons) | Teachers/Hostel staff asking for financial summaries receive HTTP 403 / permission error | `ORIGINAL_REQUEST.md` § R4 |
| 33 | R4: AI Agent | Conversational Executive Briefing | Natural language briefing for administrators ("আজকের অবস্থা বলো") summarizing attendance, collections, Hifz alerts, and tasks. | Query: "আজকের অবস্থা বলো" | Executive briefing card with today's attendance %, fee collections, overdue counts, Hifz alerts | Hidden from teachers/students; non-financial version delivered to academic heads | `ORIGINAL_REQUEST.md` § R4 |
| 34 | R4: AI Agent | Scoped Guardian & Student Conversational Bot | Conversational bot answering guardian/student queries strictly scoped to linked child records. | Query: "আমার সন্তানের উপস্থিতি ও সবক কেমন?" | Scoped student overview (attendance %, latest Sabaq, fee due amount) | Attempting to query another student returns permission error; zero data leak | `ORIGINAL_REQUEST.md` § R4 |
| 35 | R5: Telemetry | Super Admin Multi-Tenant Dashboard | Platform-level monitoring of total active madrasas, student enrollments, database size, SMS/WhatsApp usage, and system health. | `super_admin` authenticated request | Multi-tenant KPI metrics (active institutions, total students, storage MB, credit usage, uptime) | Non-super admin access rejected with HTTP 403 FORBIDDEN | `ORIGINAL_REQUEST.md` § R5 |
| 36 | R5: Telemetry | Privacy & PII Protection Guard | Anonymizes and aggregates telemetry data to guarantee zero student names, phone numbers, or private vouchers leak to platform dashboard. | Telemetry aggregation pipeline | Anonymized statistical counters and system metrics | Any individual PII or raw transaction payload stripped before serialization | `ORIGINAL_REQUEST.md` § R5 |
| 37 | R5: Telemetry | Local-First Dual Persistence (SQLite/Postgres/Redis) | Architecture supporting seamless operation on local premise server (SQLite) and cloud production (PostgreSQL + Redis). | Database connection configuration string | Unified repository interface with ACID transactions and connection pool | Unsupported dialect or connection loss caught with descriptive error | `ORIGINAL_REQUEST.md` § R5 |

---

## 2. Edge Cases & Boundary Conditions

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---------|-------------------|-----------------------------|
| 1 | Payment Idempotency | Same bKash transaction ID (`BKASH_TRX_9921`) submitted twice in rapid succession for the same tenant. | First request succeeds (200 OK), creates payment `RCP-XXXX`. Second request is detected via unique `transaction_id` constraint and returns HTTP 409 Conflict with code `DUPLICATE_TRANSACTION`. |
| 2 | Payment Overpayment | Student owes ৳1,500 due; payment submission attempts to record ৳2,000 for that invoice. | Request rejected with HTTP 400 Bad Request, code `AMOUNT_EXCEEDS_DUE`. Error message explains payment cannot exceed outstanding balance. |
| 3 | Payment Zero/Negative | Payment submission has `amount: 0` or `amount: -500`. | Request rejected with HTTP 400 Bad Request, code `INVALID_AMOUNT`. Amount must be strictly greater than 0. |
| 4 | Fund Ring-Fencing | Administrator attempts to disburse teacher academic salary from `lillah_orphan_fund`. | Request rejected with HTTP 400 Bad Request, code `INVALID_FUND_DISBURSEMENT`. Shariah compliance rules enforce Lillah funds cannot be allocated to staff salaries or general construction. |
| 5 | Segregated Invoicing | Attempting to bill `meal_cost` (মাসিক খোরাকি) or `room_bed_rent` to a non-residential day scholar (`is_residential: false`). | System validates student residential status; returns HTTP 400 Bad Request `STUDENT_NOT_RESIDENTIAL` unless boarding status is first established. |
| 6 | Payroll Absence Deduction | Staff member has 3 unexcused absences in a 30-day month with base salary ৳15,000. | System calculates daily rate = `15,000 / 30 = 500`. Absence deduction = `3 * 500 = 1,500`. Net payable correctly factors in deduction: `15,000 - 1,500 = 13,500`. |
| 7 | Payroll Advance Over-deduction | Staff member has loan advance deduction of ৳20,000 but gross earnings for the month are only ৳18,000. | System caps deduction at gross payable or flags voucher as `requires_accountant_review` with error code `DEDUCTION_EXCEEDS_GROSS`; net payable cannot be negative. |
| 8 | Multi-Channel Recipient Gate | Muhtamim notice broadcast targets entire institution of 1,240 guardians (>50 recipients). | Workflow execution automatically pauses at `control:approval` node; status set to `waiting_approval`. Zero network packets sent to SMS/WhatsApp gateways until Admin clicks "Approve & Dispatch". |
| 9 | Multi-Channel Channel Fallback | Student marked 2 days absent; guardian has WhatsApp preferred, but phone has no registered WhatsApp account. | WhatsApp adapter receives template delivery failure; automation engine triggers channel fallback to Bangla Unicode SMS adapter. |
| 10 | SMS Unicode Encoding Limit | Notice text contains 180 Bengali Unicode characters. | SMS adapter detects Bengali Unicode (UCS-2); calculates SMS parts = Math.ceil(180 / 67) = 3 SMS units. Tracks 3 credits deducted from tenant balance. |
| 11 | Consecutive Absence Weekend/Holiday | Student absent on Thursday, followed by Friday (official madrasa weekend), and absent on Saturday. | Attendance engine evaluates instructional calendar. Friday is flagged as holiday/weekend and not counted as a missed instructional day. Consecutive instructional missed days = 2 (Thursday + Saturday). Trigger fires. |
| 12 | Hifz Stagnation Detection | Student attends class but records 0 Sabaq pages for 3 consecutive days, or receives 'weak' rating with 0 new ayahs. | Hifz stagnation engine flags student with status `stagnant`; generates early intervention notification to Hifz teacher and guardian. |
| 13 | Hifz Non-Linear Memorization | Student memorizes Para 30 (Ampara) first, then Para 1, then Para 2. | 30-Para visual grid correctly illuminates Para 30 as completed and Para 1 as in-progress, rather than assuming sequential 1→30 order. |
| 14 | Cross-Tenant Data Leak Guard | User authenticated for Tenant A sends HTTP header `X-Tenant-ID: tenant_b`. | Middleware intercepts mismatched tenant claim in JWT; immediately terminates request with HTTP 403 Forbidden and logs security audit event `TENANT_MISMATCH`. |
| 15 | Guardian Child Isolation | Guardian A (linked to `std_001`) requests `/api/v1/students/std_005` or queries AI assistant about `std_005`. | Both REST endpoint and AI Agent check guardian's linked student IDs; request is rejected with HTTP 403 Forbidden `CHILD_NOT_LINKED`. |
| 16 | Teacher Financial Data Block | Teacher requests `/api/v1/finance/summary` or `/api/v1/finance/invoices` or asks AI "মাদ্রাসার মোট আয় কত?". | Backend routes and AI tool runner verify role `teacher`; return HTTP 403 Forbidden `FORBIDDEN`. AI responds in polite Bangla stating financial records are restricted. |
| 17 | Super Admin PII Protection | Super Admin queries `/api/v1/telemetry/overview`. | System executes aggregation queries returning institution count, student count, storage size, and credit usage. Personal names, phone numbers, and payment vouchers are strictly omitted. |
| 18 | Cash Book Negative Balance | Accountant records cash expense of ৳10,000 when physical cash in hand is only ৳4,000. | System rejects expense entry with HTTP 400 `INSUFFICIENT_CASH_BALANCE` or creates an unverified voucher flagged with reconciliation warning. |
| 19 | Library Overdue Checkout | Student attempts to borrow a book while already having 2 overdue books past 14 days. | Library service checks borrower active overdue count; blocks checkout with HTTP 400 `OVERDUE_BOOKS_OUTSTANDING`. |
| 20 | Dual-Decision Approval Attempt | Two administrators view the same approval card for a broadcast and click "Approve" simultaneously. | Database transaction utilizes atomic state update (`UPDATE ... WHERE status = 'pending'`). First request succeeds (200 OK); second request receives HTTP 409 `APPROVAL_ALREADY_DECIDED`. |

---

## 3. Detailed Architectural & Technical Specifications

### 3.1 R1: Segregated Accounting Specification

#### 3.1.1 Database Schema Extensions (DDL)

```sql
-- 1. Segregated Invoices and Ledgers
ALTER TABLE fee_invoices ADD COLUMN ledger_type TEXT DEFAULT 'non_residential'; -- 'residential' | 'non_residential'
ALTER TABLE fee_invoices ADD COLUMN fee_category TEXT DEFAULT 'academic'; -- 'academic' | 'hostel_boarding'

-- 2. Asatiza & Staff Payroll
CREATE TABLE IF NOT EXISTS staff_payroll_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  staff_user_id TEXT NOT NULL,
  designation TEXT NOT NULL, -- 'muhtamim', 'shaykhul_hadith', 'senior_muhaddis', 'kitab_teacher', 'hifz_teacher', 'nazir_office_staff', 'cook_hostel_staff', 'security_guard'
  base_salary REAL NOT NULL,
  housing_allowance REAL DEFAULT 0,
  food_allowance REAL DEFAULT 0,
  bonus_allowance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES institutions(id),
  FOREIGN KEY (staff_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payroll_vouchers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  voucher_number TEXT UNIQUE NOT NULL, -- e.g. PAY-202609-001
  staff_user_id TEXT NOT NULL,
  month TEXT NOT NULL, -- e.g. '2026-09'
  year INTEGER NOT NULL,
  designation TEXT NOT NULL,
  base_salary REAL NOT NULL,
  housing_allowance REAL DEFAULT 0,
  food_allowance REAL DEFAULT 0,
  bonus_allowance REAL DEFAULT 0,
  advance_loan_deduction REAL DEFAULT 0,
  unexcused_absent_days INTEGER DEFAULT 0,
  absent_deduction REAL DEFAULT 0,
  gross_payable REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_payable REAL NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'accountant_verified', 'muhtamim_approved', 'disbursed'
  payment_method TEXT, -- 'cash', 'bank', 'bkash', 'nagad'
  disbursement_reference TEXT,
  disbursed_at TEXT,
  verified_by_user_id TEXT,
  approved_by_user_id TEXT,
  qr_verification_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES institutions(id),
  FOREIGN KEY (staff_user_id) REFERENCES users(id)
);

-- 3. Donors and Fund Collections
CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  organization_name TEXT,
  category TEXT NOT NULL, -- 'permanent' (আজীবন), 'annual' (বাৎসরিক), 'one_time', 'anonymous'
  phone_primary TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  recurring_schedule TEXT DEFAULT 'none', -- 'none', 'monthly', 'annual', 'ramadan_only'
  pledge_amount REAL DEFAULT 0,
  total_contributed REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS donation_receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL, -- e.g. DON-202609-001
  donor_id TEXT, -- NULL for anonymous
  fund_category TEXT NOT NULL, -- 'lillah_orphan', 'general_operational', 'construction_waqf'
  donation_type TEXT NOT NULL, -- 'zakat', 'fitra', 'qurbani_skin', 'sadaqah', 'general_gift', 'waqf'
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'bank', 'bkash', 'nagad', 'in_kind'
  in_kind_details TEXT,
  collected_by_user_id TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (tenant_id) REFERENCES institutions(id),
  FOREIGN KEY (donor_id) REFERENCES donors(id)
);

-- 4. Daily Cash Book & Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  current_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS cash_book_daily (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  opening_cash REAL NOT NULL,
  total_cash_receipts REAL NOT NULL,
  total_cash_expenses REAL NOT NULL,
  total_bank_deposits REAL NOT NULL,
  closing_cash REAL NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'reconciled', 'locked'
  accountant_user_id TEXT NOT NULL,
  muhtamim_user_id TEXT,
  reconciled_at TEXT,
  notes TEXT,
  UNIQUE(tenant_id, branch_id, date),
  FOREIGN KEY (tenant_id) REFERENCES institutions(id)
);
```

#### 3.1.2 REST API Endpoints for R1

1. **`GET /api/v1/finance/segregated-summary`**
   - Query: `?ledgerType=residential|non_residential&month=2026-09`
   - Scopes: `super_admin`, `madrasa_admin`, `accountant`
   - Returns separated income, expenses, and net surplus for hostel vs academic funds.
2. **`POST /api/v1/finance/invoices/generate-segregated`**
   - Payload: `{ classId: string, month: string, year: number, ledgerType: 'residential' | 'non_residential' }`
   - Creates distinct invoices for room/bed/food or tuition/session.
3. **`GET /api/v1/finance/payroll/profiles`**
   - Retrieves staff salary configurations.
4. **`POST /api/v1/finance/payroll/generate-monthly`**
   - Payload: `{ month: string, year: number }`
   - Generates draft payroll vouchers factoring in attendance deductions.
5. **`PUT /api/v1/finance/payroll/vouchers/:id/lifecycle`**
   - Payload: `{ action: 'verify' | 'approve' | 'disburse', paymentMethod?: string, reference?: string }`
   - Enforces approval gates (Accountant verifies, Muhtamim approves, Cashier disburses).
6. **`GET /api/v1/finance/donations` & `POST /api/v1/finance/donations`**
   - Handles donor contributions with ring-fenced fund categories.
7. **`GET /api/v1/finance/cashbook/daily` & `POST /api/v1/finance/cashbook/close`**
   - Manages daily cash register balancing and Muhtamim lock.

---

### 3.2 R2: Multi-Channel Notification & Automation Engine Specification

#### 3.2.1 Multi-Channel Adapter Interface Contract

```typescript
export interface NotificationPayload {
  recipientPhone: string;
  recipientEmail?: string;
  recipientPsid?: string; // Facebook Messenger Page-Scoped ID
  preferredChannel: 'sms' | 'whatsapp' | 'messenger' | 'email';
  titleBn: string;
  messageBn: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
  attachmentPdfBuffer?: Buffer;
  attachmentUrl?: string;
}

export interface ChannelDispatchResult {
  success: boolean;
  channel: 'sms' | 'whatsapp' | 'messenger' | 'email';
  messageId: string;
  creditsUsed?: number;
  error?: string;
  deliveredAt: string;
}

export interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<ChannelDispatchResult>;
  checkBalance?(): Promise<{ creditsRemaining: number; unit: string }>;
}
```

#### 3.2.2 Five Pre-Built Automation Rule Implementations

```json
[
  {
    "id": "trigger_rule_01",
    "name": "টানা ২ দিন অনুপস্থিতি সতর্কতা (Consecutive Absence Alert)",
    "trigger": { "type": "event", "event": "attendance.recorded" },
    "nodes": [
      {
        "id": "c1",
        "type": "logic:condition",
        "config": { "field": "consecutive_absent_days", "operator": "GREATER_THAN_OR_EQUAL", "value": 2 }
      },
      {
        "id": "a1",
        "type": "ai:draft_message",
        "config": { "template": "consecutive_absence_bn", "tone": "polite_islamic" }
      },
      {
        "id": "d1",
        "type": "action:multi_channel_dispatch",
        "config": { "channels": ["whatsapp", "messenger", "sms"], "fallbackToSms": true }
      }
    ]
  },
  {
    "id": "trigger_rule_02",
    "name": "মাসিক বকেয়া ফি স্মরণিকা (10th of Month Overdue Reminder)",
    "trigger": { "type": "schedule", "cron": "0 9 10 * *" },
    "nodes": [
      {
        "id": "f1",
        "type": "logic:filter",
        "config": { "entity": "fee_invoices", "status": "unpaid", "dueGreaterThan": 0 }
      },
      {
        "id": "d1",
        "type": "action:multi_channel_dispatch",
        "config": { "includeMfsPaymentLink": true }
      }
    ]
  },
  {
    "id": "trigger_rule_03",
    "name": "মুহতামিমের জরুরি নোটিশ ব্রডকাস্ট (Instant Notice Broadcast)",
    "trigger": { "type": "event", "event": "notice.published" },
    "nodes": [
      {
        "id": "gate_1",
        "type": "control:approval_if_exceeds",
        "config": { "threshold": 50, "required_role": "madrasa_admin" }
      },
      {
        "id": "d1",
        "type": "action:multi_channel_dispatch",
        "config": { "channels": ["whatsapp", "messenger", "sms"] }
      }
    ]
  },
  {
    "id": "trigger_rule_04",
    "name": "হিফজ সবক স্থবিরতা সতর্কতা (3+ Days Sabaq Stagnation)",
    "trigger": { "type": "schedule", "cron": "0 17 * * *" },
    "nodes": [
      {
        "id": "c1",
        "type": "logic:condition",
        "config": { "metric": "sabaq_incomplete_days", "operator": "GREATER_THAN_OR_EQUAL", "value": 3 }
      },
      {
        "id": "n1",
        "type": "action:notification",
        "config": { "targetRoles": ["hifz_teacher", "guardian"] }
      }
    ]
  },
  {
    "id": "trigger_rule_05",
    "name": "১ তারিখ উস্তাদ ও স্টাফ বেতন প্রস্তুতকরণ (1st of Month Payroll Drafting)",
    "trigger": { "type": "schedule", "cron": "0 6 1 * *" },
    "nodes": [
      {
        "id": "act_payroll",
        "type": "action:generate_draft_payroll",
        "config": { "calculateAbsentDeductions": true }
      },
      {
        "id": "notify_accountant",
        "type": "action:notification",
        "config": { "targetRole": "accountant", "message": "চলতি মাসের শিক্ষক ও কর্মচারীদের খসড়া বেতন তালিকা প্রস্তুত হয়েছে।" }
      }
    ]
  }
]
```

---

### 3.3 R3: Core Madrasa Management Specification

1. **Student 360 Architecture**:
   - `students` table acts as the unified anchor.
   - Joins `classes` (Jamaat), `hifz_records` (Quran progress), `hostel_allocations` (Bed & Room), and `fee_invoices`.
   - Single digital guardian profile connects siblings across Jamaats.
2. **Attendance POS**:
   - Touch-optimized `/attendance/smart-entry` UI.
   - Batch status update API `POST /api/v1/attendance/session`.
   - Auto-aggregates daily percentages for Morning Briefing.
3. **Hifz 3-Pillar Workspace**:
   - Daily record: Sabaq (new memorization), Sabqi (recent 3-5 Paras), Manzil (dawr/revision).
   - 30-Para completion percentage calculator:
     $$\text{Progress \%} = \frac{\sum_{i=1}^{30} \text{Para Completed}_i}{30} \times 100$$
4. **Kitab Syllabus Tracker**:
   - Tracks chapter completion against standard Dars-e-Nizami calendar.
   - Highlights delays exceeding 15% of expected milestones.
5. **Admissions & Library**:
   - Counter/Online application intake with viva grading (0-100) and instant matriculation.
   - Catalog with Arabic/Bangla title search and circulation loan limits.

---

### 3.4 R4: Grounded Deterministic AI Operating Assistant Specification

#### 3.4.1 Security & Role Isolation Matrix for AI Tools

| AI Tool Name | Permitted Roles | Prohibited Roles (HTTP 403 / Guardrail) | Grounded Database Source |
|---|---|---|---|
| `getDailyBriefing()` | `super_admin`, `madrasa_admin`, `principal`, `teacher` (non-fin only) | `guardian`, `student` | `attendance_records`, `fee_invoices`, `hifz_records`, `hostel_rooms` |
| `getFeeSummary()` | `super_admin`, `madrasa_admin`, `accountant` | `teacher`, `hifz_teacher`, `hostel_manager`, `guardian`, `student` | `fee_invoices`, `fee_payments` |
| `getPayrollSummary()` | `super_admin`, `madrasa_admin`, `accountant` | `teacher`, `hifz_teacher`, `hostel_manager`, `guardian`, `student` | `payroll_vouchers`, `staff_payroll_profiles` |
| `getDonationSummary()`| `super_admin`, `madrasa_admin`, `accountant` | `teacher`, `hifz_teacher`, `hostel_manager`, `guardian`, `student` | `donation_receipts`, `donors` |
| `getHifzProgress()` | `super_admin`, `madrasa_admin`, `principal`, `hifz_teacher`, `guardian` (own child) | `accountant`, `librarian` | `hifz_records`, `students` |
| `getStudentOwnProfile()`| `student` (own only), `guardian` (linked child only) | Foreign students | `students`, `attendance_records`, `fee_invoices` |

#### 3.4.2 Conversational Flow Logic

1. User sends natural language query in Bangla (e.g. *"আজকের অবস্থা বলো"*).
2. Intent classifier extracts required tool: `getDailyBriefing`.
3. Guardrail checks caller's `role`. If `teacher`, strips financial metrics. If `guardian`, reroutes to `getStudentOwnProfile`.
4. Executes deterministic DB queries inside the authenticated tenant context.
5. Synthesizes human-friendly response with structured KPI cards and contextual action buttons (`[হাজিরা বিস্তারিত]`, `[বকেয়া ফি তালিকা]`).

---

### 3.5 R5: Super Admin Platform Telemetry & Local-First Stack Specification

1. **Local-First Architecture**:
   - Default backend runs on local SQLite (`data/madrasaos.sqlite`) with WAL mode enabled (`PRAGMA journal_mode = WAL;`) for high concurrency.
   - PostgreSQL adapter ready for scalable cloud deployments.
   - Redis adapter for job queue and session state.
2. **Super Admin Telemetry API (`GET /api/v1/telemetry/overview`)**:
   - Metrics returned:
     - `totalActiveInstitutions`: count of active madrasas.
     - `totalEnrolledStudents`: aggregated student count across all tenants.
     - `databaseSizeBytes`: file size of SQLite DB or PostgreSQL table volume.
     - `totalSmsDispatched` & `totalWhatsAppDispatched`: aggregate credit usage.
     - `systemUptimeSeconds`: server process uptime.
     - `memoryUsageMb`: Node.js RSS memory.
3. **PII Protection Guard**:
   - Super Admin dashboard has zero access to individual student records, guardian phone numbers, or private vouchers.
   - Queries execute `COUNT(*)`, `SUM(amount)`, `AVG(rate)` only.

---

## 4. Acceptance Criteria & Test Verification Matrix

| Category | Requirement | Verification Command / Method | Expected Output / Pass Criteria |
|---|---|---|---|
| **R1: Accounting** | Segregated Residential vs Non-Residential Invoices | `POST /api/v1/finance/invoices/generate-segregated` | Invoices tagged with distinct `ledger_type` and separate itemized fees. |
| **R1: Accounting** | Staff Payroll Generation & Lifecycle | `POST /api/v1/finance/payroll/generate-monthly`, `PUT .../lifecycle` | Detailed payslips with base salary, allowances, absent deduction, net payable, and approval states. |
| **R1: Accounting** | Ring-Fenced Donors & Funds | `POST /api/v1/finance/donations` | Immutable receipts assigned strictly to `lillah_orphan`, `general_operational`, or `construction_waqf`. |
| **R1: Accounting** | Payment Idempotency | `POST /api/v1/finance/payments/collect` (twice with same `transactionId`) | First call returns 200 OK; second call returns 409 Conflict with code `DUPLICATE_TRANSACTION`. |
| **R2: Automation** | Multi-Channel Dispatch Adapters | Unit tests mocking SMS, WhatsApp, Messenger, and Brevo | Mock adapters receive formatted payloads; Unicode character counts verified. |
| **R2: Automation** | Human Approval Gate (>50 Recipients) | Broadcast test with 51 recipients | Status transitions to `waiting_approval`; network dispatch halted until Admin approval. |
| **R2: Automation** | Consecutive Absence Detection | Mark student absent for 2 consecutive days, check trigger | Flagged student produces drafted alert payload for guardian's preferred channel. |
| **R3: Core** | Student 360 Concurrent Enrollments | Query `GET /api/v1/students/:id` | Returns Jamaat, Hifz status, and Hostel bed concurrently without record duplication. |
| **R3: Core** | Hifz Workspace & 30-Para Grid | `POST /api/v1/hifz/record`, `GET .../summary` | Sabaq/Sabqi/Manzil saved; 30-Para completion percentage updated. |
| **R4: AI Assistant** | RBAC Isolation on Queries | Query AI as Teacher asking for "মাদ্রাসার আয় কত?" | Returns permission error; zero financial metrics returned to unauthorized roles. |
| **R5: Telemetry** | Super Admin PII Protection | `GET /api/v1/telemetry/overview` | Returns aggregate counts and storage stats without names, phone numbers, or raw vouchers. |
| **Build & Quality**| Vitest Test Suite | `npm test` | 100% tests pass. |
| **Build & Quality**| Production Compilation | `npm run build` | Zero TypeScript errors across client and server. |

---

## 5. Architectural Gap Analysis & Recommended Implementation Plan

Based on the survey of the current codebase (`server/src/db/schema.ts`, `server/src/services/`, `client/src/`):
1. **Database Schema**:
   - `schema.ts` needs table additions for `staff_payroll_profiles`, `payroll_vouchers`, `donors`, `donation_receipts`, `bank_accounts`, `cash_book_daily`, and `ledger_type` columns on `fee_invoices`.
2. **Services & Routes**:
   - Need `payrollService.ts`, `donationService.ts`, and `cashbookService.ts` (or extensions in `financeService.ts`).
   - Need `notificationAdapterService.ts` implementing the 4 adapters (SMS, WhatsApp, Messenger, Brevo).
   - Need `telemetryService.ts` and `telemetryRoutes.ts` for Super Admin platform monitoring.
3. **Frontend Views**:
   - `FinanceScreen.tsx` requires tabbed views for Segregated Invoicing (Residential vs Non-Residential), Asatiza Payroll, Donors & Zakat, and Daily Cash Book.
   - `SuperAdminTelemetry.tsx` for SaaS operator view.
4. **Test Suite**:
   - Add comprehensive tests in `tests/api.test.ts` for R1 (payroll, segregated invoicing, donation funds), R2 (multi-channel adapters, >50 approval gate, 2-day absence trigger), and R5 (telemetry).
