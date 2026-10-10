# Review & Adversarial Challenge Report: Milestone 2 (Asatiza & Staff Payroll Lifecycle)

## Review Summary

**Verdict**: **REQUEST_CHANGES**

**Overall Risk Assessment**: **HIGH**

While the core functional architecture of Milestone 2 (types, database schema, Bengali UX, HMAC QR verification, and 3-stage lifecycle state machine) is well-designed and largely complete, independent execution of the test suite (`npm test`) reveals a **deterministic test failure** in `tests/payroll.test.ts` on test 2.13. The test suite mutates persistent SQLite state without resetting fixtures, breaking test repeatability and CI/CD pipelines. In addition, critical validation gaps in `updateProfile` and potential negative `net_payable` underflow were uncovered during adversarial stress-testing.

---

## 1. Observation

### Observation 1.1: Automated Test Failure on Re-Run (`npm test`)
Running `npm test` via `run_command` in `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai` produced an exit code of 1 with 1 test failure:
```
stderr | tests/payroll.test.ts > Milestone 2: Asatiza & Staff Payroll Lifecycle > 2.13 Cash disbursement integrates into expense ledgers and daily cash book
[ERROR] [req_5fe0bbed] POST /api/v1/payroll/vouchers/vch_02/disburse: Error: পরিশোধ করার পূর্বে ভাউচারটি অবশ্যই মুহতামিম কর্তৃক অনুমোদিত হতে হবে (বর্তমান অবস্থা: 'disbursed')।
    at PayrollService.disburseVoucher (C:/Users/assdi/.gemini/antigravity/scratch/madrasaos-ai/server/src/services/payrollService.ts:531:24)
    at C:/Users/assdi/.gemini/antigravity/scratch/madrasaos-ai/server/src/routes/payrollRoutes.ts:241:21 {
  statusCode: 400,
  code: 'INVALID_LIFECYCLE_STATE'
}

 ❯ tests/payroll.test.ts (17 tests | 1 failed) 650ms
   ❯ Milestone 2: Asatiza & Staff Payroll Lifecycle (17)
     ✓ 2.1 Authenticates and acquires tokens for all payroll roles 1ms
     ✓ 2.2 Accountant creates a new staff payroll profile with designation and allowances 6ms
     ✓ 2.3 Rejects profile creation with invalid designation or negative salary 11ms
     ✓ 2.4 Lists staff payroll profiles for authorized accountant 4ms
     ✓ 2.5 Updates an existing staff payroll profile allowances and deductions 6ms
     ✓ 2.6 Generates monthly salary vouchers for active staff profiles 8ms
     ✓ 2.7 Verifies exact net salary calculation formula on drafted vouchers 3ms
     ✓ 2.8 Accountant verifies draft voucher (draft -> accountant_verified) 5ms
     ✓ 2.9 Blocks unauthorized users (teachers, accountants) from approving vouchers 4ms
     ✓ 2.10 Muhtamim / Principal approves verified voucher (accountant_verified -> muhtamim_approved) 5ms
     ✓ 2.11 Premature disbursement strictly rejected with HTTP 400 Bad Request 6ms
     ✓ 2.12 Accountant disburses muhtamim-approved voucher with transaction reference 9ms
     × 2.13 Cash disbursement integrates into expense ledgers and daily cash book 6ms
     ✓ 2.14 Payslip endpoint returns complete voucher payload with HMAC QR token 3ms
     ✓ 2.15 Public QR token verification validates authentic vouchers and rejects forged tokens 4ms
     ✓ 2.16 RBAC: Teachers are strictly blocked from full payroll voucher lists and staff profiles 6ms
     ✓ 2.17 RBAC: Teachers can view own payslips, but are strictly blocked from other teachers payslips 7ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

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
```

