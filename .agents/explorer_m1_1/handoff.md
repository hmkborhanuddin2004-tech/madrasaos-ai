# Handoff Report: Milestone 1 Backend Implementation Strategy

## 1. Observation
1. **Existing Database Schema** (`server/src/db/schema.ts:209-226`):
   Table `fee_invoices` currently lacks `ledger_type` ('residential' | 'non_residential'). The tables `donors`, `donation_receipts`, `bank_accounts`, and `cash_book_daily` do not exist in the database schema.
2. **Database Storage File** (`data/madrasaos.sqlite`):
   Inspection of `data/madrasaos.sqlite` revealed:
   - `SELECT status, count(*) as c FROM fee_invoices GROUP BY status`: returned `[{ status: 'paid', c: 35 }, { status: 'partially_paid', c: 70 }]`.
   - Exactly 0 invoices have `status = 'overdue'`.
3. **Seed Database Logic** (`server/src/db/seed.ts:44-59`):
   `seedDatabase()` checks `const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1');` and if found, returns early without updating `fee_invoices`.
   In the full seeding loop (`server/src/db/seed.ts:275-288`), `isPaid` is evaluated before `isOverdue`, meaning index 0 (`i=0`) was marked `paid` rather than `overdue`.
4. **Test Suite Failure** (`tests/api.test.ts:255-260`):
   Running `npm test` exited with code 1:
   ```
   FAIL  tests/api.test.ts > 6. Finance & Payment Collection > POST /api/v1/finance/payments/collect processes fee payment via bKash
   AssertionError: expected 0 to be greater than 0
    ❯ tests/api.test.ts:258:42
       256|       .set('Authorization', `Bearer ${adminToken}`);
       257|     expect(invoicesRes.status).toBe(200);
       258|     expect(invoicesRes.body.data.length).toBeGreaterThan(0);
   ```
   The failure is directly caused by the absence of invoices with `status = 'overdue'`.
5. **Finance Service & Routes** (`server/src/services/financeService.ts:106-137` and `server/src/routes/financeRoutes.ts:22-65`):
   `getInvoices` does not support filtering by `ledger_type` or `type`. `financeService.ts` lacks an invoice creation method (`createInvoice`).
   Payment idempotency at `financeService.ts:183-194` is currently conditioned on `payload.paymentMethod !== 'cash'` rather than strictly checking any supplied `transactionId`.
6. **New Required Modules** (`PROJECT.md:63-69, 90-93`):
   The endpoints `/api/v1/finance/donations/*` and `/api/v1/finance/cash-book/*` are specified, along with service files `donationService.ts` and `cashBookService.ts` and route files `donationRoutes.ts` and `cashBookRoutes.ts`, which do not yet exist.
7. **Compilation Baseline**:
   Running `npm run build:server` and `npm run build:client` completed with exit code 0 and zero TypeScript errors.

## 2. Logic Chain
1. *From Observation 4 and Observation 2*: `tests/api.test.ts` failed at line 258 because `GET /api/v1/finance/invoices?status=overdue` returned 0 invoices. Observation 2 proved that in `data/madrasaos.sqlite`, all 105 invoices are either `paid` (35) or `partially_paid` (70).
2. *From Observation 3*: Modifying only the full seeding loop in `seed.ts` is insufficient to fix existing installations because `seedDatabase()` short-circuits on `if (existingOrg) return;`. Therefore, the fix in `seed.ts` must ensure overdue invoices exist both within the `if (existingOrg)` branch (e.g. updating 5-10 invoices to `status = 'overdue'`, `due_date = '2026-09-05'`) and in the full seeding loop.
3. *From Observation 1*: Because `data/madrasaos.sqlite` is already created on disk, SQLite's `CREATE TABLE IF NOT EXISTS` will not alter existing tables. In `schema.ts`, adding `ALTER TABLE fee_invoices ADD COLUMN ledger_type TEXT DEFAULT 'non_residential'` inside a `try/catch` block during `initializeDatabase()` is essential for zero-downtime, lossless schema migration.
4. *From Observation 1 and Requirement R1.1*: Segregated student accounting requires generating distinct invoices: one for residential boarding/mess fees (`ledger_type = 'residential'`) and one for academic tuition (`ledger_type = 'non_residential'`). This requires adding `ledger_type` to `schema.ts`, updating `FinanceService.getInvoices` to accept `type`/`ledgerType`, and adding `createInvoice`.
5. *From Observation 5 and Acceptance Criteria*: Strict payment idempotency requires returning HTTP 409 Conflict with `code = 'DUPLICATE_TRANSACTION'` whenever any non-empty duplicate `transactionId` is submitted.
6. *From Observation 6*: Implementing `donationService.ts`/`donationRoutes.ts` and `cashBookService.ts`/`cashBookRoutes.ts` with RBAC enforcement (`requireRole('super_admin', 'madrasa_admin', 'accountant')`) fulfills R1.3 (Donor registry, immutable receipts, fund isolation) and R1.4 (Automated Daily Cash Book, bank deposit vouchers).

