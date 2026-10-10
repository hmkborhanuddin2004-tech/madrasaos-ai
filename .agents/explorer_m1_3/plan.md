# Milestone 1: Test Implementation & Verification Strategy
**Target Milestone**: M1 — Segregated Accounting, Fund Isolation & Cash Book  
**Author**: Codebase Explorer (`explorer_m1_3`)  
**Date**: 2026-09-20  

---

## 1. Executive Summary & Test Architecture

MadrasaOS AI v3.0 requires strict financial segregation, ring-fenced charitable fund isolation, immutable auditability, and daily cash book reconciliation tailored to 1,000–2,000 student Bangladeshi Madrasas.

Milestone 1 introduces three dedicated test suites to accompany the existing baseline (`tests/api.test.ts`):
1. `tests/accounting_segregation.test.ts`: Validates residential (খোরাকি/সিট) vs non-residential (টিউশন/সেশন) fee invoice generation, segregated ledger retrieval without cross-fund pollution, multi-method payment collection, balance updates, and duplicate payment conflict rejection (HTTP 409).
2. `tests/donations.test.ts`: Validates donor registry CRUD (permanent, annual, one-time, anonymous), ring-fenced donation receipt issuance across three distinct fund categories (Lillah/Orphan, General, Waqf/Construction), fund balance aggregation, and mathematical zero-leakage isolation.
3. `tests/cash_book.test.ts`: Validates bank account registration, multi-source cash collections, cash expenses, bank deposit slip recording, daily cash book mathematical formula ($Closing = Opening + Collections - Expenses - BankDeposits$), and multi-day opening balance continuity.

### Architecture Overview
- **Runner**: Vitest v5.0.1 (`npx vitest run`)
- **HTTP Client**: Supertest v7.2.2 with Express 5.2.1 application instance (`app`)
- **Database Engine**: Local-first SQLite3 in WAL mode with Foreign Keys enabled (`PRAGMA foreign_keys = ON;`)
- **Isolation Strategy**: Deterministic fixtures created within each test suite with unique timestamps/IDs; isolated test dates (e.g. `2026-10-05`) for cash book reconciliation to prevent collision with seeded data.

---

## 2. Baseline Assessment & Seed Failure Root Cause

During test survey execution (`npm test`), 33 of 34 tests in `tests/api.test.ts` passed, but Test 6 failed:
```
FAIL tests/api.test.ts > 6. Finance & Payment Collection > POST /api/v1/finance/payments/collect processes fee payment via bKash
AssertionError: expected 0 to be greater than 0
at tests/api.test.ts:258:42
```
### Root Cause:
In `server/src/db/seed.ts`, `seedDatabase()` checks if an organization already exists (`SELECT id FROM organizations LIMIT 1`). If found, it returns early. In the pre-existing SQLite database file (`data/madrasaos.sqlite`), fee invoices were all previously categorized as either `paid` (35 records) or `partially_paid` (70 records), resulting in **0 overdue invoices** (`SELECT count(*) FROM fee_invoices WHERE status = 'overdue' -> 0`).

### Remedy for Milestone 1 Implementer:
1. In `server/src/db/seed.ts`, update the `existingOrg` branch to ensure at least 15 overdue invoices are maintained:
   ```ts
   const overdueCount = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM fee_invoices WHERE status = 'overdue'");
   if (!overdueCount || overdueCount.count === 0) {
     await db.run("UPDATE fee_invoices SET status = 'overdue', paid_amount = 0, due_amount = total_amount WHERE id IN (SELECT id FROM fee_invoices WHERE status != 'paid' LIMIT 15)");
   }
   ```
2. For all new test suites (`accounting_segregation.test.ts`, `donations.test.ts`, `cash_book.test.ts`), **tests must create their own dedicated invoices and fixtures** rather than depending on mutable seed rows.

---

## 3. Test Suite 1: `tests/accounting_segregation.test.ts`

### Objective
Verify that residential and non-residential invoices are generated with proper line items, segregated by `ledger_type`, retrievable without cross-fund contamination, and that payments update balances with strict idempotency (HTTP 409 on duplicate transaction IDs).

### Test Matrix

