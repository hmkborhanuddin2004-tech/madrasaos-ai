# Forensic Audit Report: Milestone 2 (Asatiza & Staff Payroll Lifecycle)

## Forensic Audit Report

**Work Product**: Milestone 2: Asatiza & Staff Payroll Lifecycle (`server/src/db/schema.ts`, `server/src/services/payrollService.ts`, `server/src/routes/payrollRoutes.ts`, `client/src/components/modules/PayrollScreen.tsx`, `tests/payroll.test.ts`)  
**Profile**: General Project  
**Verdict**: **INTEGRITY VIOLATION**

---

### Phase Results
- **Phase 1: Source Code Analysis**:
  - Hardcoded Output Detection: **PASS** — No hardcoded test outputs or fake bypasses found in `payrollService.ts`. Calculation formula `net_payable = base_salary + housing_allowance + food_allowance + bonus_allowance - advance_loan_deduction - absent_deduction` is genuine.
  - Facade Implementation Detection: **PASS** — Fully authentic SQLite queries, CRUD operations, HMAC SHA-256 token verification, double-entry cash book expense logging, and interactive React UI.
  - Pre-populated Artifact Detection: **PASS** — No stale or pre-populated `.log` or output files found in the workspace.
- **Phase 2: Behavioral Verification**:
  - Production Build (`npm run build`): **PASS** — Vite client bundle and server `tsc` compile cleanly with exit code 0.
  - Test Suite Execution (`npm test`): **FAIL** — Vitest test execution failed with exit code 1 (`1 failed | 4 passed (5) test files`, `1 failed | 88 passed (89) tests`). Test 2.13 failed with `AssertionError: expected 400 to be 200`.
  - Claim Verification vs. Reality: **FAIL** — Worker handoff (`worker_m2_1/handoff.md`) claimed 100% pass rate (`Test Files 5 passed (5)`, `Tests 89 passed (89)`), which contradicts the actual test suite output on the project's persistent SQLite database.

---

## 1. Observation

1. **Test Execution Failure**:
   Running `npm test` via `run_command` in `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai` produced:
   ```
   FAIL  tests/payroll.test.ts > Milestone 2: Asatiza & Staff Payroll Lifecycle > 2.13 Cash disbursement integrates into expense ledgers and daily cash book
   AssertionError: expected 400 to be 200 // Object.is equality

   - Expected
   + Received

   - 200
   + 400

    ❯ tests/payroll.test.ts:322:28
       320|       });
       321|
       322|     expect(resCash.status).toBe(200);
          |                            ^
       323|     expect(resCash.body.data.status).toBe('disbursed');
       324|     expect(resCash.body.data.disbursement_method).toBe('cash');

    Test Files  1 failed | 4 passed (5)
         Tests  1 failed | 88 passed (89)
      Duration  1.27s
   ```
   Verbatim error logged to stderr:
   ```
   stderr | tests/payroll.test.ts > Milestone 2: Asatiza & Staff Payroll Lifecycle > 2.13 Cash disbursement integrates into expense ledgers and daily cash book
   [ERROR] [req_f2cae9dc] POST /api/v1/payroll/vouchers/vch_02/disburse: Error: পরিশোধ করার পূর্বে ভাউচারটি অবশ্যই মুহতামিম কর্তৃক অনুমোদিত হতে হবে (বর্তমান অবস্থা: 'disbursed')।
       at PayrollService.disburseVoucher (C:/Users/assdi/.gemini/antigravity/scratch/madrasaos-ai/server/src/services/payrollService.ts:531:24)
       at C:/Users/assdi/.gemini/antigravity/scratch/madrasaos-ai/server/src/routes/payrollRoutes.ts:241:21 {
     statusCode: 400,
     code: 'INVALID_LIFECYCLE_STATE'
   }
   ```

2. **Root Cause Analysis in Source Code**:
   - In `tests/payroll.test.ts` lines 312–325:
     ```ts
     // Test 2.13
     it('2.13 Cash disbursement integrates into expense ledgers and daily cash book', async () => {
       // First approve vch_02 (which is already muhtamim_approved in seed)
       const resCash = await request(app)
         .post(`/api/v1/payroll/vouchers/vch_02/disburse`)
         .set('Authorization', `Bearer ${accountantToken}`)
         .send({
           disbursement_method: 'cash',
           transaction_reference: 'VCH_CASH_SAL_OCT_01'
         });

       expect(resCash.status).toBe(200);
     ```
   - In `server/src/db/seed.ts` lines 128–164 (`seedM2PayrollIfEmpty`):
     ```ts
     const existingVouchers = await db.get('SELECT id FROM payroll_vouchers LIMIT 1');
     if (!existingVouchers) {
       // Only seeds if table is empty!
     }
     ```
   - In `server/src/db/seed.ts` lines 170–210 (`seedDatabase`):
     When `existingOrg` is true (existing SQLite database file `data/madrasaos.sqlite`), `seedDatabase()` resets workflow approvals (`appr_demo_01`), but does NOT reset `vch_02`'s status back to `'muhtamim_approved'`.
   - Once test 2.13 executes the first time, `vch_02` is updated to `'disbursed'`.
   - On subsequent test runs (or when any developer/CI agent executes `npm test`), `vch_02` is already in status `'disbursed'`, causing `payrollService.disburseVoucher` to enforce its strict lifecycle guard (line 530 of `payrollService.ts`) and reject the request with HTTP 400 `INVALID_LIFECYCLE_STATE`.

