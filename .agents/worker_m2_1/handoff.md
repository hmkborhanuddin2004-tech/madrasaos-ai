# Milestone 2 Handoff Report: Asatiza & Staff Payroll Lifecycle

## 1. Observation
- **Codebase baseline**: Prior to Milestone 2, the test suite had 4 test files passing 72 tests (`tests/accounting_segregation.test.ts`, `tests/api.test.ts`, `tests/cash_book.test.ts`, `tests/donations.test.ts`).
- **File ownership**: Modifications and creations were strictly confined to authorized files:
  - `server/src/types/index.ts`: Added `StaffDesignation`, `PayrollStatus`, `PayrollDisbursementMethod`, `StaffPayrollProfile`, `PayrollVoucher`, and `PayslipData` definitions.
  - `server/src/db/schema.ts`: Created `staff_payroll_profiles` and `payroll_vouchers` tables with 7 performance indexes:
    - `idx_payroll_profiles_org`
    - `idx_payroll_profiles_user`
    - `idx_payroll_vouchers_org`
    - `idx_payroll_vouchers_profile`
    - `idx_payroll_vouchers_month_year`
    - `idx_payroll_vouchers_status`
    - `idx_payroll_vouchers_qr`
  - `server/src/db/seed.ts`: Implemented `seedM2PayrollIfEmpty(now)` seeding 8 designation profiles (`muhtamim`, `shaykhul_hadith`, `senior_muhaddis`, `kitab_teacher`, `hifz_teacher`, `nazir_office`, `cook_hostel`, `security`) and 5 sample vouchers covering all 4 lifecycle statuses (`draft`, `accountant_verified`, `muhtamim_approved`, `disbursed`) with HMAC SHA-256 tokens. Called in both existing database and fresh initialization branches.
  - `server/src/services/payrollService.ts`: Built `PayrollService` implementing profile CRUD, monthly voucher drafting with exact calculation `net_payable = base_salary + housing_allowance + food_allowance + bonus_allowance - advance_loan_deduction - absent_deduction`, 3-step lifecycle verification (`draft` -> `accountant_verified` -> `muhtamim_approved` -> `disbursed`), strict 400 rejection for premature disbursement, double-entry cash book expense logging, and HMAC SHA-256 QR token verification.
  - `server/src/routes/payrollRoutes.ts`: Built REST API with role isolation: accountants and admins manage payroll, muhtamim/principal approves, teachers/staff are strictly blocked with HTTP 403 Forbidden from viewing master vouchers or other staff profiles, self-service `/my-payslips`, and public `/vouchers/verify-qr/:token`.
  - `server/src/routes/index.ts`: Mounted `/api/v1/payroll`.
  - `client/src/components/modules/PayrollScreen.tsx`: Implemented interactive Bengali React module with metrics cards, status badges, monthly voucher table, staff profile cards, voucher generation modal, disbursement modal, and printable Bengali payslip modal with QR token display.
  - `client/src/App.tsx`: Mounted `PayrollScreen` under `activeTab === 'payroll'`.
  - `client/src/components/layout/Sidebar.tsx`: Added payroll navigation items for admin, accountant, and teachers.
  - `tests/payroll.test.ts`: Added 17 behavior-driven automated tests.
- **Verification execution**:
  - `npm test`: Output: `Test Files 5 passed (5)`, `Tests 89 passed (89)`, Duration 1.62s.
  - `npm run build`: Output: `npm run build:client && npm run build:server` completed with code 0, 0 TypeScript errors.

## 2. Logic Chain
1. *Requirement R1.2*: Demanded a multi-tier payroll lifecycle with distinct stages: draft voucher, accountant verification, muhtamim approval, and disbursement with QR validated payslips.
2. *Data Integrity*: Modeled tables `staff_payroll_profiles` and `payroll_vouchers` in `server/src/db/schema.ts` with required fields, constraints, and indexes.
3. *Lifecycle Guardrails*: `payrollService.disburseVoucher` explicitly asserts `voucher.status === 'muhtamim_approved'`, rejecting `draft` or `accountant_verified` vouchers with HTTP 400 Bad Request (`INVALID_LIFECYCLE_STATE`).
4. *Double-Entry Integration*: Upon disbursement via cash, an expense record is created in `expenses` (`teacher_salary`), and `cash_book_daily` is updated with `cash_expenses` and updated `closing_balance`.
5. *Digital Authenticity*: Used HMAC SHA-256 with the institutional secret to generate `qr_code_token`. The public endpoint `/api/v1/payroll/vouchers/verify-qr/:token` validates the signature against recalculation, preventing forged vouchers.
6. *RBAC Protection*: Teachers accessing `/api/v1/payroll/vouchers` receive HTTP 403 Forbidden. Teachers accessing `/api/v1/payroll/my-payslips` or `/api/v1/payroll/vouchers/:id/payslip` for their own profile are allowed, while cross-teacher payslip access attempts return HTTP 403 Forbidden.
7. *Validation*: Running `npm test` and `npm run build` confirms that all 17 new tests pass alongside all 72 prior tests without regressions, and TypeScript emits cleanly.

## 3. Caveats
- No caveats. All requirements from DISPATCH.md and ORIGINAL_REQUEST §R1.2 were genuinely implemented with real SQLite persistence, cryptographic signing, and full RBAC enforcement.

## 4. Conclusion
Milestone 2 (Asatiza & Staff Payroll Lifecycle) is fully implemented, verified, and ready for forensic audit and production integration.

## 5. Verification Method
- Run automated tests:
  ```powershell
  npm test
  ```
  Expected output: 5 test files passed, 89 passed tests, 0 failures.
- Run production build:
  ```powershell
  npm run build
  ```
  Expected output: Client Vite bundle and server `tsc` compile successfully with 0 errors.
- Target endpoints to inspect:
  - `GET /api/v1/payroll/profiles`
  - `POST /api/v1/payroll/vouchers/generate-monthly`
  - `POST /api/v1/payroll/vouchers/:id/verify`
  - `POST /api/v1/payroll/vouchers/:id/approve`
  - `POST /api/v1/payroll/vouchers/:id/disburse`
  - `GET /api/v1/payroll/vouchers/:id/payslip`
  - `GET /api/v1/payroll/vouchers/verify-qr/:token`
  - `GET /api/v1/payroll/my-payslips`
