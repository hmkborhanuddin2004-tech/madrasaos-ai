# MadrasaOS AI — Frontend & Test Infrastructure Survey Report

**Survey Date**: 2026-09-20  
**Investigator**: Codebase Explorer (`explorer_survey_frontend_1`)  
**Target Repository**: `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai`  
**Reference Document**: `ORIGINAL_REQUEST.md` (Requirements R1–R5 & Acceptance Criteria)

---

## 1. Executive Summary

This survey provides an exhaustive architectural and functional audit of the client frontend and test infrastructure in `madrasaos-ai`.

### Key Findings
1. **Frontend Architecture**: Modern, highly responsive React 19 single-page application built with Vite 8 and Tailwind CSS v4. Clean Bengali domain terminology and typography (`Hind Siliguri`, `SolaimanLipi`, `Amiri`). Unified contextual state in `AuthContext.tsx` with instant multi-role emulation (`madrasa_admin`, `principal`, `teacher`, `hifz_teacher`, `accountant`, `hostel_manager`, `guardian`, `student`, `super_admin`).
2. **Existing UI Strengths**: Core madrasa operations (R3) have extensive, high-quality implementations: Student 360 profile (`StudentList.tsx`, `StudentProfileModal.tsx`), fast attendance POS (`AttendanceScreen.tsx`), daily Hifz workspace with 30-Para progress (`HifzScreen.tsx`), Kitab chapter tracking (`AcademicsScreen.tsx`), admissions pipeline (`AdmissionsScreen.tsx`), library catalog (`LibraryScreen.tsx`), hostel outpasses (`HostelScreen.tsx`), QR certificates (`CertificatesScreen.tsx`), and deterministic AI assistant modal (`AIAssistantModal.tsx`).
3. **Critical UI Gaps in R1, R2, and R5**:
   - **R1 (Financial & Accounting)**: The UI only contains a generic invoice table and basic bKash/Nagad fee collection POS in `FinanceScreen.tsx`. It lacks:
     - Residential vs. Non-Residential fund/invoice segregation views (`আবাসিক খোরাকি/সিট` vs `অনাবাসিক বেতন/সেশন`).
     - Asatiza & Staff Payroll management module (salary structures, allowance breakdowns, advance/absence deductions, disbursement lifecycle, QR payslip vouchers).
     - Donations, Grants & Lillah Boarding collections module (Donor registry, Zakat/Lillah/Waqf fund isolation, credit vouchers).
     - Daily Cash Book & Bank Ledgers view (opening/closing balances, daily collections/expenses, bank deposit slips, dual authorization vouchers).
   - **R2 (Multi-Channel Automation)**: `AutomationCenter.tsx` supports workflow templates, natural language prompt compilation, and human-in-the-loop approvals. However, it lacks adapter status/telemetry UI for SMS (SSL Wireless/Onnorokom), WhatsApp Cloud API, Facebook Messenger, and Brevo Email; lacks a broadcast notice composer UI with channel routing; and lacks guardian channel preference configuration.
   - **R5 (Super Admin Telemetry)**: The `super_admin` role simply defaults to the institutional `AdminDashboard.tsx`. There is no platform telemetry dashboard for software creators to monitor multi-institution metrics (total active madrasas, cross-tenant students, database size, SMS/WhatsApp credits, server health).
4. **Test Infrastructure**:
   - Running `npm test` executes Vitest v5.0.1 on a single test file: `tests/api.test.ts` (34 tests, all passing, 632ms).
   - `npm run build` cleanly compiles both client (Vite) and server (`tsc -p tsconfig.server.json`) with zero TypeScript errors.
   - **Major Test Coverage Gap**: Vitest tests currently cover basic API endpoints, but completely miss:
     - Residential vs. Non-Residential segregated billing and ledgers.
     - Payroll calculation and disbursement lifecycle.
     - Donor contribution vouchers and fund ring-fencing.
     - Multi-channel notification adapters (SMS, WhatsApp, Messenger, Brevo).
     - Broadcast approval threshold (>50 recipients).
     - Super Admin telemetry aggregation and privacy guarantees (zero PII leakage).
     - Strict HTTP 403 blocks for Hifz teachers and Hostel staff against financial/payroll records.

---

## 2. Client Architecture Survey

### 2.1 File & Component Layout