### Observation 1.2: Root Cause of Test 2.13 Failure in Code
- In `tests/payroll.test.ts:312-320`:
  ```ts
  it('2.13 Cash disbursement integrates into expense ledgers and daily cash book', async () => {
    // First approve vch_02 (which is already muhtamim_approved in seed)
    const resCash = await request(app)
      .post(`/api/v1/payroll/vouchers/vch_02/disburse`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        disbursement_method: 'cash',
        transaction_reference: 'VCH_CASH_SAL_OCT_01'
      });
  ```
- In `server/src/db/seed.ts:167-210`:
  ```ts
  export async function seedDatabase(): Promise<void> {
    const now = new Date().toISOString();
    const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1');
    if (existingOrg) {
      await db.run("UPDATE workflow_approvals SET status = 'pending', decided_by = NULL, decided_at = NULL WHERE id = 'appr_demo_01'");
      ...
      await seedM2PayrollIfEmpty(now);
      return;
    }
  ```
  And in `server/src/db/seed.ts:128-129`:
  ```ts
  const existingVouchers = await db.get('SELECT id FROM payroll_vouchers LIMIT 1');
  if (!existingVouchers) { ... }
  ```
- In `server/src/services/payrollService.ts:530-537`:
  ```ts
  if (voucher.status !== 'muhtamim_approved') {
    const err: any = new Error(
      `পরিশোধ করার পূর্বে ভাউচারটি অবশ্যই মুহতামিম কর্তৃক অনুমোদিত হতে হবে (বর্তমান অবস্থা: '${voucher.status}')।`
    );
    err.statusCode = 400;
    err.code = 'INVALID_LIFECYCLE_STATE';
    throw err;
  }
  ```
When test 2.13 runs the first time, it mutates seeded voucher `vch_02` from `'muhtamim_approved'` to `'disbursed'`. Because `seedDatabase()` never resets `vch_02` when existing vouchers exist, any subsequent execution of `npm test` finds `vch_02.status === 'disbursed'`, triggering the 400 rejection and failing the test assertion `expect(resCash.status).toBe(200)`.

### Observation 1.3: Production Build Execution (`npm run build`)
Running `npm run build` executed cleanly:
```
> madrasaos-ai@1.0.0 build
> npm run build:client && npm run build:server

> madrasaos-ai@1.0.0 build:client
> vite build
✓ built in 453ms

> madrasaos-ai@1.0.0 build:server
> tsc -p tsconfig.server.json
```
Exit code 0, 0 TypeScript compile errors.

### Observation 1.4: Missing Validation in `updateProfile`
In `server/src/services/payrollService.ts:228-276`:
`createProfile` strictly checks:
```ts
if (!dto.staff_name || !dto.staff_name.trim()) throw err;
if (!dto.designation || !validDesignations.includes(dto.designation)) throw err;
if (isNaN(baseSalary) || baseSalary < 0) throw err;
```
However, `updateProfile` does NOT perform these checks:
```ts
const staffName = dto.staff_name !== undefined ? dto.staff_name.trim() : existing.staff_name;
const designation = dto.designation !== undefined ? dto.designation : existing.designation;
const baseSalary = dto.base_salary !== undefined ? Number(dto.base_salary) : existing.base_salary;
```
If a user updates with `{ base_salary: -5000, designation: 'invalid_role', staff_name: '' }`, it is saved directly without error.

### Observation 1.5: Unbounded Deduction / Negative Net Payable
In `server/src/services/payrollService.ts:338-345`:
```ts
const netPayable =
  baseSalary +
  housingAllowance +
  foodAllowance +
  bonusAllowance -
  advanceLoanDeduction -
  absentDeduction;
```
There is no check ensuring `netPayable >= 0`. If `advanceLoanDeduction + absentDeduction > grossEarnings`, `net_payable` becomes negative.
When disbursed via cash, line 592:
```ts
const newExpenses = (existingCb.cash_expenses || 0) + voucher.net_payable;
```
A negative `net_payable` subtracts from cash expenses and increases the closing balance, distorting the daily cash book.

