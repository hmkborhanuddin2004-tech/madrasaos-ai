# Adversarial Challenge Handoff Report: Milestone 2 (Asatiza & Staff Payroll Lifecycle)

## 1. Observation

### 1.1 Test Suite Execution Failure (`npm test`)
- Command: `npm test`
- Exit Code: `1`
- Output:
  ```text
  stderr | tests/payroll.test.ts > Milestone 2: Asatiza & Staff Payroll Lifecycle > 2.13 Cash disbursement integrates into expense ledgers and daily cash book
  [ERROR] [req_df87982c] POST /api/v1/payroll/vouchers/vch_02/disburse: Error: পরিশোধ করার পূর্বে ভাউচারটি অবশ্যই মুহতামিম কর্তৃক অনুমোদিত হতে হবে (বর্তমান অবস্থা: 'disbursed')।
      at PayrollService.disburseVoucher (C:/Users/assdi/.gemini/antigravity/scratch/madrasaos-ai/server/src/services/payrollService.ts:531:24)
      at C:/Users/assdi/.gemini/antigravity/scratch/madrasaos-ai/server/src/routes/payrollRoutes.ts:241:21 {
    statusCode: 400,
    code: 'INVALID_LIFECYCLE_STATE'
  }

  FAIL tests/payroll.test.ts > Milestone 2: Asatiza & Staff Payroll Lifecycle > 2.13 Cash disbursement integrates into expense ledgers and daily cash book
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
  ```
- File & Line: `tests/payroll.test.ts:312-324`:
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
- Seeding logic in `server/src/db/seed.ts:128-129`:
  ```ts
  const existingVouchers = await db.get('SELECT id FROM payroll_vouchers LIMIT 1');
  if (!existingVouchers) { ... }
  ```
  And in `server/src/db/seed.ts:169-210`:
  When `organizations` table already has entries, `seedDatabase()` resets workflow approvals (`UPDATE workflow_approvals SET status = 'pending' ... WHERE id = 'appr_demo_01'`), but does **not** reset `vch_02`'s status back to `'muhtamim_approved'`.
- Persistent SQLite state check:
  `node -e "import('./dist/server/db/db.js').then(async ({db}) => { const r = await db.get('SELECT id, status FROM payroll_vouchers WHERE id = ?', ['vch_02']); console.log('vch_02 status:', r); })"`
  Returned:
  `vch_02 status: { id: 'vch_02', status: 'disbursed' }`

### 1.2 Empirical Invariant Verification (`tests/challenger_m2.test.ts`)
Created and executed an independent adversarial test suite containing 21 tests:
- Command: `npx vitest run tests/challenger_m2.test.ts`
- Result: `21 passed (21)`, Duration 736ms, Exit code `0`.

#### A. Salary Invariant Across Boundary Conditions
1. **Zero allowances** (`base_salary: 15000, housing: 0, food: 0, bonus: 0, advance: 1500, absent: 0`):
   - Result: `net_payable = 13500` (`15000 + 0 + 0 + 0 - 1500 - 0`). PASSED.
2. **Zero deductions** (`base_salary: 25000, housing: 5000, food: 2500, bonus: 1000, advance: 0, absent: 0`):
   - Result: `net_payable = 33500` (`25000 + 5000 + 2500 + 1000 - 0 - 0`). PASSED.
3. **Both zero allowances & zero deductions** (`base_salary: 12000, allowances: 0, deductions: 0`):
   - Result: `net_payable = 12000`. PASSED.
4. **Large deductions exceeding salary** (`base_salary: 10000, housing: 1000, advance: 15000`):
   - Result: `net_payable = -4000` (`10000 + 1000 - 15000`). Math holds strictly. PASSED.

#### B. Lifecycle Invariants
1. Attempt to disburse voucher in `draft` status:
   - Result: HTTP `400 Bad Request`, error code `'INVALID_LIFECYCLE_STATE'`. PASSED.
2. Attempt to disburse voucher in `accountant_verified` status:
   - Result: HTTP `400 Bad Request`, error code `'INVALID_LIFECYCLE_STATE'`. PASSED.
3. Disburse voucher in `muhtamim_approved` status:
   - Result: HTTP `200 OK`, `status: 'disbursed'`. PASSED.
4. Attempt double disbursement on already `disbursed` voucher:
   - Result: HTTP `400 Bad Request`, error code `'INVALID_LIFECYCLE_STATE'`. PASSED.
5. Attempt to approve `draft` voucher directly:
   - Result: HTTP `400 Bad Request`, error code `'INVALID_LIFECYCLE_STATE'`. PASSED.
6. Cash disbursement integration:
   - Result: HTTP `200 OK`, verified daily cash book records `cash_expenses` incremented by `net_payable`. PASSED.

#### C. RBAC Security Boundaries
1. Teacher accessing `GET /api/v1/payroll/vouchers`:
   - Result: HTTP `403 Forbidden`, `error.code: 'FORBIDDEN'`. PASSED.
2. Hifz Teacher accessing `GET /api/v1/payroll/vouchers`:
   - Result: HTTP `403 Forbidden`, `error.code: 'FORBIDDEN'`. PASSED.
3. Student accessing `GET /api/v1/payroll/vouchers`:
   - Result: HTTP `403 Forbidden`. Unauthenticated access: HTTP `401 Unauthorized`. PASSED.