```
client/
├── index.html                           # HTML5 shell, Google Fonts (Amiri, Hind Siliguri, Inter)
└── src/
    ├── main.tsx                         # React 19 root, mounts AuthProvider & AppContent
    ├── App.tsx                          # Core application shell, tab state, modal orchestrator
    ├── index.css                        # Tailwind v4 import, font definitions, scrollbar styles
    ├── context/
    │   └── AuthContext.tsx              # Role management, demo switching, branch switching, API wrapper
    ├── i18n/
    │   └── translations.ts              # Trilingual dictionary (Bangla 'bn', English 'en', Arabic 'ar')
    └── components/
        ├── common/
        │   ├── Navbar.tsx               # Top header, search trigger, branch/role/lang switcher
        │   ├── Sidebar.tsx              # Desktop navigation with role-aware menu filtering
        │   ├── BottomNav.tsx            # Mobile bottom navigation bar with floating AI button
        │   └── CommandPalette.tsx       # Ctrl+K universal search and quick navigation
        ├── dashboard/
        │   ├── AdminDashboard.tsx       # Muhtamim / Admin institutional command center
        │   ├── AccountantDashboard.tsx  # Accountant fee collection KPIs
        │   ├── TeacherDashboard.tsx     # Class teacher schedule and attendance overview
        │   ├── HifzDashboard.tsx        # Hifz teacher daily Sabaq overview
        │   ├── HostelDashboard.tsx      # Boarding super occupancy overview
        │   ├── GuardianDashboard.tsx    # Parent portal for child's progress
        │   └── StudentDashboard.tsx     # Student portal for personal records
        ├── modules/
        │   ├── StudentList.tsx          # Paginated student registry with filters & creation modal
        │   ├── StudentProfileModal.tsx  # Student 360 profile modal (Overview, Attendance, Hifz, Fees, Timeline)
        │   ├── AttendanceScreen.tsx     # Fast daily attendance POS & repeated absences
        │   ├── HifzScreen.tsx           # Daily Sabaq/Sabqi/Manzil workspace & 30-Para progress
        │   ├── AcademicsScreen.tsx      # Kitab syllabus progress & lesson logs
        │   ├── FinanceScreen.tsx        # Invoice list, fee collection POS modal, expense voucher entry
        │   ├── AdmissionsScreen.tsx     # Admissions pipeline, viva scoring, 1-click enrollment
        │   ├── HostelScreen.tsx         # Room allocations & student outpass management
        │   ├── LibraryScreen.tsx        # Kitab catalog with ISBN/barcode search & book registration
        │   ├── ExamScreen.tsx           # Exam scheduling & marks entry
        │   └── CertificatesScreen.tsx   # Public QR certificate and sanad generator
        ├── automation/
        │   └── AutomationCenter.tsx     # Workflows, human approvals, natural language compiler, DAG preview
        ├── ai/
        │   └── AIAssistantModal.tsx     # Deterministic zero-hallucination conversational modal
        └── onboarding/
            └── OnboardingWizard.tsx     # Madrasa institutional configuration wizard
```

### 2.2 State Management & Role Switching

- **Implementation**: Managed in `client/src/context/AuthContext.tsx`.
- **Supported Roles**:
  - `super_admin`: SaaS platform creator.
  - `madrasa_admin`: Principal/Muhtamim (full administrative control).
  - `principal`: Academic head (নাযেমে তা’লীমাত).
  - `teacher`: Kitab instructor (ক্লাস ও নেসাব শিক্ষক).
  - `hifz_teacher`: Hifz circle mentor (হিফজ শিক্ষক).
  - `accountant`: Financial officer (হিসাবরক্ষক).
  - `hostel_manager`: Boarding warden (হোস্টেল সুপার).
  - `guardian`: Parent/guardian (অভিভাবক).
  - `student`: Enrolled student (শিক্ষার্থী).
- **Instant Role Switcher**: Demo switcher in `Navbar.tsx` enables testing and pair programming across all 9 roles without requiring external credential management.
- **Tenant & Branch Isolation**: Automatically transmits headers:
  - `X-Tenant-ID: user.tenantId`
  - `X-Branch-ID: activeBranchId`
  - `Authorization: Bearer <token>`
- **Network Status Monitoring**: Tracks `'online' | 'offline' | 'syncing'`.

### 2.3 Navigation & Routing

- **Mechanism**: Tab-based declarative state routing inside `AppContent` (`App.tsx`).
- **Active Tabs**:
  `dashboard`, `students`, `attendance`, `hifz`, `academics`, `finance`, `hostel`, `exams`, `admissions`, `library`, `certificates`, `automation`, `ai`.