### Observation 1.6: RBAC Protection Implementation
In `server/src/routes/payrollRoutes.ts`:
- Lines 56-64: `GET /profiles` blocks `['teacher', 'hifz_teacher', 'staff', 'hostel_manager', 'librarian', 'student', 'guardian']` with HTTP 403 Forbidden.
- Lines 153-162: `GET /vouchers` blocks `['teacher', 'hifz_teacher', 'staff', 'hostel_manager', 'librarian', 'student', 'guardian']` with HTTP 403 Forbidden.
- Lines 273-287: `GET /vouchers/:id/payslip` enforces ownership: teachers attempting to view another staff's payslip receive HTTP 403 Forbidden.
- Line 11: `GET /vouchers/verify-qr/:token` is public and validates HMAC SHA-256 signatures.

---

## 2. Logic Chain

1. *Observation 1.1 & 1.2*: Acceptance Criteria §Automated Testing specifies: *"Vitest test suite passes 100% of unit and integration tests covering multi-channel automation, payroll, segregated accounting, and RBAC."*
2. Independent execution of `npm test` fails with code 1 and 1 failing test (`tests/payroll.test.ts:322:28`).
3. The failure occurs because test 2.13 mutates seeded voucher `vch_02` from `'muhtamim_approved'` to `'disbursed'`. The test suite lacks idempotency because neither `seed.ts` nor `tests/payroll.test.ts` resets `vch_02` or uses an independent fixture.
4. Because the test suite cannot be run repeatedly without failure, worker_m2_1's claim that `npm test` passes 89/89 tests is only true on a pristine, freshly deleted database and fails in continuous integration and local regression runs.
5. *Observation 1.4*: In `server/src/services/payrollService.ts`, `updateProfile` fails to validate negative salaries, invalid designations, or empty staff names, creating an asymmetry with `createProfile`.
6. *Observation 1.5*: In `generateMonthlyVouchers`, deductions exceeding gross compensation produce negative `net_payable`, which upon cash disbursement mathematically corrupts `expenses` and `cash_book_daily`.
7. *Observation 1.3 & 1.6*: Architectural design, TypeScript domain types, schema layout, Bengali React UX, and cryptographic HMAC-SHA256 QR code generation are sound and compile cleanly.
8. Therefore, while no intentional fraud or facade bypass was found, the reproducible test failure and data integrity gaps mandate a verdict of **REQUEST_CHANGES**.

---

## 3. Findings

### [Critical] Finding 1: Test Suite Non-Idempotency Breaks `npm test`
- **What**: Test 2.13 fails deterministically with `expected 400 to be 200` on any repeated run of `npm test`.
- **Where**: `tests/payroll.test.ts:312-326` and `server/src/db/seed.ts:167-210`.
- **Why**: Test 2.13 mutates the static seeded voucher `vch_02` to `'disbursed'`. Subsequent test runs do not re-seed or reset `vch_02`, causing `payrollService.disburseVoucher` to reject the transition with HTTP 400 `INVALID_LIFECYCLE_STATE`.
- **Suggestion**:
  - In `server/src/db/seed.ts:171`, add a reset query for seeded vouchers similar to `workflow_approvals`:
    ```ts
    await db.run("UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'");
    ```
    OR in `tests/payroll.test.ts:312`, reset `vch_02` in `beforeEach` or create a dynamic test voucher through draft -> verify -> approve -> disburse.