4. Teacher creating payroll profile (`POST /api/v1/payroll/profiles`):
   - Result: HTTP `403 Forbidden`. PASSED.
5. Teacher generating monthly vouchers (`POST /api/v1/payroll/vouchers/generate-monthly`):
   - Result: HTTP `403 Forbidden`. PASSED.
6. Teacher disbursing vouchers (`POST /api/v1/payroll/vouchers/:id/disburse`):
   - Result: HTTP `403 Forbidden`. PASSED.

#### D. QR Token Cryptographic Tampering
1. Authentic HMAC token against `GET /api/v1/payroll/vouchers/verify-qr/:token`:
   - Result: HTTP `200 OK`, `valid: true`, full payload returned. PASSED.
2. Fake random 64-character hex token:
   - Result: HTTP `400 Bad Request`, `error.code: 'INVALID_QR_TOKEN'`. PASSED.
3. Bit-flipped / single-character altered token:
   - Result: HTTP `400 Bad Request`, `error.code: 'INVALID_QR_TOKEN'`. PASSED.
4. Truncated token (16 characters):
   - Result: HTTP `400 Bad Request`, `error.code: 'INVALID_QR_TOKEN'`. PASSED.
5. SQL injection string payload (`' OR '1'='1' -- `):
   - Result: HTTP `400 Bad Request`, safely rejected without SQL syntax error. PASSED.

### 1.3 Build Verification
- Command: `npm run build`
- Result: Code `0`, 0 TypeScript compiler errors. Client bundle built in 383ms.

---

## 2. Logic Chain

1. **Test Idempotency Failure**:
   - In `tests/payroll.test.ts:312`, test 2.13 calls `POST /api/v1/payroll/vouchers/vch_02/disburse`.
   - This transitions seeded record `vch_02` from `'muhtamim_approved'` to `'disbursed'` in the local SQLite database (`data/madrasaos.sqlite`).
   - `server/src/db/seed.ts` only seeds `payroll_vouchers` if `SELECT id FROM payroll_vouchers LIMIT 1` is null (lines 128-129).
   - Because rows already exist, `seedM2PayrollIfEmpty()` returns without resetting `vch_02`.
   - On every subsequent test execution, `vch_02` is already in state `'disbursed'`.
   - `payrollService.disburseVoucher()` line 530 strictly requires `voucher.status === 'muhtamim_approved'`, returning HTTP `400 Bad Request` with message `পরিশোধ করার পূর্বে ভাউচারটি অবশ্যই মুহতামিম কর্তৃক অনুমোদিত হতে হবে (বর্তমান অবস্থা: 'disbursed')`.
   - Therefore, `tests/payroll.test.ts` fails with `AssertionError: expected 400 to be 200`.
   - Because `npm test` runs `vitest run`, the entire test command exits with non-zero exit code `1`.
   - Acceptance Criteria §Automated Testing & Build states: `Vitest test suite passes 100% of unit and integration tests`.
   - Claim from `worker_m2_1/handoff.md` (`npm test: 5 test files passed, 89 passed tests, 0 failures`) is invalidated on any non-fresh run.

2. **Core Invariant Implementation Soundness**:
   - In isolation, the implementation of all four required invariants (`salary formula`, `lifecycle states`, `RBAC security`, `HMAC QR validation`) is correct, robust, and empirically proven across 21 adversarial tests in `tests/challenger_m2.test.ts`.
   - However, a test suite that breaks on rerun prevents CI/CD pipelines and regression detection from functioning.

---

## 3. Caveats

- Implementation code was strictly not modified by this agent per review-only constraints.
- Front-end React printing layout was audited visually in code (`PayrollScreen.tsx`), but browser print dialogs were not automated via headless browser.

---

## 4. Conclusion

**Verdict: REJECT**

While the core payroll business logic and security boundaries are well-constructed, Milestone 2 is **REJECTED** due to a critical regression in test suite integrity:
- `npm test` exits with code `1` (1 failure in `tests/payroll.test.ts:322`).
- The test suite is non-idempotent and fails on repeated runs.

### Remediation Required for Worker (`worker_m2_1`):
1. **Fix Test Idempotency in `server/src/db/seed.ts`**:
   In `seedDatabase()` (around line 171 where `appr_demo_01` is reset), add an explicit reset for seeded payroll vouchers:
   ```ts
   await db.run("UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'");
   ```
   *OR*
2. **Fix in `tests/payroll.test.ts` (Test 2.13)**:
   In test 2.13, generate or approve a fresh voucher specifically for the cash disbursement test (or reset `vch_02`'s status before disbursing it), rather than mutating a shared seeded voucher that is not restored.
3. Verify that `npm test` passes cleanly when run multiple consecutive times.

---

## 5. Verification Method

To independently verify the test failure and all adversarial assertions:

1. **Verify `npm test` Failure**:
   ```powershell
   npm test
   ```
   Observed failure: `FAIL tests/payroll.test.ts > Milestone 2: Asatiza & Staff Payroll Lifecycle > 2.13 Cash disbursement integrates into expense ledgers and daily cash book` (`expected 400 to be 200`).

2. **Verify Adversarial Stress Harness**:
   ```powershell
   npx vitest run tests/challenger_m2.test.ts
   ```
   Observed result: `21 passed (21)` across all 4 mandatory invariant categories.

3. **Verify Production Build**:
   ```powershell
   npm run build
   ```
   Observed result: Clean compilation with code 0.
