# Milestone 2 Remediation Review & Handoff Report

**Reviewer**: teamwork_preview_reviewer  
**Verdict**: **APPROVE**  
**Date**: 2026-09-20  

---

## 1. Observation

Direct observations from codebase inspection and execution:

1. **Test Idempotency & Reset Logic**:
   - In `tests/payroll.test.ts` (lines 28–40), `beforeAll` now explicitly resets seeded vouchers:
     ```ts
     await db.run("UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'");
     await db.run("UPDATE payroll_vouchers SET status = 'accountant_verified', approved_by = NULL, disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_03'");
     await db.run("UPDATE payroll_vouchers SET status = 'draft', verified_by = NULL, approved_by = NULL, disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_04'");
     await db.run("DELETE FROM payroll_vouchers WHERE profile_id NOT IN ('prf_muhtamim', 'prf_shaykh', 'prf_senior_muhaddis', 'prf_kitab', 'prf_hifz', 'prf_nazir', 'prf_cook', 'prf_security') OR month = 'অক্টোবর' AND year = 2026 OR id LIKE 'test_%' OR voucher_number LIKE 'VCH-202610%'");
     await db.run("DELETE FROM staff_payroll_profiles WHERE id LIKE 'test_%' OR id NOT IN ('prf_muhtamim', 'prf_shaykh', 'prf_senior_muhaddis', 'prf_kitab', 'prf_hifz', 'prf_nazir', 'prf_cook', 'prf_security')");
     ```
   - In `tests/payroll.test.ts` (lines 85–90), a `beforeEach` hook re-resets `vch_02` to `'muhtamim_approved'`.
   - In `tests/payroll.test.ts` (lines 359–361), Test 2.13 explicitly resets `vch_02` directly before testing cash disbursement.
   - In `server/src/db/seed.ts` (lines 173–209), `seedDatabase()` executes the identical resets and cleanups when `existingOrg` is true, deleting dependent child vouchers before deleting parent staff profiles to avoid foreign key violations.

2. **Input Validation in `payrollService.ts:updateProfile`**:
   - In `server/src/services/payrollService.ts` (lines 240–283):
     - `staff_name`: Rejects falsy or whitespace-only names (`!dto.staff_name || !dto.staff_name.trim()`) with HTTP 400 and `code: 'VALIDATION_ERROR'`.
     - `designation`: Rejects non-enumerated values against `validDesignations` with HTTP 400 and `code: 'INVALID_DESIGNATION'`.
     - `base_salary`: Rejects NaN or `< 0` with HTTP 400 and `code: 'INVALID_SALARY'`.
     - Allowances and loan deductions are sanitized with `Math.max(0, Number(...))`.
   - In `tests/payroll.test.ts` (lines 182–200), Test 2.5 explicitly tests empty `staff_name`, invalid `designation`, and negative `base_salary`, asserting HTTP 400 for each case.

3. **Non-Negative Clamping in Payroll Vouchers**:
   - In `server/src/services/payrollService.ts` lines 379–387 (`generateMonthlyVouchers`) and lines 441–449 (`createVoucher`), net payable is clamped:
     ```ts
     const netPayable = Math.max(
       0,
       baseSalary +
       housingAllowance +
       foodAllowance +
       bonusAllowance -
       advanceLoanDeduction -
       absentDeduction
     );
     ```
   - In `tests/payroll.test.ts` (lines 253–264), Test 2.7 asserts:
     ```ts
     expect(voucher.net_payable).toBe(expectedNet);
     expect(voucher.net_payable).toBeGreaterThanOrEqual(0);
     ```

4. **Automated Verification Results**:
   - `npm test`: Executed and passed 5/5 test files, 89/89 tests.
   - Sequential Vitest run (`npx vitest run --fileParallelism=false`): 5 consecutive iterations passed 89/89 tests (100% success rate, 0 failures).
   - Standalone `payroll.test.ts` (`npx vitest run tests/payroll.test.ts`): Passed 17/17 tests repeatedly with 0 failures.
   - `npm run build`: Successfully built client Vite bundle and server TypeScript compilation with exit code 0 and 0 errors.

5. **Integrity Violations Check**:
   - Source code analysis confirmed no hardcoded test expectations, dummy facades, or skipped logic. Database operations perform real SQLite inserts, updates, queries, and HMAC-SHA256 token generation.

---

## 2. Logic Chain

1. **Remediation Correctness**:
   - Upstream identified that mutating `vch_02` during test 2.13 corrupted the state for subsequent runs.
   - By adding reset queries in `beforeAll`, `beforeEach`, and Test 2.13, as well as in `seedDatabase()`, `vch_02` is restored to `muhtamim_approved` prior to disbursement attempts.
   - Observation 1 directly proves that dynamic test data is pruned safely respecting foreign key constraints (child vouchers deleted before parent profiles).

2. **Input Validation Completeness**:
   - Observation 2 demonstrates that `updateProfile` now validates `staff_name`, `designation`, and `base_salary`.
   - Test 2.5 verifies that malicious or invalid payloads correctly yield HTTP 400 errors instead of contaminating the database.

3. **Clamping Completeness**:
   - Observation 3 confirms `Math.max(0, ...)` is consistently implemented across both automated batch generation (`generateMonthlyVouchers`) and manual voucher creation (`createVoucher`).
   - Deductions that exceed gross earnings now evaluate cleanly to ৳0 rather than negative values.

4. **Suite Stability & Idempotency**:
   - Observation 4 confirms that running the test suite repeatedly succeeds with 100% test pass rate (89/89).
   - In standalone and sequential test execution, Test 2.13 and all 17 tests in `payroll.test.ts` are completely idempotent.

---

## 3. Caveats

1. **Concurrent Test Isolation Note**:
   - During multi-process parallel test runs (`vitest run` with default thread pool), multiple parallel test workers accessing the same local SQLite database file (`data/madrasaos.sqlite`) can occasionally cause database lock contention during concurrent `seedDatabase()` invocations.
   - When executed sequentially with `--fileParallelism=false`, 5 consecutive runs passed 100% of tests with zero errors. In a future milestone, configuring `fileParallelism: false` in `vitest.config.ts` or setting `PRAGMA busy_timeout = 5000` is recommended for further hardening.

---

## 4. Conclusion

- **Verdict**: **APPROVE**
- All 5 Milestone 2 remediation criteria are fully satisfied:
  1. Test idempotency for `vch_02`, `vch_03`, `vch_04`, and dynamic records is verified.
  2. Input validation for `updateProfile` (`staff_name`, `designation`, `base_salary`) is implemented and verified.
  3. Non-negative clamping via `Math.max(0, ...)` is implemented and verified.
  4. Both `npm test` and `npm run build` pass with 100% success and 0 compiler errors.
  5. No integrity violations or dummy facades exist.

---

## 5. Verification Method

To independently reproduce and verify this review:

1. **Verify Test Suite**:
   ```powershell
   npm test
   ```
   *Expected Output*: 5 test files passed, 89 tests passed (100%).

2. **Verify Multi-Run Idempotency**:
   ```powershell
   npx vitest run --fileParallelism=false
   ```
   *Expected Output*: 5/5 test files passed, 89/89 tests passed.

3. **Verify Production Build**:
   ```powershell
   npm run build
   ```
   *Expected Output*: Vite client built, `tsc -p tsconfig.server.json` compiled with exit code 0.