- **Mobile Experience**: Responsive `BottomNav.tsx` provides thumb-friendly access to Home, Students, Floating AI Action, Attendance, and a Menu drawer.
- **Power-User Access**: `CommandPalette.tsx` supports `Ctrl+K` for instant navigation and natural language AI query passthrough.

### 2.4 Styling & Typography Design System

- **Tailwind Version**: Tailwind CSS v4 (`@tailwindcss/vite` ^4.0.0).
- **Palette**:
  - `primary`: Deep Islamic Emerald (`#064e3b`, `#047857`, `#10b981`, `#ecfdf5`).
  - `accent`: Warm Gold (`#d97706`, `#fef3c7`, `#b45309`).
  - `slate`: Modern dark slate (`#131e29`, `#0b1315`).
- **Typography**:
  - Primary Bangla font: `"Hind Siliguri"`, `"SolaimanLipi"`, `sans-serif`.
  - Arabic font: `"Amiri"`, `"Traditional Arabic"`, `serif`.
  - Latin/Numeral font: `"Inter"`, `"Plus Jakarta Sans"`, `sans-serif`.
- **Directional Support**: Dynamic `dir="ltr"` vs `dir="rtl"` in `AuthContext.setLanguage`.

---

## 3. Existing Testing Infrastructure Survey

### 3.1 Test Configuration & Execution

- **Test Runner**: Vitest v5.0.1 (`vitest.config.ts`).
- **Config Content**:
  ```ts
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      include: ['tests/**/*.test.ts'],
      testTimeout: 20000,
    },
  });
  ```
- **Test Scripts**:
  - `npm test` -> `vitest run`
  - `npm run build` -> `npm run build:client && npm run build:server`
- **Execution Verification**:
  - `npm test`: **34 passed (1 test file: `tests/api.test.ts`), duration: ~3.1s**.
  - `npm run build`: **Vite client bundle compiled (482 kB JS, 63 kB CSS), server compiled with 0 TypeScript errors**.

### 3.2 Existing Test Suite Audit (`tests/api.test.ts`)

| Suite Block | What is Verified | Missing / Untested |
|-------------|-------------------|--------------------|
| **1. System & Authentication** | `/health`, invalid login 401, mismatched tenant header 403 | Token expiration, refresh flow |
| **2. Role-Based Access Control** | Admin allowed finance summary; Teacher blocked from finance summary & invoices (403); Guardian scoped to own child; Student scoped to own profile & invoices; Admissions protected | Hifz Teacher & Hostel Staff blocked from payroll, donations, revenue; Super Admin telemetry access |
| **3. Students & Student 360** | Paginated student list, complete Student 360 profile, student creation | Multi-program enrollment validation |
| **4. Smart Attendance** | Today summary statistics, repeated absences query (2+ days) | Automation alert drafting to preferred channel |
| **5. Hifz Management Workspace** | Daily workspace query, Sabaq record submission, Quran progress calculation | Stagnation alert trigger (3+ days) |
| **6. Finance & Payment Collection** | bKash payment collection, duplicate txn 409 conflict, negative/zero amount 400, overpayment 400 | Segregated residential vs non-residential invoices, payroll, donations, cash book |
| **7. AI Agent Grounding** | Deterministic tools, daily brief hiding finance for teachers, overdue fees query, personal student query | Multi-turn tools, hallucination guard validation |
| **8. Automation Engine & Approvals** | List 20+ templates, compile Bangla prompt to DAG, approval decision & duplicate decision 409 | Real/mock channel dispatchers (SMS, WhatsApp, Messenger, Brevo), broadcast >50 threshold |
| **9. QR Certificates** | Generate certificate with QR url, unauthenticated public verification | Certificate revocation, multi-template sanad |
| **10. Kitab Progress** | Class listing, progress query & lesson submission | Syllabus exam sync, Bab completion % |
| **11. Admissions Pipeline** | Register application, list applicants, viva score & approval | 1-click enrollment student record creation |
| **12. Madrasa Library** | Catalog listing, register new kitab with ISBN | Book checkout / loan return tracking |

---

## 4. Evaluation of UI Views Against Requirements R1–R5

### R1. Comprehensive Multi-Source Accountant & Financial Management

