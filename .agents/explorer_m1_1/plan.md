# Milestone 1 Backend: Implementation Strategy Plan

## Executive Summary
This document specifies the end-to-end implementation strategy for **Milestone 1 Backend** of MadrasaOS AI v3.0. 
The objective is to implement:
1. **Schema & Migration**: Segregated student billing by `ledger_type` ('residential' vs 'non_residential'), `donors`, `donation_receipts`, `bank_accounts`, and `cash_book_daily`.
2. **Seed Logic Fix in `seed.ts`**: Resolve test failure in `tests/api.test.ts` by ensuring overdue invoices exist and seeding M1 donor/cashbook datasets.
3. **Services & Routes**:
   - `financeService.ts` & `financeRoutes.ts`: Segregated invoice querying, creation, and strict payment idempotency returning HTTP 409 Conflict.
   - `donationService.ts` & `donationRoutes.ts`: Donor CRUD, immutable donation receipts, and fund ring-fencing summary.
   - `cashBookService.ts` & `cashBookRoutes.ts`: Real-time daily cash calculation (collections, expenses, bank deposits, opening/closing balance) and bank vouchers.

---

## 1. Architecture & Data Contracts

### 1.1 Database Schema Extensions (`server/src/db/schema.ts`)

#### A. Table Modification: `fee_invoices`
Add `ledger_type TEXT DEFAULT 'non_residential'` to `fee_invoices`.
Because SQLite is local-first with an existing `data/madrasaos.sqlite` database, `initializeDatabase()` must execute an idempotent migration step:
```sql
ALTER TABLE fee_invoices ADD COLUMN ledger_type TEXT DEFAULT 'non_residential';
```
And create index:
```sql
CREATE INDEX IF NOT EXISTS idx_invoices_ledger ON fee_invoices(tenant_id, ledger_type);
```

#### B. New Table: `donors`
Stores the permanent, annual, one-time, and anonymous benefactor directory.
```sql
CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  org_name TEXT,
  category TEXT NOT NULL, -- 'permanent' | 'annual' | 'one_time' | 'anonymous'
  contact_phone TEXT,
  whatsapp TEXT,
  email TEXT,
  commitment_frequency TEXT DEFAULT 'none', -- 'monthly' | 'annual' | 'one_time' | 'none'
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_donors_org ON donors(organization_id);
```

#### C. New Table: `donation_receipts`
Stores immutable credit vouchers with fund ring-fencing.
```sql
CREATE TABLE IF NOT EXISTS donation_receipts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  receipt_no TEXT UNIQUE NOT NULL,
  donor_id TEXT NOT NULL,
  fund_type TEXT NOT NULL, -- 'lillah_orphan' | 'general' | 'waqf_construction'
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash' | 'bkash' | 'nagad' | 'bank'
  payment_reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (donor_id) REFERENCES donors(id)
);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_fund ON donation_receipts(organization_id, fund_type);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_donor ON donation_receipts(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_created ON donation_receipts(organization_id, created_at);
```

#### D. New Table: `bank_accounts`
Stores institutional bank accounts and liquid balances.
```sql
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  current_balance REAL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_org ON bank_accounts(organization_id);
```

#### E. New Table: `cash_book_daily`
Stores day-end closed cash book reconciliation records.
```sql
CREATE TABLE IF NOT EXISTS cash_book_daily (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  opening_balance REAL DEFAULT 0.0,
  cash_collections REAL DEFAULT 0.0,
  cash_expenses REAL DEFAULT 0.0,
  bank_deposits REAL DEFAULT 0.0,
  closing_balance REAL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  UNIQUE (organization_id, date)
);
CREATE INDEX IF NOT EXISTS idx_cash_book_daily_org_date ON cash_book_daily(organization_id, date);
```

### 1.2 Master TypeScript Domain Types (`server/src/types/index.ts`)
Add the following interfaces and union types:
```typescript
export type LedgerType = 'residential' | 'non_residential';

export type DonorCategory = 'permanent' | 'annual' | 'one_time' | 'anonymous';
export type CommitmentFrequency = 'monthly' | 'annual' | 'one_time' | 'none';

export interface Donor {
  id: string;
  organizationId: string;
  name: string;
  orgName?: string;
  category: DonorCategory;
  contactPhone?: string;
  whatsapp?: string;
  email?: string;
  commitmentFrequency: CommitmentFrequency;
  createdAt: string;
}

export type DonationFundType = 'lillah_orphan' | 'general' | 'waqf_construction';

export interface DonationReceipt {
  id: string;
  organizationId: string;
  receiptNo: string;
  donorId: string;
  donorName?: string;
  fundType: DonationFundType;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank';
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  organizationId: string;
  bankName: string;
  accountNumber: string;
  branchName: string;
  currentBalance: number;
  createdAt: string;
}

export interface CashBookDaily {
  id: string;
  organizationId: string;
  date: string;
  openingBalance: number;
  cashCollections: number;
  cashExpenses: number;
  bankDeposits: number;
  closingBalance: number;
  createdAt: string;
}
```
Update `FeeInvoice` interface to include:
```typescript
ledgerType: LedgerType;
```