## 3. Caveats
- **Tenant vs Organization ID Mapping**: In `schema.ts`, `users` and `students` reference `institutions.id` as `tenant_id`, while `donors`, `donation_receipts`, `bank_accounts`, and `cash_book_daily` define `organization_id`. Since an institution belongs to an organization (`institution.organization_id`), services should seamlessly accept `tenantId` (e.g. `'inst_main'`) or `organizationId` (e.g. `'org_main'`) by resolving `orgId = institution.organization_id || tenantId`.
- **Pre-existing Database on Disk**: Any schema alteration must not wipe `data/madrasaos.sqlite` without careful consideration, as existing user passwords, student records, and workflows are stored there. The strategy uses idempotent `ALTER TABLE` and `seedIfEmpty` checks.

## 4. Conclusion
Milestone 1 Backend is fully analyzed with an actionable, 9-step implementation strategy recorded in `plan.md`. The immediate priority is executing:
1. `server/src/types/index.ts`: Add domain types (`LedgerType`, `Donor`, `DonationReceipt`, `BankAccount`, `CashBookDaily`).
2. `server/src/db/schema.ts`: Add `ALTER TABLE fee_invoices ADD COLUMN ledger_type` migration and create `donors`, `donation_receipts`, `bank_accounts`, `cash_book_daily` tables with indexes.
3. `server/src/db/seed.ts`: Fix `existingOrg` branch and seeding loop so overdue invoices exist, and seed sample donors, donation receipts, bank accounts, and cash book records.
4. `server/src/services/financeService.ts` & `server/src/routes/financeRoutes.ts`: Support `ledger_type` filtering, invoice generation, and strict 409 payment idempotency.
5. Create `donationService.ts` & `donationRoutes.ts` for donor CRUD, immutable receipts, and fund summary.
6. Create `cashBookService.ts` & `cashBookRoutes.ts` for daily cash calculation, bank deposits, and day closing.
7. Mount sub-routers in `financeRoutes.ts` and run tests.

## 5. Verification Method
1. **Baseline Test Suite Verification**:
   Execute:
   ```bash
   npm test
   ```
   *Expected result*: `tests/api.test.ts` passes 34 of 34 tests (100%), resolving the previous failure on `POST /api/v1/finance/payments/collect`.
2. **New M1 Unit & Integration Test Suites**:
   Create and execute:
   ```bash
   npx vitest run tests/accounting_segregation.test.ts
   npx vitest run tests/donations.test.ts
   ```
   *Verification items*:
   - Residential vs Non-Residential invoices return only matching `ledger_type`.
   - Re-submitting payment with identical `transactionId` returns HTTP 409 Conflict with `DUPLICATE_TRANSACTION`.
   - Donation receipt creation creates immutable records and correctly isolates `lillah_orphan`, `general`, and `waqf_construction` in `funds-summary`.
   - Daily cash book computes `opening_balance + cash_collections - cash_expenses - bank_deposits = closing_balance`.
   - Teachers and Hifz Teachers receive HTTP 403 `FORBIDDEN` when accessing `/api/v1/finance/donations` and `/api/v1/finance/cash-book`.
3. **Build Integrity Verification**:
   Execute:
   ```bash
   npm run build
   ```
   *Expected result*: Both client and server compile cleanly with 0 TypeScript errors.