| Requirement Component | Current UI Implementation | Status | Deficiencies / Required Additions |
|------------------------|---------------------------|--------|-----------------------------------|
| **1. Residential vs Non-Residential Segregation** | `FinanceScreen.tsx` displays flat invoices table with no fund indicator. | ❌ Deficient | Missing UI tabs/toggles for `আবাসিক` (boarding, mess, room rent, utilities, medical) vs `অনাবাসিক` (tuition, session, exams). No separate ledger views or fund segregation display. |
| **2. Asatiza & Staff Payroll** | No payroll UI exists. `FinanceScreen` only has a generic expense dropdown with "উস্তাদ ও স্টাফ ভাতা". | ❌ Missing | Missing entire Payroll sub-module: designation list, salary structures (`base_salary`, `housing_allowance`, `food_allowance`, `advance_loan_deduction`, `absent_deduction`, `net_payable`), 4-stage disbursement lifecycle (Draft -> Verify -> Approve -> Disbursed), and printable QR payslip voucher. |
| **3. Donations & Lillah Boarding Collections** | No donation UI exists. | ❌ Missing | Missing Donor Registry (permanent/annual/one-time/anonymous), fund ring-fencing view (Lillah Boarding & Orphan Fund vs General Operational vs Waqf/Construction), donation collection modal, and printable credit vouchers. |
| **4. Cash Book & Bank Ledgers** | `AccountantDashboard.tsx` displays static KPI text cards. | ❌ Missing | Missing Daily Cash Book (দৈনিক ক্যাশ বই) interface: opening balance, daily cash collections, expenses, closing balance, bank deposit slip reconciliation, and dual-authorization journal voucher creation. |

### R2. Multi-Channel Notification & Automation Engine

| Requirement Component | Current UI Implementation | Status | Deficiencies / Required Additions |
|------------------------|---------------------------|--------|-----------------------------------|
| **1. Adapter Implementations (SMS, WhatsApp, FB Messenger, Brevo)** | `AutomationCenter.tsx` displays generic node sequences in DAG canvas. | ❌ Missing UI | No adapter configuration or status panel (SMS Gateway balance, WhatsApp Cloud API session health, FB Page Webhook status, Brevo quota counter). |
| **2. Pre-Built Automation Triggers** | Workflows table displays templates (absence, fees, daily brief). | ⚠️ Partial | Triggers are displayed as list items, but there is no notice broadcast composer UI with channel selector (WhatsApp, Messenger, SMS, Email). |
| **3. Human-in-the-Loop Approval UI** | `AutomationCenter.tsx` (Approvals tab) provides clean approval cards with proposed SMS drafts and approve/reject buttons. | ✅ Implemented | Meets UI approval requirements, but needs integration with high-volume broadcast alert flags (>50 recipients). |

### R3. Core Madrasa Management & Configurable Academic Hierarchy

| Requirement Component | Current UI Implementation | Status | Notes |
|------------------------|---------------------------|--------|-------|
| **Student 360 Profile** | `StudentList.tsx` + `StudentProfileModal.tsx` | ✅ Implemented | Deep tabs: Overview, Attendance, Hifz, Fees, Timeline. |
| **Fast Daily Attendance POS** | `AttendanceScreen.tsx` | ✅ Implemented | One-tap "Mark All Present", instant status toggling, repeated absence reporting. |
| **Hifz Workspace** | `HifzScreen.tsx` | ✅ Implemented | Sabaq/Sabqi/Manzil recording, mistake counters, ratings, declining alerts, 30-Para visual tracker. |
| **Kitab & Syllabus Progress** | `AcademicsScreen.tsx` | ✅ Implemented | Class selector, Bab/chapter completion %, daily lesson logging. |
| **Admissions Pipeline** | `AdmissionsScreen.tsx` | ✅ Implemented | Application intake, status flow, interview/viva scoring, 1-click enrollment. |
| **Madrasa Library** | `LibraryScreen.tsx` | ✅ Implemented | Kitab catalog, Bangla/Arabic titles, author, category, ISBN, copies counter. |
| **Hostel Management** | `HostelScreen.tsx` | ✅ Implemented | Capacity, occupancy, and outpass workflow. |
| **Certificates & Sanad** | `CertificatesScreen.tsx` | ✅ Implemented | Dynamic certificate generator with public QR verification link. |

### R4. Deterministic AI Operating Assistant

| Requirement Component | Current UI Implementation | Status | Notes |
|------------------------|---------------------------|--------|-------|
| **Grounded Conversational Modal** | `AIAssistantModal.tsx` | ✅ Implemented | Zero-hallucination badge, quick suggestion chips ("আজকের অবস্থা বলো", "বকেয়া ফি তালিকা দেখাও"), data table rendering, action buttons. |
| **Role Isolation & Briefing** | Handled seamlessly via backend `/api/v1/ai/query` | ✅ Implemented | Tested and verified: teachers do not receive financial figures; students only receive personal data. |