---

## 2. Seed Fix & Dataset Expansion Strategy (`server/src/db/seed.ts`)

### 2.1 Diagnosis of Current Failure
1. `tests/api.test.ts` line 255 calls:
   `GET /api/v1/finance/invoices?status=overdue`
   and expects `res.body.data.length > 0`.
2. In `seed.ts`, when `data/madrasaos.sqlite` is already populated, `seedDatabase()` encounters:
   `const existingOrg = await db.get('SELECT id FROM organizations LIMIT 1'); if (existingOrg) return;`
   Because of this early return, any new seed logic or status corrections never execute on existing databases.
3. Furthermore, in the existing database on disk, 35 invoices are `paid` and 70 invoices are `partially_paid`. Exactly 0 invoices have `status = 'overdue'`.

### 2.2 Seed Fix Implementation
In `server/src/db/seed.ts`:
1. **In `if (existingOrg)` branch**:
   - Check if any overdue invoices exist:
     ```ts
     const overdueCount = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM fee_invoices WHERE status = 'overdue'");
     if (!overdueCount || overdueCount.count === 0) {
       await db.run(`
         UPDATE fee_invoices 
         SET status = 'overdue', due_date = '2026-09-05', paid_amount = 0, due_amount = total_amount 
         WHERE id IN (SELECT id FROM fee_invoices WHERE status = 'partially_paid' LIMIT 10)
       `);
     }
     ```
   - Check if `donors`, `donation_receipts`, `bank_accounts`, `cash_book_daily` are empty; if empty, seed them via a helper `seedM1DataIfEmpty(now)`.
   - Update `ledger_type` on existing invoices:
     ```ts
     await db.run(`UPDATE fee_invoices SET ledger_type = 'residential' WHERE fee_items_json LIKE '%হোস্টেল%' OR fee_items_json LIKE '%খাবার%'`);
     ```
2. **In fresh seed loop**:
   - Generate **separate** residential vs non-residential invoices for residential students:
     - Residential invoice: `ledger_type = 'residential'`, items: `[{ title: 'আবাসিক খাবার ও হোস্টেল ফি', amount: 2500 }]`, total = 2500.
     - Non-residential invoice: `ledger_type = 'non_residential'`, items: `[{ title: 'মাসিক একাডেমিক টিউশন ফি', amount: 2000 }]`, total = 2000.
   - For non-residential students:
     - Non-residential invoice: `ledger_type = 'non_residential'`, items: `[{ title: 'মাসিক একাডেমিক টিউশন ফি', amount: 2000 }]`, total = 2000.
   - For `status`:
     Explicitly set every 7th invoice (`i % 7 === 0 && i !== 0`) to `status = 'overdue'`, `due_date = '2026-09-05'`, `paid_amount = 0`, `due_amount = total_amount`.
3. **M1 Seed Datasets**:
   - **Donors**:
     - `dnr_01`: Alhaj Shamsul Huq, permanent donor (`permanent`), monthly commitment (`monthly`), phone `01711223344`, org `শামসুল হক ওয়েলফেয়ার ট্রাস্ট`.
     - `dnr_02`: Haji Abdur Rahim, annual donor (`annual`), annual commitment (`annual`), phone `01811223355`.
     - `dnr_03`: Engr. Nurul Islam, one-time contributor (`one_time`), phone `01911223366`.
     - `dnr_04`: Anonymous Benefactor (`anonymous`), commitment `none`.
   - **Donation Receipts**:
     - `rcp_don_01`: `lillah_orphan`, ৳15,000, bKash, `TRX_ZAKAT_901`, `লিল্লাহ বোর্ডিং এতিম ছাত্রদের খাদ্য বাবদ যাকাত তহবিল অনুদান`.
     - `rcp_don_02`: `general`, ৳5,000, cash, `VOUCH_GEN_101`, `মাদ্রাসার সাধারণ মেরামত ও বিদ্যুৎ বিল বাবদ অনুদান`.
     - `rcp_don_03`: `waqf_construction`, ৳50,000, bank, `TRX_IBBL_WAQF_001`, `নতুন ৪ তলা ছাত্রাবাস ভবন নির্মাণ ওয়াকফ তহবিল অনুদান`.
   - **Bank Accounts**:
     - `bank_01`: Islami Bank Bangladesh Ltd (IBBL), Mirpur Branch, Acc: `20501122334455`, Balance: ৳350,000.
     - `bank_02`: Al-Arafah Islami Bank Ltd (AIBL), Pallabi Branch, Acc: `102033445566`, Balance: ৳150,000.
   - **Cash Book Daily**:
     - `cb_20260920`: date `2026-09-20`, opening balance ৳25,000, cash collections ৳12,000, cash expenses ৳8,500, bank deposits ৳10,000, closing balance ৳18,500.

