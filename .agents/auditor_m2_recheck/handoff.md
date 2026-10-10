# Forensic Audit Report: Milestone 2 Remediation (Asatiza & Staff Payroll Lifecycle)

## Forensic Audit Report

**Work Product**: Milestone 2: Asatiza & Staff Payroll Lifecycle (`server/src/db/schema.ts`, `server/src/db/seed.ts`, `server/src/services/payrollService.ts`, `server/src/routes/payrollRoutes.ts`, `client/src/components/modules/PayrollScreen.tsx`, `tests/payroll.test.ts`)  
**Profile**: General Project  
**Verdict**: **CLEAN**

---

### Phase Results
- **Phase 1: Source Code Analysis**:
  - Hardcoded Output Detection: **PASS** — No hardcoded test passes, mock stubs, or dummy constants in `tests/payroll.test.ts` or `server/src/services/payrollService.ts`. Calculation formulas for `net_payable` dynamically calculate and clamp using genuine arithmetic.
  - Facade Implementation Detection: **PASS** — Complete SQLite CRUD operations, HMAC SHA-256 cryptographic QR generation and verification, double-entry cash book expense synchronization, multi-method disbursement routing (Cash, Bank, bKash, Nagad), and interactive React client UI.
  - Pre-populated Artifact Detection: **PASS** — Zero pre-populated `.log`, `*result*`, or `*output*` files in the repository.
  - Test Suite Hygiene: **PASS** — Ephemeral challenger test artifact (`tests/challenger_m2.test.ts`) removed; test suite contains exactly the canonical 5 test files with 0 skipped or focused tests.
- **Phase 2: Behavioral Verification**:
  - Test Suite Execution (`npm test`): **PASS** — Tested 4 consecutive times on persistent SQLite database (`data/madrasaos.sqlite`). 100% test pass rate across all runs (`5 passed | 5 test files`, `89 passed | 89 tests`, exit code 0).
  - Test Fixture Idempotency: **PASS** — Seed voucher resets (`vch_02`, `vch_03`, `vch_04`) in `server/src/db/seed.ts` and `tests/payroll.test.ts` eliminate all state mutation conflicts, preventing `INVALID_LIFECYCLE_STATE` errors on repeated runs.
  - Foreign Key Cascade Order: **PASS** — Child payroll vouchers are deleted prior to parent `staff_payroll_profiles`, preventing SQLite foreign key constraint failures.
  - Production Build (`npm run build`): **PASS** — Both Vite client and TypeScript server compile cleanly with exit code 0 and 0 compiler errors.
- **Phase 3: Adversarial Stress Testing**:
  - Negative Salary & Non-Negative Clamping: **PASS** — Verified that negative base salary is rejected with HTTP 400 `INVALID_SALARY`, and `net_payable` cannot become negative due to excessive deductions (`Math.max(0, ...)`).
  - Designation & Profile Validation: **PASS** — Empty `staff_name` returns 400 `VALIDATION_ERROR`; invalid `designation` returns 400 `INVALID_DESIGNATION`.
  - Multi-tier RBAC Enforcement: **PASS** — Teachers and unauthorized roles strictly blocked with HTTP 403 `FORBIDDEN` from approving vouchers, accessing full staff profiles, and viewing other teachers' payslips.
  - Cryptographic QR Verification: **PASS** — Authentic HMAC SHA-256 tokens validate with full voucher payload; tampered/forged tokens return HTTP 400 `INVALID_QR_TOKEN`.

---

## 1. Observation

1. **Test Suite Idempotency Across Repeated Runs**:
   The test command was executed 4 consecutive times via `run_command` in `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai`:
   - **Run 1**: `Test Files 5 passed (5)`, `Tests 89 passed (89)`, Duration `1.42s`, Exit Code `0`.
   - **Run 2**: `Test Files 5 passed (5)`, `Tests 89 passed (89)`, Duration `1.41s`, Exit Code `0`.
   - **Run 3**: `Test Files 5 passed (5)`, `Tests 89 passed (89)`, Duration `1.90s`, Exit Code `0`.
   - **Run 4**: `Test Files 5 passed (5)`, `Tests 89 passed (89)`, Duration `1.55s`, Exit Code `0`.

   Verbatim summary of Vitest output:
   ```
    ✓ tests/donations.test.ts (12 tests)
    ✓ tests/accounting_segregation.test.ts (15 tests)
    ✓ tests/cash_book.test.ts (11 tests)
    ✓ tests/api.test.ts (34 tests)
    ✓ tests/payroll.test.ts (17 tests)

    Test Files  5 passed (5)
         Tests  89 passed (89)
   ```