| # | Test Case Description | Route & Method | Request Body / Query | Expected Status | Key Assertions |
|---|----------------------|----------------|----------------------|:---------------:|----------------|
| 1.1 | Login & Token Acquisition | `POST /api/v1/auth/login` | Admin, Accountant, Teacher, Student credentials | 200 OK | Tokens received for all roles |
| 1.2 | Generate Residential Invoice | `POST /api/v1/finance/invoices` | `{ student_id: 'std_002', ledger_type: 'residential', month: 'অক্টোবর', year: 2026, fee_items: [...], due_date: '2026-10-10' }` | 201 Created | `ledger_type === 'residential'`, `total_amount === 4500`, `fee_items` contains mess and boarding charges |
| 1.3 | Generate Non-Residential Invoice | `POST /api/v1/finance/invoices` | `{ student_id: 'std_001', ledger_type: 'non_residential', month: 'অক্টোবর', year: 2026, fee_items: [...], due_date: '2026-10-10' }` | 201 Created | `ledger_type === 'non_residential'`, `total_amount === 2300`, `fee_items` contains tuition and session fees |
| 1.4 | Segregated Retrieval: Residential Only | `GET /api/v1/finance/invoices?type=residential` | Auth: Admin/Accountant | 200 OK | Every item has `ledger_type === 'residential'`; zero non-residential items |
| 1.5 | Segregated Retrieval: Non-Residential Only | `GET /api/v1/finance/invoices?type=non_residential` | Auth: Admin/Accountant | 200 OK | Every item has `ledger_type === 'non_residential'`; zero residential items |
| 1.6 | Partial Payment on Residential Invoice | `POST /api/v1/finance/payments/collect` | `{ invoiceId: resInvId, amount: 2000, paymentMethod: 'bkash', transactionId: uniqueTxn1 }` | 200 OK | `newDue === 2500`, `invoiceStatus === 'partially_paid'` |
| 1.7 | Ledger Balance State After Partial Payment | `GET /api/v1/finance/invoices?type=residential` | Auth: Admin | 200 OK | Target invoice has `paid_amount === 2000`, `due_amount === 2500` |
| 1.8 | Full Payment Clearing Balance | `POST /api/v1/finance/payments/collect` | `{ invoiceId: resInvId, amount: 2500, paymentMethod: 'nagad', transactionId: uniqueTxn2 }` | 200 OK | `newDue === 0`, `invoiceStatus === 'paid'` |
| 1.9 | Duplicate Transaction ID Idempotency Conflict | `POST /api/v1/finance/payments/collect` | Reusing `uniqueTxn1` | 409 Conflict | `error.code === 'DUPLICATE_TRANSACTION'` |
| 1.10 | Overpayment Rejection on Fully Paid Invoice | `POST /api/v1/finance/payments/collect` | Paying 500 on paid invoice | 400 Bad Request | `error.code === 'INVOICE_ALREADY_PAID'` or `'AMOUNT_EXCEEDS_DUE'` |
| 1.11 | Zero/Negative Payment Amount Rejection | `POST /api/v1/finance/payments/collect` | `amount: 0` or `amount: -100` | 400 Bad Request | `error.code === 'INVALID_AMOUNT'` |
| 1.12 | Missing Required Fields Rejection | `POST /api/v1/finance/invoices` | Missing `student_id` or `ledger_type` | 400 Bad Request | `error.code === 'VALIDATION_ERROR'` |
| 1.13 | RBAC: Teacher Blocked from Creating Invoice | `POST /api/v1/finance/invoices` | Auth: Teacher | 403 Forbidden | `error.code === 'FORBIDDEN'` |
| 1.14 | RBAC: Teacher Blocked from Segregated Invoices | `GET /api/v1/finance/invoices?type=residential` | Auth: Teacher | 403 Forbidden | `error.code === 'FORBIDDEN'` |
| 1.15 | RBAC: Student Scoped to Own Invoices Only | `GET /api/v1/finance/invoices?type=residential` | Auth: Student | 200 OK | All returned invoices belong strictly to `std_001` |

### Detailed Implementation Blueprint