---

## 3. Services & Routes Specification

### 3.1 Finance Enhancements (`financeService.ts` & `financeRoutes.ts`)

#### Service Method Updates:
1. `getInvoices(tenantId: string, params: { studentId?: string; status?: string; month?: string; type?: string; ledgerType?: string; limit?: number })`:
   - Add SQL condition:
     ```ts
     const ledger = params.ledgerType || params.type;
     if (ledger) {
       sql += ' AND fi.ledger_type = ?';
       queryParams.push(ledger);
     }
     ```
   - Return mapped invoices with `ledger_type` and parsed `feeItems`.
2. `createInvoice(tenantId: string, payload: { studentId: string; ledgerType: 'residential' | 'non_residential'; feeItems: { title: string; amount: number }[]; dueDate: string; month?: string; year?: number })`:
   - Validate student exists within tenant.
   - Validate `ledgerType` in `['residential', 'non_residential']`.
   - Validate `feeItems` non-empty with total > 0.
   - Generate `invoice_number = INV-${year}${month}-${seq}`.
   - Insert into `fee_invoices` with `status = 'unpaid'`, `paid_amount = 0`, `due_amount = total_amount`.
3. `collectPayment(...)` Idempotency Guard:
   - When `payload.transactionId` is supplied:
     ```ts
     if (payload.transactionId) {
       const existing = await db.get(
         'SELECT id, payment_number FROM fee_payments WHERE tenant_id = ? AND transaction_id = ?',
         [tenantId, payload.transactionId]
       );
       if (existing) {
         const err: any = new Error(`এই ডিজিটাল লেনদেন আইডি (${payload.transactionId}) ইতিমধ্যে প্রসেস করা হয়েছে (রসিদ নং: ${existing.payment_number})।`);
         err.statusCode = 409;
         err.code = 'DUPLICATE_TRANSACTION';
         throw err;
       }
     }
     ```

#### Routes:
- `GET /api/v1/finance/invoices?type=residential|non_residential`:
  Allowed roles: `super_admin`, `madrasa_admin`, `principal`, `accountant`, plus guardian/student restricted to linked student invoices.
  Teachers/Hifz Teachers blocked with HTTP 403 `FORBIDDEN`.
- `POST /api/v1/finance/invoices`:
  Allowed roles: `super_admin`, `madrasa_admin`, `accountant`.
- `POST /api/v1/finance/payments/collect`:
  Enforces idempotency, returns 409 for duplicate `transactionId`.

---

### 3.2 Donations & Receipts (`donationService.ts` & `donationRoutes.ts`)

#### Service Architecture (`server/src/services/donationService.ts`):
- `getDonors(orgId: string, query?: string)`: List donors, filtered by name/phone/category.
- `getDonorById(orgId: string, id: string)`: Return donor details along with past donation receipts list.
- `createDonor(orgId: string, payload: Partial<Donor>)`: Validate and insert donor.
- `updateDonor(orgId: string, id: string, payload: Partial<Donor>)`: Update editable details.
- `createReceipt(orgId: string, payload: { donorId: string; fundType: 'lillah_orphan' | 'general' | 'waqf_construction'; amount: number; paymentMethod: string; paymentReference?: string; notes?: string; receiptNo?: string })`:
  - Validate `fundType` in `['lillah_orphan', 'general', 'waqf_construction']`.
  - Validate `amount > 0`.
  - Check donor exists.
  - Generate `receiptNo = RCP-DON-${year}${month}-${seq}` if not provided.
  - Insert into `donation_receipts`. Note: Receipts are immutable audit records (no update endpoint).
- `getReceipts(orgId: string, params: { fundType?: string; donorId?: string; startDate?: string; endDate?: string })`: List receipts.
- `getFundsSummary(orgId: string)`:
  Aggregate by fund type:
  ```sql
  SELECT fund_type, COUNT(*) as count, SUM(amount) as total 
  FROM donation_receipts 
  WHERE organization_id = ? 
  GROUP BY fund_type
  ```
  Returns:
  ```json
  {
    "lillah_orphan": { "total": 15000, "count": 1 },
    "general": { "total": 5000, "count": 1 },
    "waqf_construction": { "total": 50000, "count": 1 },
    "grand_total": 70000
  }
  ```

