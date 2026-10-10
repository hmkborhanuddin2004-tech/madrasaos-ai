# Milestone 1: Handoff Report — Test Implementation & Verification Strategy
**From**: Codebase Explorer (`explorer_m1_3`)  
**To**: Orchestrator (`orchestrator_1` / `643bbed0-30b9-40bc-9c5b-226c8019bf72`)  
**Timestamp**: 2026-09-20T09:21:20Z  
**Target Milestone**: Milestone 1 (Segregated Accounting, Fund Isolation & Cash Book)  

---

## 1. Observation

1. **Existing Baseline Test Suite (`tests/api.test.ts`)**:
   - Running `npm test` executed `tests/api.test.ts` (34 tests): 33 passed, 1 failed:
     ```
     FAIL tests/api.test.ts > 6. Finance & Payment Collection > POST /api/v1/finance/payments/collect processes fee payment via bKash
     AssertionError: expected 0 to be greater than 0
     at tests/api.test.ts:258:42
     ```
   - Querying the SQLite database directly revealed:
     `SELECT status, count(*) as cnt FROM fee_invoices GROUP BY status`
     Result: `[ { status: 'paid', cnt: 35 }, { status: 'partially_paid', cnt: 70 } ]`.
     Zero invoices had `status = 'overdue'`.

2. **Database Schema State (`server/src/db/schema.ts:209-243`)**:
   - `fee_invoices` currently lacks the `ledger_type` column (only has `fee_items_json`, `total_amount`, `paid_amount`, `due_amount`, `status`, etc.).
   - Tables `donors`, `donation_receipts`, `bank_accounts`, and `cash_book_daily` do not exist yet in `schema.ts`.

3. **Database Seed Logic (`server/src/db/seed.ts:44-59`)**:
   - `seedDatabase()` has an early-exit check:
     ```typescript
     const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1');
     if (existingOrg) {
       await db.run("UPDATE workflow_approvals SET status = 'pending', decided_by = NULL, decided_at = NULL WHERE id = 'appr_demo_01'");
       ...
       return; // Already seeded
     }
     ```
   - When the database was previously initialized without overdue invoices (or existing overdue invoices were paid), subsequent test runs fail to find any overdue invoices because `seedDatabase()` does not reset overdue invoices upon seeing `existingOrg`.

4. **Finance Service & Routes (`server/src/services/financeService.ts:106-137`, `server/src/routes/financeRoutes.ts:22-65`)**:
   - `financeService.getInvoices()` does not filter by `ledger_type` or `type`.
   - `financeRoutes.ts` does not yet have routes for `POST /api/v1/finance/invoices`, nor donation/cash book endpoints.
   - Idempotency guard for payment collection (`transactionId`) is implemented in `financeService.ts:184-194` and returns HTTP 409 `DUPLICATE_TRANSACTION`.

5. **Test Framework Setup (`package.json`, `vitest.config.ts`)**:
   - Vitest 5.0.1 and Supertest 7.2.2 are installed.
   - `vitest.config.ts` includes `tests/**/*.test.ts` with a 20-second test timeout.

---

## 2. Logic Chain

1. *From Observation 1 & 3*: The test failure in `tests/api.test.ts:258` occurs because `fee_invoices` has 0 records with `status = 'overdue'`. When `seedDatabase()` executes, it detects `existingOrg` and returns early without resetting overdue invoices. Therefore, the backend implementer must update the `existingOrg` branch in `seed.ts` to ensure at least 15 invoices are reset to `overdue`. Furthermore, all newly designed Milestone 1 tests must create their own dedicated invoices and fixtures to be fully independent and resilient.
2. *From Observation 2 & 4*: To satisfy Milestone 1 Acceptance Criteria (§R1.1, §R1.3, §R1.4, Acceptance Criteria §Accountant), three dedicated test suites are required:
   - `tests/accounting_segregation.test.ts`: Requires `POST /api/v1/finance/invoices` supporting `ledger_type: 'residential' | 'non_residential'`, and `GET /api/v1/finance/invoices?type=residential|non_residential` to guarantee strict segregation without cross-fund leakage.
   - `tests/donations.test.ts`: Requires `POST /api/v1/finance/donations/donors`, `POST /api/v1/finance/donations/receipts` supporting `lillah_orphan`, `general`, and `waqf_construction`, and `GET /api/v1/finance/donations/funds/summary` ensuring mathematical fund isolation.
   - `tests/cash_book.test.ts`: Requires `POST /api/v1/finance/bank-accounts`, `POST /api/v1/finance/cash-book/bank-deposits`, and `GET /api/v1/finance/cash-book/daily?date=YYYY-MM-DD` validating the formula $Closing = Opening + Collections - Expenses - BankDeposits$.
3. *From Observation 5*: Vitest executes test suites against a shared SQLite database in WAL mode. By using unique transaction IDs (`TRX_${Date.now()}`), unique receipt numbers (`RCP-${Date.now()}`), and isolated date partitions (`2026-10-05`), each test suite executes predictably without race conditions or fixture contamination.

---

## 3. Caveats

- **Payload Casing**: Express handlers may receive camelCase (`ledgerType`, `feeItems`, `dueDate`) or snake_case (`ledger_type`, `fee_items`, `due_date`). Test cases in `plan.md` emphasize testing standard snake_case from `PROJECT.md` contracts while specifying that backend handlers should accept both for developer ergonomics.
- **Cash Book Opening Balance**: On day 1 of a freshly seeded system, opening balance may be 0. The test asserts $Closing = Opening + Collections - Expenses - BankDeposits$ rather than hardcoding a non-zero opening balance, and verifies day-to-day continuity ($Opening_{Day\,N+1} = Closing_{Day\,N}$).
- **Concurrency**: If Vitest runs test files in parallel across worker threads, multiple connections write to `data/madrasaos.sqlite`. If SQLite locking occurs, `vitest.config.ts` may need `fileParallelism: false` or `poolOptions: { threads: { singleThread: true } }`.

---

## 4. Conclusion

A comprehensive, fully articulated test strategy has been formulated and documented in `plan.md`:
- **3 New Test Files Defined**:
  1. `tests/accounting_segregation.test.ts` (15 test cases covering residential vs non-residential invoice generation, line item validation, ledger retrieval isolation, partial/full payment lifecycles, duplicate transaction 409 conflict, and teacher/student RBAC).
  2. `tests/donations.test.ts` (12 test cases covering donor registry, ring-fenced receipt issuance for Lillah/Orphan vs General vs Waqf, fund summary calculation, zero-leakage filtering, duplicate receipt conflict, and RBAC).
  3. `tests/cash_book.test.ts` (11 test cases covering bank account creation, cash collection/expense logging, bank deposit slip vouchers, daily closing balance reconciliation, multi-day continuity, and RBAC).
- **Target Metrics**: 100% pass across all 72+ test assertions upon backend implementation.

---

## 5. Verification Method

1. **Inspect Artifacts**:
   - Test strategy plan: `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_3\plan.md`
   - Dispatch record: `C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_3\DISPATCH.md`
2. **Execute Current Baseline**:
   - Command: `npx vitest run tests/api.test.ts`
   - Observe baseline behavior and seed status failure.
3. **Execute Post-Implementation Test Command**:
   - Command: `npx vitest run`
   - Verifies `tests/api.test.ts`, `tests/accounting_segregation.test.ts`, `tests/donations.test.ts`, and `tests/cash_book.test.ts`.
