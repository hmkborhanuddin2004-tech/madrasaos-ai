# Project: MadrasaOS AI v3.0

## Architecture
- **Server**: Express 5.2.1 REST API, TypeScript ESM, modular routes (`/api/v1/*`), services, middleware (`authMiddleware`, `tenantMiddleware`, `auditMiddleware`).
- **Database**: Local-first SQLite3 (`data/madrasaos.sqlite`) with WAL mode, foreign keys, and Promise-based `DatabaseService`. Ready for Postgres/Redis local or cloud expansion.
- **Client**: React 19 + TypeScript + Vite + Tailwind CSS v4. Modular tabbed interface, Bengali/English/Arabic i18n (`Hind Siliguri`, `Amiri`), dynamic Role-Based UI.
- **Notification & Automation**: In-process event bus and DAG runner with pluggable provider adapters (SMS, WhatsApp, FB Messenger, Brevo Email) and >50 recipient safety gate.
- **AI Assistant**: Deterministic tool-calling engine (`aiAgentService`) with strict role-based data isolation and Bengali system briefings.
- **Telemetry**: Super Admin platform telemetry aggregating multi-tenant system health, database storage, and messaging credit balances with zero PII leakage.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Residential Fee Tracking | Boarding, mess (খোরাকি), bed rent, laundry/utility, medical aid | M1 | ORIGINAL_REQUEST §R1.1 |
| 2 | Non-Residential Fee Tracking | Tuition (মাসিক বেতন), session, exam, transport charges | M1 | ORIGINAL_REQUEST §R1.1 |
| 3 | Financial Fund Segregation | Hard separation between boarding funds and academic tuition ledgers | M1 | ORIGINAL_REQUEST §R1.1 |
| 4 | Staff Designation Profiles | Muhtamim, Shaykhul Hadith, Senior Muhaddis, Kitab/Hifz Teachers, Nazir, Staff, Security | M2 | ORIGINAL_REQUEST §R1.2 |
| 5 | Staff Payroll Compensation Breakdown | Base salary, housing, food, bonus, loan advance & absence deductions, net payable | M2 | ORIGINAL_REQUEST §R1.2 |
| 6 | Payroll Voucher Lifecycle | Draft Voucher -> Accountant Verification -> Muhtamim Approval -> Disbursement | M2 | ORIGINAL_REQUEST §R1.2 |
| 7 | Multi-Method Salary Disbursement | Cash, Bank Transfer, bKash, Nagad with transaction reference | M2 | ORIGINAL_REQUEST §R1.2 |
| 8 | QR-Validated Payslip | Printable and downloadable staff payslip with HMAC/hash QR code | M2 | ORIGINAL_REQUEST §R1.2 |
| 9 | Lillah Boarding & Orphan Fund | Strictly ring-fenced fund for poor/orphan residential students (Zakat, Fitra, Qurbani, Sadaqah) | M1 | ORIGINAL_REQUEST §R1.3 |
| 10 | General Operational Fund | Maintenance, electricity, general gifts and operational overhead | M1 | ORIGINAL_REQUEST §R1.3 |
| 11 | Construction & Waqf Fund | Building construction, mosque expansion, and waqf assets | M1 | ORIGINAL_REQUEST §R1.3 |
| 12 | Donor Registry & Commitments | Donor name, org, category (Permanent, Annual, One-time, Anonymous), contact, commitments | M1 | ORIGINAL_REQUEST §R1.3 |
| 13 | Immutable Donation Credit Vouchers | Serialized receipts with automated fund assignment and zero cross-leakage | M1 | ORIGINAL_REQUEST §R1.3 |
| 14 | Daily Automated Cash Book | Opening balance, daily collections, daily expenses, closing balance, bank deposit slips | M1 | ORIGINAL_REQUEST §R1.4 |
| 15 | Payment Idempotency & Conflict Guard | Duplicate payment attempts with identical transaction IDs return HTTP 409 Conflict | M1 | Acceptance Criteria §Accountant |
| 16 | SMS Gateway Adapter | Telco aggregator (SSL Wireless, Greenweb, Onnorokom) with Bengali unicode & balance tracking | M3 | ORIGINAL_REQUEST §R2.1 |
| 17 | WhatsApp Cloud API Adapter | Session & template messaging for alerts, Sabaq progress, and fee overdue reminders | M3 | ORIGINAL_REQUEST §R2.1 |
| 18 | Facebook Messenger Adapter | Page-scoped webhook integration for notices and fee receipts | M3 | ORIGINAL_REQUEST §R2.1 |
| 19 | Brevo / SMTP Email Adapter | Quota-managed transactional dispatch with PDF fee vouchers and marksheets | M3 | ORIGINAL_REQUEST §R2.1 |
| 20 | Consecutive Absence Trigger | 2+ consecutive missed days triggers instant alert to preferred parent channel | M3 | ORIGINAL_REQUEST §R2.2 |
| 21 | Automated Fee Reminder Trigger | Scheduled monthly trigger (10th) for overdue invoices with MFS payment links | M3 | ORIGINAL_REQUEST §R2.2 |
| 22 | Instant Notice Broadcast Trigger | Muhtamim notices formatted and routed across WhatsApp, Messenger, SMS | M3 | ORIGINAL_REQUEST §R2.2 |
| 23 | Hifz Stagnation Warning Trigger | 3+ consecutive days incomplete Sabaq triggers alert to teacher & guardian | M3 | ORIGINAL_REQUEST §R2.2 |
| 24 | Monthly Payroll Generation Trigger | Automated drafting of teacher salary slips on the 1st of each month | M3 | ORIGINAL_REQUEST §R2.2 |
| 25 | Human-in-the-Loop Mass Dispatch Gate | Broadcasts with >50 recipients require explicit Muhtamim authorization | M3 | ORIGINAL_REQUEST §R2.3 |
| 26 | Student 360 Profile | Unified Qawmi Jamaat + Hifz Circle + Hostel Bed enrollment without duplication | Core (R3) | ORIGINAL_REQUEST §R3 |
| 27 | Daily Attendance POS | One-tap "Mark All Present" with instant Absent/Late/Leave toggle | Core (R3) | ORIGINAL_REQUEST §R3 |
| 28 | Hifz Workspace | Sabaq, Sabqi, Manzil, mistake scoring, and 30-Para progress visualization | Core (R3) | ORIGINAL_REQUEST §R3 |
| 29 | Kitab & Syllabus Progress | Bab/Chapter completion percentages and daily lesson logs | Core (R3) | ORIGINAL_REQUEST §R3 |
| 30 | Admissions Pipeline | Application intake, viva/interview scoring, and 1-click enrollment | Core (R3) | ORIGINAL_REQUEST §R3 |
| 31 | Madrasa Library | Arabic/Bangla catalog, barcode/ISBN lookup, and loan tracking | Core (R3) | ORIGINAL_REQUEST §R3 |
| 32 | Grounded AI Tool Execution | Deterministic execution of authorized backend tools with zero hallucination | M4 | ORIGINAL_REQUEST §R4 |
| 33 | AI Role Isolation & Financial Guard | Teachers blocked from institutional revenue/salaries; guardians/students limited to own data | M4 | ORIGINAL_REQUEST §R4 |
| 34 | Conversational Executive Briefing | "আজকের অবস্থা বলো" summarizes attendance, pending tasks, and collections for Admin | M4 | ORIGINAL_REQUEST §R4 |
| 35 | Super Admin Telemetry Dashboard | Platform monitor for total active madrasas, student counts, DB size, and credits | M4 | ORIGINAL_REQUEST §R5 |
| 36 | Local-First Architecture | High performance on local server with SQLite/WAL before cloud staging | M4 | ORIGINAL_REQUEST §R5 |
| 37 | Telemetry Privacy & PII Protection | Platform stats aggregated without leaking student PII or private financial vouchers | M4 | Acceptance Criteria §RBAC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Segregated Accounting, Fund Isolation & Cash Book | R1: Residential/Non-residential fee segregation, Donors, Zakat/Lillah ring-fencing, Cash Book, Payment Idempotency, seed fix | none | DONE |
| M2 | Asatiza & Staff Payroll Lifecycle | R1: Designation profiles, salary calculation, allowance/deduction breakdown, approval lifecycle, QR payslip | M1 | DONE |
| M3 | Multi-Channel Adapters & Automation Engine | R2: SMS, WhatsApp, FB Messenger, Brevo adapters, 5 trigger rules, >50 recipient approval gate | none | IN_PROGRESS |
| M4 | AI Grounding Guardrails & Platform Telemetry | R4 & R5: Extended financial tools with RBAC isolation, Super Admin telemetry endpoint and dashboard | M1, M2 | PLANNED |
| M5 | Comprehensive E2E Test Suite & Adversarial Hardening | Phase 1: 100% passing Vitest suite across all criteria; Phase 2: Adversarial coverage hardening (Tier 5) | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### M1: Segregated Accounting & Donations
- `GET /api/v1/finance/invoices?type=residential|non_residential` -> Returns filtered segregated invoices.
- `POST /api/v1/finance/invoices` -> Body: `{ student_id, ledger_type: 'residential' | 'non_residential', fee_items: [...], due_date }`.
- `POST /api/v1/finance/payments/collect` -> Body: `{ invoice_id, amount, payment_method, transaction_id }`. Duplicate `transaction_id` returns HTTP 409.
- `POST /api/v1/finance/donations/receipts` -> Body: `{ donor_id, fund_type: 'lillah_orphan' | 'general' | 'waqf_construction', amount, payment_method, receipt_no }`.
- `GET /api/v1/finance/cash-book/daily?date=YYYY-MM-DD` -> Returns `{ opening_balance, collections_total, expenses_total, closing_balance, entries: [...] }`.