```typescript
// Sample Test Case Code for tests/accounting_segregation.test.ts
describe('Accounting Segregation & Ledger Isolation', () => {
  let adminToken: string;
  let teacherToken: string;
  let residentialInvoiceId: string;
  let nonResidentialInvoiceId: string;
  const testTxnId = `TXN_RES_${Date.now()}`;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();
    // Fetch tokens for admin, teacher, student...
  });

  it('Generates residential invoice with mess/boarding charges', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: 'std_002',
        ledger_type: 'residential',
        month: 'অক্টোবর',
        year: 2026,
        fee_items: [
          { title: 'মেস ও খোরাকি চার্জ (Meal/Mess)', amount: 3000 },
          { title: 'হোস্টেল সিট ও বেড ভাড়া (Boarding Rent)', amount: 1000 },
          { title: 'লন্ড্রি ও ইউটিলিটি চার্জ (Laundry/Utility)', amount: 500 }
        ],
        due_date: '2026-10-10'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ledger_type).toBe('residential');
    expect(res.body.data.total_amount).toBe(4500);
    expect(res.body.data.due_amount).toBe(4500);
    expect(res.body.data.paid_amount).toBe(0);
    expect(res.body.data.status).toBe('unpaid');
    expect(res.body.data.fee_items.length).toBe(3);
    residentialInvoiceId = res.body.data.id;
  });

  it('Generates non-residential invoice with academic tuition/session items', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: 'std_001',
        ledger_type: 'non_residential',
        month: 'অক্টোবর',
        year: 2026,
        fee_items: [
          { title: 'মাসিক একাডেমিক বেতন (Tuition)', amount: 1800 },
          { title: 'বার্ষিক সেশন ফি (Session Fee)', amount: 500 }
        ],
        due_date: '2026-10-10'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ledger_type).toBe('non_residential');
    expect(res.body.data.total_amount).toBe(2300);
    nonResidentialInvoiceId = res.body.data.id;
  });

  it('Segregated retrieval: ?type=residential returns only residential invoices', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=residential')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const inv of res.body.data) {
      expect(inv.ledger_type).toBe('residential');
    }
  });

  it('Segregated retrieval: ?type=non_residential returns only non-residential invoices', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=non_residential')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const inv of res.body.data) {
      expect(inv.ledger_type).toBe('non_residential');
    }
  });

  it('Rejects duplicate digital transaction ID with HTTP 409 Conflict', async () => {
    // 1. First collection succeeds
    const firstRes = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: residentialInvoiceId,
        amount: 2000,
        paymentMethod: 'bkash',
        transactionId: testTxnId
      });
    expect(firstRes.status).toBe(200);

    // 2. Duplicate collection with identical transaction ID is rejected
    const dupRes = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: residentialInvoiceId,
        amount: 2000,
        paymentMethod: 'bkash',
        transactionId: testTxnId
      });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('DUPLICATE_TRANSACTION');
  });
});
```

---

## 4. Test Suite 2: `tests/donations.test.ts`

### Objective
Verify donor registry management, serialized receipt issuance across three distinct funds (Lillah/Orphan, General Operational, Waqf/Construction), fund balance aggregation, and strict mathematical isolation (zero cross-fund leakage).

### Test Matrix