3. **Claimed Verification vs. Actual Execution**:
   In `worker_m2_1/handoff.md`:
   - Line 24: `- npm test: Output: Test Files 5 passed (5), Tests 89 passed (89), Duration 1.62s.`
   - Line 46: `npm test` -> `Expected output: 5 test files passed, 89 passed tests, 0 failures.`
   Actual execution:
   `Test Files 1 failed | 4 passed (5)`, `Tests 1 failed | 88 passed (89)`.

4. **Production Build**:
   Running `npm run build` completed with code 0:
   - Client bundle built via Vite: `dist/client/index.html` (1.45 kB), `dist/client/assets/index-Bz9FjQV1.js` (611.14 kB).
   - Server compiled via `tsc -p tsconfig.server.json` with 0 errors.

---

## 2. Logic Chain

1. *Ground-truth Constraint*: `ORIGINAL_REQUEST.md` Acceptance Criteria specifies:
   `"Vitest test suite passes 100% of unit and integration tests covering multi-channel automation, payroll, segregated accounting, and RBAC."`
2. *Integrity Forensics Standard*: Integrity Forensics Behavioral Verification Check 4 dictates:
   `"Build the project from source and run its test suite. The build must succeed and tests must execute — a project that doesn't build or whose tests don't run is automatically flagged."`
   `"If ANY check fails, the verdict is INTEGRITY VIOLATION and the work product must be rejected."`
3. *Empirical Finding*: Running `npm test` fails with code 1. Specifically, `tests/payroll.test.ts` test 2.13 fails with `AssertionError: expected 400 to be 200`.
4. *Non-Idempotent Test Fixture Mutation*: Test 2.13 mutates seeded voucher `vch_02` from `'muhtamim_approved'` to `'disbursed'`. Neither `tests/payroll.test.ts` nor `seedDatabase()` resets this status upon re-execution. As a result, the test suite is non-idempotent and broken on consecutive runs against the local SQLite database.
5. *Auditor Constraint*: As an integrity auditor, the agent must not fix implementation code. The failure must be reported directly as an integrity violation, and the work product must be rejected.

---

## 3. Caveats

- The core business logic in `server/src/services/payrollService.ts`, `server/src/routes/payrollRoutes.ts`, `server/src/db/schema.ts`, and `client/src/components/modules/PayrollScreen.tsx` is genuinely and rigorously implemented. There are no dummy facades or fake calculations.
- The failure is isolated to test fixture state management: test 2.13 relies on `vch_02` being in `'muhtamim_approved'` status, but test re-execution finds it in `'disbursed'` status from the previous run.

---

## 4. Conclusion

**Verdict: INTEGRITY VIOLATION**

Milestone 2 cannot be accepted in its current state because the automated test suite fails (`1 failed test in tests/payroll.test.ts`). The work product is **REJECTED** and returned to the worker for remediation.

### Required Worker Fix:
To make the test suite idempotent and repeatable across all test runs:
1. In `server/src/db/seed.ts` inside `seedDatabase()`, when resetting existing database records, reset `vch_02` to `'muhtamim_approved'`:
   ```ts
   await db.run("UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursed_at = NULL, disbursement_method = NULL WHERE id = 'vch_02'");
   ```
   **OR** in `tests/payroll.test.ts` (e.g. in a `beforeEach` hook or within test 2.13), dynamically draft and approve a voucher before testing cash disbursement, rather than mutating the static seed voucher without resetting it.
2. Verify that running `npm test` multiple times consecutively passes all 89 tests with 0 failures.

---

## 5. Verification Method

To reproduce and verify the finding independently:

1. Execute the test command:
   ```powershell
   npm test
   ```
2. Observe test failure output:
   - Target test: `tests/payroll.test.ts > 2.13 Cash disbursement integrates into expense ledgers and daily cash book`
   - Received HTTP status: `400 Bad Request` (`INVALID_LIFECYCLE_STATE`)
   - Expected HTTP status: `200 OK`
3. Verify that once `vch_02` is reset or dynamically generated, all 89 tests pass across 5 test files.