### M2: Staff Payroll
- `GET /api/v1/payroll/profiles` -> List staff payroll structures with designation and allowances.
- `POST /api/v1/payroll/vouchers/generate-monthly` -> Drafts monthly salary vouchers.
- `POST /api/v1/payroll/vouchers/:id/verify` -> Accountant verification step.
- `POST /api/v1/payroll/vouchers/:id/approve` -> Principal/Muhtamim approval step.
- `POST /api/v1/payroll/vouchers/:id/disburse` -> Disburses voucher and creates immutable disbursement record.
- `GET /api/v1/payroll/vouchers/:id/payslip` -> Returns formatted payslip payload with QR verification token.

### M3: Multi-Channel Notifications
- `INotificationAdapter`: `{ send(to: string, message: string, metadata?: any): Promise<{ success: boolean; messageId: string; balanceRemaining?: number }> }`
- `NotificationRouter`: Dispatches based on recipient preferred channel (`sms` | `whatsapp` | `messenger` | `email`).
- `POST /api/v1/notifications/broadcast` -> Body: `{ recipients: string[], content: string, channels: string[] }`. If `recipients.length > 50`, status is set to `pending_approval` and approval workflow created.
- `TriggerEngine`: Evaluates `consecutive_absence`, `fee_reminder`, `notice_broadcast`, `hifz_stagnation`, `monthly_payroll`.