#### Routes (`server/src/routes/donationRoutes.ts`):
Mounted at `/api/v1/finance/donations` and `/api/v1/finance/donors`.
Allowed roles: `super_admin`, `madrasa_admin`, `accountant`, `principal`.
`teacher`, `hifz_teacher`, `hostel_manager`, `guardian`, `student` are strictly blocked with HTTP 403 `FORBIDDEN`.

---

### 3.3 Cash Book & Bank Accounts (`cashBookService.ts` & `cashBookRoutes.ts`)

#### Service Architecture (`server/src/services/cashBookService.ts`):
- `getDailyCashBook(orgId: string, date: string)`:
  1. Compute real-time cash collections for `date`:
     - Student fee cash payments: `SELECT SUM(amount) FROM fee_payments WHERE paid_at = ? AND payment_method = 'cash'`
     - Cash donation receipts: `SELECT SUM(amount) FROM donation_receipts WHERE created_at LIKE ? AND payment_method = 'cash'`
  2. Compute real-time cash expenses for `date`:
     - `SELECT SUM(amount) FROM expenses WHERE date = ? AND payment_method = 'cash'`
  3. Compute bank cash deposits on that `date` from bank deposit logs.
  4. Find opening balance:
     - Check `cash_book_daily` for previous date: `SELECT closing_balance FROM cash_book_daily WHERE organization_id = ? AND date < ? ORDER BY date DESC LIMIT 1`. Default: 25,000 if none.
  5. Compute closing balance:
     `closingBalance = openingBalance + cashCollections - cashExpenses - bankDeposits`.
  6. Return breakdown with detailed itemized entries (fee vouchers, donation receipts, expense vouchers, bank deposits).
- `closeDay(orgId: string, date: string, payload?: Partial<CashBookDaily>)`:
  Persists/locks the calculated cash book into `cash_book_daily` table with `INSERT ... ON CONFLICT(organization_id, date) DO UPDATE`.
- `recordBankDeposit(orgId: string, payload: { bankAccountId: string; amount: number; depositSlipNumber: string; notes?: string; date?: string })`:
  - Validate `bankAccountId` exists.
  - Validate `amount > 0`.
  - Increment `bank_accounts.current_balance += amount`.
  - Record cash expense or deposit voucher for cash book deduction.
- `getBankAccounts(orgId: string)`: List bank accounts.
- `createBankAccount(orgId: string, payload: Partial<BankAccount>)`: Add new bank account.

#### Routes (`server/src/routes/cashBookRoutes.ts`):
Mounted at `/api/v1/finance/cash-book` and `/api/v1/finance/bank-accounts`.
Allowed roles: `super_admin`, `madrasa_admin`, `accountant`.

---

## 4. Mounting & Router Integration

In `server/src/routes/financeRoutes.ts`:
Mount sub-routers:
```typescript
import donationRoutes from './donationRoutes.js';
import cashBookRoutes from './cashBookRoutes.js';

router.use('/donations', donationRoutes);
router.use('/donors', donationRoutes);
router.use('/cash-book', cashBookRoutes);
router.use('/bank-accounts', cashBookRoutes);
```
Or directly export them in `server/src/routes/index.ts`. Mounting through `financeRoutes` ensures all URLs specified in contracts match:
- `/api/v1/finance/invoices`
- `/api/v1/finance/payments/collect`
- `/api/v1/finance/donations/receipts`
- `/api/v1/finance/donations/funds-summary`
- `/api/v1/finance/donors`
- `/api/v1/finance/cash-book/daily`
- `/api/v1/finance/cash-book/bank-deposit`
- `/api/v1/finance/cash-book/close-day`
- `/api/v1/finance/bank-accounts`

---

## 5. Security & RBAC Enforcement Matrix