| # | Test Case Description | Route & Method | Request Body / Query | Expected Status | Key Assertions |
|---|----------------------|----------------|----------------------|:---------------:|----------------|
| 2.1 | Register Permanent Donor | `POST /api/v1/finance/donations/donors` | `{ name: 'হাজী সামসুল আলম', org_name: 'আলম টেক্সটাইল', category: 'permanent', contact_phone: '01711223344', whatsapp: '01711223344', commitment_frequency: 'monthly' }` | 201 Created | `data.id` generated, `category === 'permanent'` |
| 2.2 | Register Anonymous Donor | `POST /api/v1/finance/donations/donors` | `{ name: 'বেনামী শুভাকাঙ্ক্ষী', category: 'anonymous', contact_phone: '01800000000' }` | 201 Created | `category === 'anonymous'` |
| 2.3 | List Donors with Category Filter | `GET /api/v1/finance/donations/donors?category=permanent` | Auth: Admin | 200 OK | All returned donors have `category === 'permanent'` |
| 2.4 | Issue Lillah & Orphan Fund Receipt | `POST /api/v1/finance/donations/receipts` | `{ donor_id: donorId, fund_type: 'lillah_orphan', amount: 50000, payment_method: 'bank', receipt_no: 'RCP-LIL-001', notes: 'যাকাত তহবিল' }` | 201 Created | `fund_type === 'lillah_orphan'`, `amount === 50000`, serialized receipt number stored |
| 2.5 | Issue General Operational Fund Receipt | `POST /api/v1/finance/donations/receipts` | `{ donor_id: donorId, fund_type: 'general', amount: 20000, payment_method: 'cash', receipt_no: 'RCP-GEN-001', notes: 'বিদ্যুৎ বিল ও সাধারণ অনুদান' }` | 201 Created | `fund_type === 'general'`, `amount === 20000` |
| 2.6 | Issue Waqf & Construction Fund Receipt | `POST /api/v1/finance/donations/receipts` | `{ donor_id: anonDonorId, fund_type: 'waqf_construction', amount: 100000, payment_method: 'bank', receipt_no: 'RCP-WQF-001', notes: 'মসজিদ সম্প্রসারণ' }` | 201 Created | `fund_type === 'waqf_construction'`, `amount === 100000` |
| 2.7 | Verify Fund Summary & Isolation | `GET /api/v1/finance/donations/funds/summary` | Auth: Admin | 200 OK | `funds.lillah_orphan.total_amount >= 50000`, `funds.general.total_amount >= 20000`, `funds.waqf_construction.total_amount >= 100000`, Grand total equals sum of isolated funds |
| 2.8 | Verify Zero Leakage in Fund Filtering | `GET /api/v1/finance/donations/receipts?fund_type=lillah_orphan` | Auth: Admin | 200 OK | Every item returned has `fund_type === 'lillah_orphan'`; zero General or Waqf receipts |
| 2.9 | Duplicate Receipt Number Rejection | `POST /api/v1/finance/donations/receipts` | Re-using `RCP-LIL-001` | 409 Conflict | `error.code === 'DUPLICATE_RECEIPT'` or `'DUPLICATE_TRANSACTION'` |
| 2.10 | Invalid Fund Type Rejection | `POST /api/v1/finance/donations/receipts` | `fund_type: 'speculative_fund'` | 400 Bad Request | `error.code === 'INVALID_FUND_TYPE'` |
| 2.11 | Zero/Negative Amount Rejection | `POST /api/v1/finance/donations/receipts` | `amount: -500` or `amount: 0` | 400 Bad Request | `error.code === 'INVALID_AMOUNT'` |
| 2.12 | RBAC: Teacher Blocked from Donors & Receipts | `GET /api/v1/finance/donations/donors` & `POST /api/v1/finance/donations/receipts` | Auth: Teacher | 403 Forbidden | `error.code === 'FORBIDDEN'` |

### Detailed Implementation Blueprint