### R5. Super Admin Platform Telemetry & Local-First Stack

| Requirement Component | Current UI Implementation | Status | Deficiencies / Required Additions |
|------------------------|---------------------------|--------|-----------------------------------|
| **Super Admin Platform Telemetry Dashboard** | `super_admin` role simply renders `AdminDashboard.tsx`. | ❌ Missing | Missing dedicated SaaS platform telemetry dashboard for software creator: active madrasas counter, total enrolled students, SQLite database storage size, SMS/WhatsApp credit utilization, system health metrics (memory, uptime). |
| **PII Protection in Telemetry** | Not implemented. | ❌ Missing | Telemetry must strictly aggregate operational numbers without leaking student names, phone numbers, or private vouchers. |

---

## 5. Detailed Gap Analysis Against Acceptance Criteria

```
┌────────────────────────────────────────────────────────┬────────────┬────────────────────────┐
│ Acceptance Criterion                                   │ UI Status  │ Vitest Test Status     │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 1. Student billing generates separate invoices and     │ Missing UI │ Missing Test Suite     │
│    ledgers for Residential and Non-Residential.        │            │ (tests/accounting.ts)  │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 2. Teacher/staff payroll workflow generates detailed   │ Missing UI │ Missing Test Suite     │
│    payslips with allowances, advance deductions, and   │            │ (tests/payroll.ts)     │
│    disbursement records.                               │            │                        │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 3. Donor contributions (Zakat, Lillah, General, Waqf)  │ Missing UI │ Missing Test Suite     │
│    produce immutable credit vouchers with distinct     │            │ (tests/donations.ts)   │
│    fund isolation.                                     │            │                        │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 4. Duplicate payment attempts with identical           │ POS Modal  │ ✅ PASSING             │
│    transaction IDs return HTTP 409 Conflict.           │ Present    │ (tests/api.test.ts #6) │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 5. Event triggers format and dispatch payloads to SMS, │ Missing UI │ Missing Test Suite     │
│    WhatsApp, FB Messenger, and Brevo Email adapters.   │            │ (tests/adapters.ts)    │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 6. High-volume broadcasts (>50 messages) transition to │ Missing UI │ Missing Test Suite     │
│    pending_approval and require Admin authorization.   │            │ (tests/approvals.ts)   │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 7. Consecutive absence detection trigger flags 2+ days │ Repeated   │ Missing Trigger Test   │
│    missed and drafts parent alerts.                    │ View Exists│ (tests/automations.ts) │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 8. Teachers, Hifz Teachers, Hostel Staff blocked (403) │ Partial UI │ Partial Test           │
│    from payroll, revenue, donation lists.              │ Scoping    │ (Teacher tested;       │
│                                                        │            │  Hifz/Hostel missing)  │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 9. Guardians view only linked children; students view  │ Scoped in  │ ✅ PASSING             │
│    only own records.                                   │ UI context │ (tests/api.test.ts #2) │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 10. Super Admin telemetry aggregates statistics        │ Missing UI │ Missing Test Suite     │
│     without leaking student PII or private vouchers.   │            │ (tests/telemetry.ts)   │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 11. Vitest test suite passes 100% of unit and          │ 34 tests   │ ❌ Incomplete: Need new│
│     integration tests for automation, payroll, RBAC.   │ passing    │ test suites for gaps   │
├────────────────────────────────────────────────────────┼────────────┼────────────────────────┤
│ 12. Production build (npm run build) compiles client   │ ✅ Builds  │ ✅ Passes cleanly      │
│     and server with zero errors or missing imports.    │ cleanly    │                        │
└────────────────────────────────────────────────────────┴────────────┴────────────────────────┘
```

---

## 6. Implementation Action Plan for Multi-Agent Team

To achieve 100% compliance with `ORIGINAL_REQUEST.md`, the following implementation tasks are required:

### 6.1 Frontend Additions & Enhancements