| Endpoint | `super_admin` | `madrasa_admin` | `principal` | `accountant` | `teacher` | `hifz_teacher` | `guardian` | `student` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /finance/invoices` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | ❌ 403 | Child only | Own only |
| `POST /finance/invoices` | ✅ | ✅ | ❌ 403 | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `POST /finance/payments/collect` | ✅ | ✅ | ❌ 403 | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /finance/donors` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `POST /finance/donors` | ✅ | ✅ | ❌ 403 | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `POST /finance/donations/receipts` | ✅ | ✅ | ❌ 403 | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /finance/donations/funds-summary` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /finance/cash-book/daily` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `POST /finance/cash-book/bank-deposit` | ✅ | ✅ | ❌ 403 | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /finance/bank-accounts` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |

---

## 6. Testing & Quality Assurance Plan

### 6.1 Fix Existing Test Suite (`tests/api.test.ts`)
1. With `seed.ts` updated to ensure overdue invoices exist in both fresh and existing database branches, `tests/api.test.ts` line 258 assertion `expect(invoicesRes.body.data.length).toBeGreaterThan(0)` will pass.
2. Verify all 34 tests in `tests/api.test.ts` pass 100%.

### 6.2 New Test Suite 1: `tests/accounting_segregation.test.ts`
1. **Invoice Segregation**:
   - Query `GET /api/v1/finance/invoices?type=residential`: All items have `ledger_type === 'residential'`.
   - Query `GET /api/v1/finance/invoices?type=non_residential`: All items have `ledger_type === 'non_residential'`.
   - Post `POST /api/v1/finance/invoices` with `ledger_type: 'residential'`: Verify created invoice has residential tag and correct total.
2. **Payment Idempotency**:
   - Post valid payment with unique `transactionId`.
   - Post identical request with same `transactionId`: Expect HTTP 409 Conflict with code `DUPLICATE_TRANSACTION`.
3. **Cash Book Calculation**:
   - `GET /api/v1/finance/cash-book/daily?date=2026-09-20`: Expect valid `opening_balance`, `cash_collections`, `cash_expenses`, `bank_deposits`, and `closing_balance` matching the formula.
   - Bank deposit endpoint increases `bank_accounts.current_balance`.

### 6.3 New Test Suite 2: `tests/donations.test.ts`
1. **Donor Directory**:
   - Create donor (`POST /api/v1/finance/donors`).
   - List donors (`GET /api/v1/finance/donors`).
2. **Immutable Receipts**:
   - Create receipt for `lillah_orphan`.
   - Create receipt for `waqf_construction`.
   - Create receipt for `general`.
   - Verify non-positive amount rejected (400).
   - Verify invalid fund type rejected (400).
3. **Fund Ring-Fencing**:
   - Query `GET /api/v1/finance/donations/funds-summary`:
     Verify totals for `lillah_orphan`, `general`, and `waqf_construction` are separated with zero cross-contamination.
4. **RBAC Guard**:
   - Login as `teacher` -> `GET /api/v1/finance/donors` returns HTTP 403.
   - Login as `teacher` -> `POST /api/v1/finance/donations/receipts` returns HTTP 403.

---

## 7. Step-by-Step Implementation Sequence

| Step | Component | File(s) | Action |
|:---:|---|---|---|
| **1** | Domain Types | `server/src/types/index.ts` | Add `LedgerType`, `Donor`, `DonationReceipt`, `BankAccount`, `CashBookDaily` interfaces and update `FeeInvoice`. |
| **2** | Schema & Migration | `server/src/db/schema.ts` | Add `ledger_type` to `fee_invoices` (with ALTER TABLE migration check), define `donors`, `donation_receipts`, `bank_accounts`, `cash_book_daily` tables and indexes. |
| **3** | Seed Logic Fix | `server/src/db/seed.ts` | Fix `if (existingOrg)` branch to ensure overdue invoices exist; update full seed loop for separate residential/non-residential invoices; seed donors, receipts, bank accounts, cash book. |
| **4** | Finance Service & Routes | `server/src/services/financeService.ts`<br/>`server/src/routes/financeRoutes.ts` | Add `ledger_type` filtering, `createInvoice`, and strict payment idempotency returning HTTP 409. |
| **5** | Donation Service & Routes | `server/src/services/donationService.ts`<br/>`server/src/routes/donationRoutes.ts` | Implement donor CRUD, immutable donation receipts, fund ring-fencing summary, and RBAC guards. |
| **6** | Cash Book Service & Routes | `server/src/services/cashBookService.ts`<br/>`server/src/routes/cashBookRoutes.ts` | Implement daily cash book calculation, bank deposit voucher, day closure, and bank account management. |
| **7** | Router Integration | `server/src/routes/financeRoutes.ts`<br/>`server/src/routes/index.ts` | Mount donation and cash book routes under `/api/v1/finance`. |
| **8** | Automated Testing | `tests/api.test.ts`<br/>`tests/accounting_segregation.test.ts`<br/>`tests/donations.test.ts` | Run Vitest to verify 100% test pass rate across existing baseline and new M1 suites. |
| **9** | Build Verification | Root project | Run `npm run build:server` and `npm run build` to confirm zero TypeScript compilation errors. |