```typescript
// Sample Test Case Code for tests/donations.test.ts
describe('Donations, Grants & Ring-Fenced Fund Isolation', () => {
  let adminToken: string;
  let teacherToken: string;
  let donorId: string;
  let anonDonorId: string;
  const lilReceiptNo = `LIL-${Date.now()}`;
  const genReceiptNo = `GEN-${Date.now()}`;
  const wqfReceiptNo = `WQF-${Date.now()}`;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();
    // Setup tokens...
  });

  it('Creates permanent and anonymous donors', async () => {
    const res1 = await request(app)
      .post('/api/v1/finance/donations/donors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'হাজী মুহাম্মদ সামসুল আলম',
        org_name: 'আলম টেক্সটাইল মিলস লিমিটেড',
        category: 'permanent',
        contact_phone: '01711223344',
        whatsapp: '01711223344',
        email: 'shamsul.alam@example.com',
        commitment_frequency: 'monthly'
      });
    expect(res1.status).toBe(201);
    expect(res1.body.data.category).toBe('permanent');
    donorId = res1.body.data.id;

    const res2 = await request(app)
      .post('/api/v1/finance/donations/donors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'বেনামী শুভাকাঙ্ক্ষী',
        category: 'anonymous',
        contact_phone: '01800000000'
      });
    expect(res2.status).toBe(201);
    anonDonorId = res2.body.data.id;
  });

  it('Issues ring-fenced donation receipts across 3 funds', async () => {
    // 1. Lillah / Orphan
    const lilRes = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        donor_id: donorId,
        fund_type: 'lillah_orphan',
        amount: 50000,
        payment_method: 'bank',
        receipt_no: lilReceiptNo,
        notes: 'যাকাত ও ফিতরা তহবিল'
      });
    expect(lilRes.status).toBe(201);
    expect(lilRes.body.data.fund_type).toBe('lillah_orphan');
    expect(lilRes.body.data.amount).toBe(50000);

    // 2. General
    const genRes = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        donor_id: donorId,
        fund_type: 'general',
        amount: 20000,
        payment_method: 'cash',
        receipt_no: genReceiptNo,
        notes: 'সাধারণ অনুদান'
      });
    expect(genRes.status).toBe(201);
    expect(genRes.body.data.fund_type).toBe('general');

    // 3. Waqf / Construction
    const wqfRes = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        donor_id: anonDonorId,
        fund_type: 'waqf_construction',
        amount: 100000,
        payment_method: 'bank',
        receipt_no: wqfReceiptNo,
        notes: 'মসজিদ নির্মাণ অনুদান'
      });
    expect(wqfRes.status).toBe(201);
    expect(wqfRes.body.data.fund_type).toBe('waqf_construction');
  });

  it('Fund summary calculates isolated balances without cross-fund leakage', async () => {
    const res = await request(app)
      .get('/api/v1/finance/donations/funds/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const summary = res.body.data;
    expect(summary.funds.lillah_orphan.total_amount).toBeGreaterThanOrEqual(50000);
    expect(summary.funds.general.total_amount).toBeGreaterThanOrEqual(20000);
    expect(summary.funds.waqf_construction.total_amount).toBeGreaterThanOrEqual(100000);

    // Verify mathematical integrity
    const sum = summary.funds.lillah_orphan.total_amount +
                summary.funds.general.total_amount +
                summary.funds.waqf_construction.total_amount;
    expect(summary.total_collected).toBe(sum);
  });

  it('Querying receipts by fund_type yields strict isolation', async () => {
    const res = await request(app)
      .get('/api/v1/finance/donations/receipts?fund_type=lillah_orphan')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const receipt of res.body.data) {
      expect(receipt.fund_type).toBe('lillah_orphan');
      expect(receipt.fund_type).not.toBe('general');
      expect(receipt.fund_type).not.toBe('waqf_construction');
    }
  });
});
```

---

## 5. Test Suite 3: `tests/cash_book.test.ts`

### Objective
Verify that the daily cash book tracks cash collections, cash expenses, and bank deposits, enforcing the core accounting equation:
$$\text{Closing Balance} = \text{Opening Balance} + \text{Cash Collections} - \text{Cash Expenses} - \text{Bank Deposits}$$
and ensuring multi-day balance continuity ($Opening_{Day\,N+1} = Closing_{Day\,N}$).

### Test Matrix