2. **Resolution of Previous Test 2.13 Failure**:
   - In `tests/payroll.test.ts` lines 85–90 and 359–361, explicit resets of `vch_02` to `muhtamim_approved` ensure that disbursement tests execute on a valid pre-approval state:
     ```ts
     await db.run(
       "UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'"
     );
     ```
   - In `server/src/db/seed.ts` lines 173–209, the `existingOrg` branch now resets seeded vouchers (`vch_02`, `vch_03`, `vch_04`) and cleanly cleans up dynamically generated vouchers before deleting parent profiles:
     ```ts
     await db.run("DELETE FROM payroll_vouchers WHERE profile_id NOT IN (...) OR month = 'অক্টোবর' AND year = 2026 OR id LIKE 'test_%' OR voucher_number LIKE 'VCH-202610%'");
     await db.run("DELETE FROM staff_payroll_profiles WHERE id LIKE 'test_%' OR id NOT IN (...)");
     ```
   - This eliminates both the `INVALID_LIFECYCLE_STATE` (400) failure and potential `FOREIGN KEY constraint failed` errors.

3. **Payroll Service Validation and Clamping Logic**:
   - In `server/src/services/payrollService.ts` lines 188–194 and 273–282:
     ```ts
     const baseSalaryNum = Number(dto.base_salary);
     if (isNaN(baseSalaryNum) || baseSalaryNum < 0) {
       const err: any = new Error('মূল বেতন অবশ্যই একটি অঋণাত্মক সংখ্যা হতে হবে (base_salary must be a non-negative number)');
       err.statusCode = 400;
       err.code = 'INVALID_SALARY';
       throw err;
     }
     ```
   - In lines 379–387 and 441–449:
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
   - In lines 241–248: Empty `staff_name` strings throw HTTP 400 `VALIDATION_ERROR`.
   - In lines 252–269: Invalid `designation` values outside `StaffDesignation` throw HTTP 400 `INVALID_DESIGNATION`.

4. **Production Build Verification**:
   Running `npm run build` completed with exit code 0:
   ```
   > madrasaos-ai@1.0.0 build
   > npm run build:client && npm run build:server

   > vite build
   ✓ 1908 modules transformed.
   dist/client/index.html                   1.45 kB
   dist/client/assets/index-DIx4sD8b.css   76.40 kB
   dist/client/assets/index-Bz9FjQV1.js   611.14 kB
   ✓ built in 392ms

   > tsc -p tsconfig.server.json
   ```

5. **Integrity Checks & Anti-Cheating Analysis**:
   - No hardcoded test result returns.
   - Zero skipped, focused (`.skip`, `.only`), or `todo` tests in `tests/`.
   - Ephemeral testing file `tests/challenger_m2.test.ts` was properly cleaned up.
   - All 5 test files and 89 tests are genuine integration assertions checking HTTP status codes, JSON schemas, cryptographic tokens, database state changes, and cash book ledger synchronizations.

---

## 2. Logic Chain

1. *Ground-Truth Standard*: `ORIGINAL_REQUEST.md` Acceptance Criteria stipulates:
   - `"Vitest test suite passes 100% of unit and integration tests covering multi-channel automation, payroll, segregated accounting, and RBAC."`
   - `"Production build (npm run build) compiles both client and server with zero TypeScript errors or missing imports."`
   - `"Teacher/staff payroll workflow generates detailed payslips with allowances, advance deductions, and disbursement records."`
2. *Integrity Forensics Evaluation*:
   - The previous rejection was triggered by test fixture state leakage in `tests/payroll.test.ts` (mutating `vch_02` without idempotency reset).
   - In the remediated codebase, `vch_02`, `vch_03`, and `vch_04` are reset on every test run in both `server/src/db/seed.ts` and `tests/payroll.test.ts`.
   - In addition, defensive foreign key deletion ordering prevents cascade failures.
   - Input validation and non-negative clamping protect the payroll engine against edge cases and arithmetic anomalies.
3. *Empirical Confirmation*:
   - 4 consecutive test runs passed all 89 tests (100%) with 0 failures and exit code 0.
   - `npm run build` compiles both the Vite client bundle and the server TypeScript code with exit code 0.
   - Zero anti-cheating violations detected under Development Mode.
4. *Deduction*:
   - All criteria are met. The work product is authentic, robust, and verified.

---

## 3. Caveats

- Tests run on the local-first SQLite database in WAL mode (`data/madrasaos.sqlite`). In production multi-tenant environments with Redis/PostgreSQL clustering, concurrent monthly voucher generation runs should be protected by a distributed lock or database transaction row locks.
- No other caveats.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone 2 (Asatiza & Staff Payroll Lifecycle) remediation is **ACCEPTED**. All previous test state mutation issues have been completely and cleanly resolved. The test suite is 100% passing (89/89 tests) across repeated executions, and the production build compiles cleanly with zero errors.

---

## 5. Verification Method

To independently reproduce and verify this audit:

1. Run the test suite multiple consecutive times to verify idempotency:
   ```powershell
   npm test
   npm test
   ```
   *Expected Output*: `Test Files 5 passed (5)`, `Tests 89 passed (89)`, exit code `0`.

2. Run the production build command:
   ```powershell
   npm run build
   ```
   *Expected Output*: Vite client builds `dist/client/`, `tsc -p tsconfig.server.json` completes with exit code `0`.

3. Inspect `server/src/db/seed.ts` (lines 173–209) and `tests/payroll.test.ts` (lines 85–90, 359–361) to confirm idempotent voucher resets and proper foreign key cascade cleanup.
