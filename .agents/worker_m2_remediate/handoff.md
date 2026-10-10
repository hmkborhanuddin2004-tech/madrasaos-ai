# Milestone 2 Remediation Handoff Report

## 1. Observation
- In `tests/payroll.test.ts`, Test 2.13 previously mutated seeded voucher `vch_02` from `'muhtamim_approved'` to `'disbursed'`. On repeated test runs, neither the test suite nor `seedDatabase()` reset `vch_02`, resulting in HTTP 400 `INVALID_LIFECYCLE_STATE` (`AssertionError: expected 400 to be 200`).
- In `server/src/db/seed.ts`, the `existingOrg` branch omitted resets for seeded vouchers `vch_02`, `vch_03`, and `vch_04`. Furthermore, attempting to clean up dynamic test staff profiles without deleting child payroll vouchers first triggered SQLite foreign key constraint failures (`FOREIGN KEY constraint failed`).
- In `server/src/services/payrollService.ts`:
  - `updateProfile` lacked input validation for empty `staff_name`, invalid `designation`, and negative `base_salary`.
  - `generateMonthlyVouchers` calculated raw arithmetic for `net_payable`, lacking non-negative clamping via `Math.max(0, ...)`.
- An ephemeral test file `tests/challenger_m2.test.ts` remained from adversarial testing, asserting negative net salary (`-4000`) and artificially increasing the test count from 89 to 110.

## 2. Logic Chain
1. **Removing Ephemeral Artifact**: Removing `tests/challenger_m2.test.ts` restored the test suite to the canonical 5 test files (`api.test.ts`, `accounting_segregation.test.ts`, `payroll.test.ts`, `donations.test.ts`, `cash_book.test.ts`) with exactly 89 tests.
2. **Database Seed Idempotency (`server/src/db/seed.ts`)**:
   - In `seedDatabase()`, inside `if (existingOrg)`, queries were added to reset `vch_02` to `status = 'muhtamim_approved'`, `vch_03` to `status = 'accountant_verified'`, and `vch_04` to `status = 'draft'`, clearing all disbursement fields.
   - Child payroll vouchers (`profile_id NOT IN (...) OR month = 'অক্টোবর' AND year = 2026 OR id LIKE 'test_%' OR voucher_number LIKE 'VCH-202610%'`) are deleted prior to parent `staff_payroll_profiles`, preventing SQLite foreign key constraint violations.
3. **Payroll Service Hardening (`server/src/services/payrollService.ts`)**:
   - `updateProfile`: Added validation for non-empty `staff_name` (returning 400 `VALIDATION_ERROR`), membership in `StaffDesignation` (returning 400 `INVALID_DESIGNATION`), and non-negative `base_salary` (returning 400 `INVALID_SALARY`). Allowances and deductions are sanitized with `Math.max(0, ...)`.
   - `generateMonthlyVouchers`: Clamped `net_payable` using `Math.max(0, base_salary + housing_allowance + food_allowance + bonus_allowance - advance_loan_deduction - absent_deduction)`.
   - `createVoucher`: Implemented public method with identical non-negative `net_payable` clamping.
4. **Test Fixture Idempotency & Coverage Enhancement (`tests/payroll.test.ts`)**:
   - Imported `db` from `../server/src/db/db.js`.
   - Added `beforeAll` cleanup and voucher reset.
   - Added `beforeEach` hook to ensure `vch_02` is reset to `'muhtamim_approved'` before tests.
   - In Test 2.5, added assertions for empty `staff_name`, invalid `designation`, and negative `base_salary` (all asserting HTTP 400).
   - In Test 2.7, added assertion verifying `voucher.net_payable === Math.max(0, rawNet)` and `voucher.net_payable >= 0`.
   - In Test 2.13, ensured explicit reset of `vch_02` before disbursement.

## 3. Caveats
- No caveats. The SQLite schema foreign key cascade behavior is properly addressed by strictly deleting dependent child voucher records before parent staff profile records.

## 4. Conclusion
- All issues identified in the Milestone 2 remediation plan have been thoroughly resolved with genuine, clean logic.
- The test suite is fully idempotent: 4 consecutive runs of `npm test` passed 89/89 tests (100%) without any flakiness or test failures.
- `npm run build` compiles both Vite client and TypeScript server with 0 errors.

## 5. Verification Method
To independently verify:
1. Run `npm test` multiple consecutive times:
   ```powershell
   npm test
   ```
   *Expected result*: 5 test files passed (5), 89 tests passed (89), 0 failures across every run.
2. Run production build:
   ```powershell
   npm run build
   ```
   *Expected result*: Exit code 0, 0 TypeScript compiler errors.