| # | Test Case Description | Route & Method | Request Body / Query | Expected Status | Key Assertions |
|---|----------------------|----------------|----------------------|:---------------:|----------------|
| 3.1 | Create Institutional Bank Account | `POST /api/v1/finance/bank-accounts` | `{ bank_name: 'Islami Bank Bangladesh PLC', account_number: '20501122334455001', branch_name: 'মিরপুর শাখা', current_balance: 100000 }` | 201 Created | `data.id` returned, `account_number === '20501122334455001'` |
| 3.2 | List Bank Accounts | `GET /api/v1/finance/bank-accounts` | Auth: Admin | 200 OK | Created bank account is present in list |
| 3.3 | Post Cash Fee Collection on Controlled Date | `POST /api/v1/finance/payments/collect` | `{ invoiceId: invId, amount: 3000, paymentMethod: 'cash' }` (on date `2026-10-05`) | 200 OK | Cash collection recorded for test date |
| 3.4 | Post Cash Donation on Controlled Date | `POST /api/v1/finance/donations/receipts` | `{ donor_id: donorId, fund_type: 'general', amount: 7000, payment_method: 'cash', receipt_no: 'RCP-CSH-01' }` | 201 Created | Cash donation recorded (Total cash collections = 10,000) |
| 3.5 | Post Cash Expense #1 (Food Ration) | `POST /api/v1/finance/expenses` | `{ category: 'food_ration', amount: 2500, payment_method: 'cash', voucher_number: 'V-01', date: '2026-10-05' }` | 200 OK | Cash expense recorded |
| 3.6 | Post Cash Expense #2 (Utility) | `POST /api/v1/finance/expenses` | `{ category: 'utility', amount: 1500, payment_method: 'cash', voucher_number: 'V-02', date: '2026-10-05' }` | 200 OK | Cash expense recorded (Total cash expenses = 4,000) |
| 3.7 | Record Bank Deposit Slip (Cash to Bank) | `POST /api/v1/finance/cash-book/bank-deposits` | `{ bank_account_id: bankAccId, amount: 5000, deposit_slip_number: 'SLIP-9876', deposit_date: '2026-10-05', deposited_by: 'মুহাম্মদ ফারুক' }` | 201 Created | Deposit slip recorded; bank account balance increases by 5,000 |
| 3.8 | Daily Cash Book Mathematical Balance Check | `GET /api/v1/finance/cash-book/daily?date=2026-10-05` | Auth: Admin | 200 OK | `collections_total >= 10000`, `expenses_total >= 4000`, `bank_deposits_total >= 5000`, `closing_balance === opening_balance + collections_total - expenses_total - bank_deposits_total` |
| 3.9 | Verify Cash Book Line Item Entries | `GET /api/v1/finance/cash-book/daily?date=2026-10-05` | Auth: Admin | 200 OK | `entries` list contains fee collection, donation, both expense vouchers, and bank deposit voucher |
| 3.10 | Multi-Day Continuity Verification | `GET /api/v1/finance/cash-book/daily?date=2026-10-06` | Auth: Admin | 200 OK | Day 2 `opening_balance` strictly equals Day 1 `closing_balance` |
| 3.11 | RBAC: Teacher Blocked from Cash Book & Deposits | `GET /api/v1/finance/cash-book/daily` & `POST /api/v1/finance/cash-book/bank-deposits` | Auth: Teacher | 403 Forbidden | `error.code === 'FORBIDDEN'` |

### Detailed Implementation Blueprint