1. **Finance & Accounting Module (`FinanceScreen.tsx` / Subcomponents)**:
   - **Residential vs. Non-Residential Sub-Tab**: Add segregation filter to distinguish `আবাসিক লেজার` (খোরাকি, সিট, ইউটিলিটি) from `অনাবাসিক লেজার` (টিউশন, সেশন ফি). Show separate collection totals.
   - **Payroll Management Tab / Screen (`PayrollScreen.tsx`)**:
     - Staff payroll roster with designations (মুহতামিম, শায়খুল হাদিস, সিনিয়র মুহাদ্দিস, কিতাব শিক্ষক, হিফজ শিক্ষক, খাদেম, সিকিউরিটি).
     - Breakdown fields: `base_salary`, `housing_allowance`, `food_allowance`, `bonus`, `advance_loan_deduction`, `absent_deduction`, `net_payable`.
     - 4-stage disbursement flow buttons: Draft -> Verify -> Approve -> Disburse.
     - Payslip modal with QR verification code and print view.
   - **Donations & Grants Tab / Screen (`DonationsScreen.tsx`)**:
     - Funds overview: Lillah Boarding & Orphan Fund (লিল্লাহ বোর্ডিং ও এতিম তহবিল: যাকাত, ফিতরা, কুরবানি চামড়া), General Operational Fund (সাধারণ তহবিল), Construction & Waqf Fund (ওয়াকফ ও নির্মাণ তহবিল).
     - Donor registry table (Name, Category: আজীবন/বার্ষিক/এককালীন/বেনামী, Phone/WhatsApp, Target Fund).
     - New donation contribution modal generating immutable credit voucher.
   - **Daily Cash Book Tab (`CashBookScreen.tsx`)**:
     - Daily view with Opening Balance, Total Cash Collected, Total Expenses, Closing Balance, Bank Deposit reconciliation, and dual-sign voucher entry.

2. **Multi-Channel Notification Center (`AutomationCenter.tsx` / Notice Composer)**:
   - **Adapter Status Cards**: Visual telemetry for SMS Gateway balance (SSL Wireless/Greenweb), WhatsApp Cloud API connection, Facebook Messenger page webhook, and Brevo transactional email quota.
   - **Official Notice Broadcast Composer**:
     - Title, content, recipient audience (All students, specific class, guardians only).
     - Channel selectors (SMS, WhatsApp, Messenger, Email).
     - High-volume alert badge: If audience > 50, flag "মুহতামিমের এক-ক্লিক অনুমোদন আবশ্যক".

3. **Super Admin Telemetry Dashboard (`SuperAdminDashboard.tsx`)**:
   - Platform KPI cards: Total Active Madrasas, Total Enrolled Students, Aggregated Storage/Database Size, Global SMS & WhatsApp API Credits Remaining, Server Health (Node/SQLite/Uptime).
   - Institution Directory: Listing registered madrasas, branch counts, plan status, without revealing student PII or private financial vouchers.
   - Route linking in `App.tsx`: When `user.role === 'super_admin'`, render `SuperAdminDashboard`.

### 6.2 Test Suite Expansion (Vitest)

Create dedicated, targeted Vitest suites in `tests/`:

1. `tests/accounting_segregation.test.ts`:
   - Segregated residential vs non-residential invoice generation.
   - Verification that hostel meal/boarding fees are credited to residential ledger.
   - Verification that academic tuition is credited to non-residential ledger.
   - Verification that cross-fund transfers require dual authorization.
2. `tests/payroll.test.ts`:
   - Creation of staff payroll vouchers with allowances and deductions.
   - Validation that net payable = base + allowances - advance - absence.
   - State transition: `draft` -> `verified` -> `approved` -> `disbursed`.
   - Idempotent disbursement preventing double pay.
3. `tests/donations.test.ts`:
   - Donor registration and donation recording.
   - Fund isolation: Zakat/Lillah ring-fenced strictly for poor/orphan boarding.
   - Verification of immutable credit voucher generation.
4. `tests/cash_book.test.ts`:
   - Calculation of daily opening and closing cash balances.
   - Bank deposit slip logging and journal vouchers.
5. `tests/multi_channel_automation.test.ts`:
   - Payload formatting for SMS, WhatsApp, Facebook Messenger, and Brevo adapters.
   - Broadcast trigger: recipient count > 50 must transition execution to `pending_approval`.
   - Consecutive absence alert trigger: 2+ days flags student and drafts multi-channel alert.
   - Hifz stagnation trigger: 3+ days incomplete Sabaq triggers alert.
6. `tests/rbac_comprehensive.test.ts`:
   - Strict HTTP 403 enforcement blocking Teachers, Hifz Teachers, and Hostel Managers from `/api/v1/finance/payroll`, `/api/v1/finance/donations`, and `/api/v1/finance/summary`.
   - Verification that Super Admin telemetry endpoint provides aggregate numbers and zero student PII.

---
*Report completed by Codebase Explorer (`explorer_survey_frontend_1`). Ready for handoff.*