### [Major] Finding 2: `updateProfile` Bypasses Salary and Designation Validation
- **What**: `updateProfile` allows updating profiles with negative `base_salary`, invalid `designation` strings, or empty `staff_name`.
- **Where**: `server/src/services/payrollService.ts:240-272`.
- **Why**: `createProfile` enforces strict non-negative salary and designation checks, but `updateProfile` accepts any raw input without validation.
- **Suggestion**: Add validation in `updateProfile`:
  ```ts
  if (dto.staff_name !== undefined && !dto.staff_name.trim()) throw new ValidationError('স্টাফের নাম প্রদান আবশ্যক');
  if (dto.designation !== undefined && !validDesignations.includes(dto.designation)) throw new ValidationError('অকার্যকর পদবী');
  if (dto.base_salary !== undefined && (isNaN(Number(dto.base_salary)) || Number(dto.base_salary) < 0)) throw new ValidationError('মূল বেতন অবশ্যই একটি অঋণাত্মক সংখ্যা হতে হবে');
  ```

### [Medium] Finding 3: Missing Underflow Guard for `net_payable`
- **What**: If unexcused absence deductions or loan repayments exceed gross compensation, `net_payable` calculates to a negative number.
- **Where**: `server/src/services/payrollService.ts:338-345` and `server/src/services/payrollService.ts:592`.
- **Why**: Negative net salaries corrupt the expense ledger and daily cash book by reducing expenses and increasing the closing balance.
- **Suggestion**:
  Clamp `netPayable` to at least 0:
  ```ts
  const netPayable = Math.max(0, grossEarnings - totalDeductions);
  ```
  And reject or flag vouchers where deductions exceed earnings.

### [Minor] Finding 4: Blacklist Approach for Role Authorization on Master Endpoints
- **What**: `GET /api/v1/payroll/profiles` and `GET /api/v1/payroll/vouchers` use a role blacklist (`!['teacher', ...].includes(role)`) instead of standard whitelist middleware (`requireRole(...)`).
- **Where**: `server/src/routes/payrollRoutes.ts:56` and `server/src/routes/payrollRoutes.ts:154`.
- **Why**: If a new role is introduced (e.g. `branch_manager`), it will inadvertently gain access to confidential payroll lists.
- **Suggestion**: Use `requireRole('super_admin', 'madrasa_admin', 'accountant', 'principal')`.

---

## 4. Adversarial Challenges

### Challenge 1: Test Suite Mutation Attack
- **Assumption challenged**: Running `seedDatabase()` in test `beforeAll` prepares a clean fixture for the test suite.
- **Attack scenario**: Run `npm test` twice consecutively without manually wiping SQLite.
- **Actual behavior**: Second run fails on test 2.13 with HTTP 400 Bad Request.
- **Blast radius**: Complete CI failure on pull requests and broken development workflow.
- **Mitigation**: Reset mutated seed entities or use isolated test fixtures.

### Challenge 2: Negative Salary Injection via Profile Update
- **Assumption challenged**: Staff compensation is always non-negative.
- **Attack scenario**: Send `PUT /api/v1/payroll/profiles/:id` with `{ base_salary: -20000 }`.
- **Predicted behavior**: Accepted with HTTP 200; next monthly voucher generates negative salary, corrupting accounting ledgers.
- **Mitigation**: Enforce input validation across all profile mutations.

---

## 5. Caveats
- No caveats. All 17 integration tests and source files were inspected directly. No external dependencies or uninspected files influenced this review.

---

## 6. Conclusion
Milestone 2 cannot be approved in its current state because **automated tests fail on execution**. The worker must fix the test non-idempotency issue in `tests/payroll.test.ts` / `server/src/db/seed.ts` and address the validation gaps in `payrollService.ts`.

**Final Verdict**: **REQUEST_CHANGES**

---

## 7. Verification Method
To independently verify resolution:
1. Run `npm test`:
   ```powershell
   npm test
   ```
   **Pass condition**: All 5 test files must pass, with 89/89 tests passing, on both initial AND consecutive executions without deleting `data/madrasaos.sqlite`.
2. Run `npm run build`:
   ```powershell
   npm run build
   ```
   **Pass condition**: Client Vite bundle and server `tsc` compile with exit code 0.
3. Verify that `PUT /api/v1/payroll/profiles/:id` with negative salary or invalid designation returns HTTP 400.