```typescript
// Sample Test Case Code for tests/cash_book.test.ts
describe('Daily Cash Book & Bank Deposit Ledgers', () => {
  let adminToken: string;
  let teacherToken: string;
  let bankAccountId: string;
  const targetDate = '2026-10-05';
  const nextDate = '2026-10-06';

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();
    // Setup tokens...
  });

  it('Creates an institutional bank account', async () => {
    const res = await request(app)
      .post('/api/v1/finance/bank-accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bank_name: 'Islami Bank Bangladesh PLC',
        account_number: '20501122334455001',
        branch_name: 'মিরপুর শাখা',
        current_balance: 100000
      });
    expect(res.status).toBe(201);
    expect(res.body.data.account_number).toBe('20501122334455001');
    bankAccountId = res.body.data.id;
  });

  it('Records cash collections and cash expenses on target date', async () => {
    // 1. Expense: Food ration (Cash 2500)
    await request(app)
      .post('/api/v1/finance/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: 'food_ration',
        amount: 2500,
        payment_method: 'cash',
        voucher_number: `VOUCH-CASH-F-${Date.now()}`,
        payee: 'মদিনা ট্রেডার্স',
        approved_by: 'মুহতামিম',
        date: targetDate,
        description: 'আবাসিক খাবার কেনাকাটা'
      });

    // 2. Expense: Utility (Cash 1500)
    await request(app)
      .post('/api/v1/finance/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: 'utility',
        amount: 1500,
        payment_method: 'cash',
        voucher_number: `VOUCH-CASH-U-${Date.now()}`,
        payee: 'বিদ্যুৎ অফিস',
        approved_by: 'মুহতামিম',
        date: targetDate,
        description: 'বিদ্যুৎ বিল'
      });

    // 3. Bank deposit slip (Cash 5000 deposited to Bank)
    const depRes = await request(app)
      .post('/api/v1/finance/cash-book/bank-deposits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bank_account_id: bankAccountId,
        amount: 5000,
        deposit_slip_number: `SLIP-IBBL-${Date.now()}`,
        deposit_date: targetDate,
        deposited_by: 'মুহাম্মদ ফারুক হোসেন',
        notes: 'নগদ ক্যাশ ব্যাংকে জমা'
      });
    expect(depRes.status).toBe(201);
  });

  it('Verifies Cash Book equation: Closing = Opening + Collections - Expenses - Bank Deposits', async () => {
    const res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${targetDate}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const cb = res.body.data;
    expect(cb.date).toBe(targetDate);
    expect(typeof cb.opening_balance).toBe('number');
    expect(typeof cb.collections_total).toBe('number');
    expect(typeof cb.expenses_total).toBe('number');
    expect(typeof cb.bank_deposits_total).toBe('number');
    expect(typeof cb.closing_balance).toBe('number');

    // Fundamental Cash Book Invariant
    const expectedClosing = cb.opening_balance + cb.collections_total - cb.expenses_total - cb.bank_deposits_total;
    expect(cb.closing_balance).toBe(expectedClosing);
    expect(Array.isArray(cb.entries)).toBe(true);
  });

  it('Verifies multi-day continuity: Next day opening balance equals previous closing balance', async () => {
    const day1Res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${targetDate}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const day2Res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${nextDate}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(day1Res.status).toBe(200);
    expect(day2Res.status).toBe(200);
    expect(day2Res.body.data.opening_balance).toBe(day1Res.body.data.closing_balance);
  });
});
```

---

## 6. Implementation Dependencies & Schema Expectations

To ensure tests execute seamlessly against the upcoming backend code, the backend engineer (`explorer_m1_1` / implementer) must establish:

1. **Database Tables**:
   - `donors`: `(id, tenant_id, name, org_name, category, contact_phone, whatsapp, email, commitment_frequency, created_at)`
   - `donation_receipts`: `(id, tenant_id, receipt_no, donor_id, fund_type, amount, payment_method, payment_reference, notes, created_at)`
   - `bank_accounts`: `(id, tenant_id, bank_name, account_number, branch_name, current_balance, created_at)`
   - `cash_book_daily`: `(id, tenant_id, date, opening_balance, cash_collections, cash_expenses, bank_deposits, closing_balance, created_at)`
   - `fee_invoices` column addition: `ledger_type TEXT DEFAULT 'non_residential'`
2. **Payload Case Compatibility**:
   - Support both `camelCase` and `snake_case` in request payloads (`student_id` / `studentId`, `ledger_type` / `ledgerType`, `fee_items` / `feeItems`, `donor_id` / `donorId`, `fund_type` / `fundType`, `receipt_no` / `receiptNo`, `transaction_id` / `transactionId`).
3. **HTTP Status Code Conformity**:
   - Resource Creation (`POST /invoices`, `POST /donors`, `POST /receipts`, `POST /bank-accounts`, `POST /bank-deposits`): Return **201 Created** (or 200 OK).
   - Duplicate Transactions / Receipts: Return **409 Conflict** with `{ error: { code: 'DUPLICATE_TRANSACTION' | 'DUPLICATE_RECEIPT' } }`.
   - RBAC Unauthorized Role: Return **403 Forbidden** with `{ error: { code: 'FORBIDDEN' } }`.

---

## 7. Verification & Pass Criteria

1. **Vitest Execution**:
   - Command: `npx vitest run`
   - Target test files:
     - `tests/api.test.ts` (34 passing tests)
     - `tests/accounting_segregation.test.ts` (15 passing tests)
     - `tests/donations.test.ts` (12 passing tests)
     - `tests/cash_book.test.ts` (11 passing tests)
   - Overall target: **100% pass across all 72+ test assertions**.
2. **TypeScript Compilation**:
   - Command: `npm run build:server`
   - Zero compilation errors (`tsc -p tsconfig.server.json`).