### M4: Platform Telemetry & AI Isolation
- `GET /api/v1/telemetry` -> (Super Admin only) Returns `{ total_madrasas, total_students, total_teachers, sqlite_storage_bytes, adapter_credits: { sms_balance, whatsapp_session_count, email_daily_sent } }`. Zero PII (no names, phones, or voucher IDs).
- `aiAgentService`: Guard tool execution based on `req.user.role`.

## Code Layout
- `server/src/db/`: `schema.ts`, `db.ts`, `seed.ts`
- `server/src/services/`: `financeService.ts`, `payrollService.ts`, `donationService.ts`, `cashBookService.ts`, `notification/` (adapters & router), `automationService.ts`, `aiAgentService.ts`, `telemetryService.ts`
- `server/src/routes/`: `financeRoutes.ts`, `payrollRoutes.ts`, `donationRoutes.ts`, `cashBookRoutes.ts`, `notificationRoutes.ts`, `telemetryRoutes.ts`
- `client/src/components/`: `modules/FinanceScreen.tsx`, `modules/PayrollScreen.tsx`, `modules/DonationsScreen.tsx`, `modules/CashBookScreen.tsx`, `automation/AutomationCenter.tsx`, `dashboard/SuperAdminDashboard.tsx`
- `tests/`: `api.test.ts`, `accounting_segregation.test.ts`, `payroll.test.ts`, `donations.test.ts`, `cash_book.test.ts`, `multi_channel_automation.test.ts`, `rbac_comprehensive.test.ts`, `telemetry.test.ts`
