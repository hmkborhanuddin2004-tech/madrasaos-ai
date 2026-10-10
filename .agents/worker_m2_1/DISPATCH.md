## 2026-09-20T10:58:32Z

You are the Lead Full-Stack Worker (teamwork_preview_worker) for Milestone 2: Asatiza & Staff Payroll Lifecycle.

Your working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m2_1
Your parent orchestrator: orchestrator_1 (Conversation ID: 643bbed0-30b9-40bc-9c5b-226c8019bf72)

MANDATORY INPUTS:
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\ORIGINAL_REQUEST.md first (specifically section R1.2).
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\PROJECT.md.
- Review existing schema and services in `server/src/db/schema.ts` and `server/src/services/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE WRITE OWNERSHIP:
- server/src/types/index.ts
- server/src/db/schema.ts
- server/src/db/seed.ts
- server/src/services/payrollService.ts
- server/src/routes/payrollRoutes.ts
- server/src/routes/index.ts
- client/src/components/modules/PayrollScreen.tsx
- client/src/App.tsx
- client/src/components/layout/Sidebar.tsx
- tests/payroll.test.ts

IMPLEMENTATION REQUIREMENTS:
1. Data Models & Schema (`server/src/types/index.ts` & `server/src/db/schema.ts`):
   - Table `staff_payroll_profiles`:
     `id, organization_id, user_id, staff_name, designation, base_salary, housing_allowance, food_allowance, bonus_allowance, advance_loan_deduction, payment_method, account_details, created_at`
     Designations: `muhtamim`, `shaykhul_hadith`, `senior_muhaddis`, `kitab_teacher`, `hifz_teacher`, `nazir_office`, `cook_hostel`, `security`.
   - Table `payroll_vouchers`:
     `id, organization_id, voucher_number, profile_id, staff_name, designation, month, year, base_salary, housing_allowance, food_allowance, bonus_allowance, advance_loan_deduction, absent_deduction, net_payable, status, verified_by, approved_by, disbursed_by, disbursement_method, transaction_reference, qr_code_token, disbursed_at, created_at`
     Status lifecycle: `draft` -> `accountant_verified` -> `muhtamim_approved` -> `disbursed`.
   - Automatic migration: create tables if they do not exist with indexes.
2. Seed Data (`server/src/db/seed.ts`):
   - Seed sample staff payroll profiles for Muhtamim, Shaykhul Hadith, Kitab Teacher, Hifz Teacher, Nazir, Cook, Security.
   - Seed sample vouchers across `draft`, `accountant_verified`, `muhtamim_approved`, and `disbursed` statuses.
3. Backend Service & Routes (`server/src/services/payrollService.ts` & `server/src/routes/payrollRoutes.ts`):
   - Profile management: `getProfiles`, `createProfile`, `updateProfile`.
   - Monthly generation: `generateMonthlyVouchers(month, year)` drafting vouchers for all active profiles with exact calculation:
     `net_payable = base_salary + housing_allowance + food_allowance + bonus_allowance - advance_loan_deduction - absent_deduction`.
   - Workflow lifecycle endpoints:
     - `POST /api/v1/payroll/vouchers/:id/verify` (accountant/admin only) -> status = `accountant_verified`.
     - `POST /api/v1/payroll/vouchers/:id/approve` (muhtamim/principal/admin only) -> status = `muhtamim_approved`.
     - `POST /api/v1/payroll/vouchers/:id/disburse` (accountant/admin only; voucher must be `muhtamim_approved` or returns 400 Bad Request) -> status = `disbursed`, records disbursement method (`cash`, `bank`, `bkash`, `nagad`) and creates cash book / bank disbursement log.
     - `GET /api/v1/payroll/vouchers/:id/payslip`: returns full payslip with SHA-256 / HMAC QR validation token.
     - `GET /api/v1/payroll/vouchers/verify-qr/:token`: public/guardian/auditor QR validation endpoint.
   - RBAC isolation:
     - Accountants, Admins, Muhtamim, Principal can manage payroll and list all vouchers.
     - Teachers / Hifz Teachers / Staff are strictly blocked (HTTP 403 Forbidden) from viewing the full payroll list, other teachers' salaries, or modifying vouchers.
     - Teachers can only access `GET /api/v1/payroll/my-payslips` or own payslip.
   - Mount routes in `server/src/routes/index.ts` under `/api/v1/payroll`.
4. Client UI (`client/src/components/modules/PayrollScreen.tsx`):
   - Staff designation profiles overview with salary/allowance breakdown cards.
   - Monthly voucher table with status badges (`খসড়া`, `হিসাবরক্ষক কর্তৃক যাচাইকৃত`, `মুহতামিম কর্তৃক অনুমোদিত`, `পরিশোধিত`).
   - Action buttons: "মাসিক ভাউচার তৈরি", "যাচাই করুন", "অনুমোদন করুন", "পরিশোধ করুন".
   - Payslip modal with printable Bengali voucher layout and QR verification code display.
   - Mount tab in `client/src/App.tsx` and `client/src/components/layout/Sidebar.tsx`.
5. Automated Tests (`tests/payroll.test.ts`):
   - 12+ behavior-driven tests covering: profile creation, monthly voucher calculation, lifecycle state transitions, blocking premature disbursement, QR token verification, and strict RBAC isolation (teachers get 403 on full payroll list, allowed on own payslip).
6. Verification:
   - Run `npm test` using run_command — verify 100% passing tests (existing 72 + new payroll tests).
   - Run `npm run build` using run_command — verify 0 TypeScript errors.
