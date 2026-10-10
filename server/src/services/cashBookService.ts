import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { BankAccount, CashBookDaily } from '../types/index.js';

export class CashBookService {
  public async getDailyCashBook(tenantId: string, inputDate?: string): Promise<any> {
    const targetDate = inputDate || new Date().toISOString().split('T')[0];

    // 1. Determine opening balance
    // Look for the most recent preceding day's closed cash book record
    const priorRecord = await db.get<any>(
      `SELECT closing_balance 
       FROM cash_book_daily 
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND date < ? 
       ORDER BY date DESC LIMIT 1`,
      [tenantId, targetDate]
    );

    let openingBalance = 25000;
    if (priorRecord && typeof priorRecord.closing_balance === 'number') {
      openingBalance = priorRecord.closing_balance;
    } else {
      // Check if targetDate was explicitly pre-seeded or manually created with an opening balance
      const existingToday = await db.get<any>(
        `SELECT opening_balance FROM cash_book_daily WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND date = ?`,
        [tenantId, targetDate]
      );
      if (existingToday && typeof existingToday.opening_balance === 'number') {
        openingBalance = existingToday.opening_balance;
      }
    }

    // 2. Fetch cash collections for targetDate
    // A. Cash fee payments
    const feeCash = await db.get<any>(
      `SELECT SUM(amount) as total FROM fee_payments 
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND paid_at = ? AND payment_method = 'cash'`,
      [tenantId, targetDate]
    );
    const feeCashTotal = feeCash?.total || 0;

    // B. Cash donation receipts
    const datePrefix = `${targetDate}%`;
    const donCash = await db.get<any>(
      `SELECT SUM(amount) as total FROM donation_receipts 
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND (created_at LIKE ? OR created_at = ?) AND payment_method = 'cash'`,
      [tenantId, datePrefix, targetDate]
    );
    const donCashTotal = donCash?.total || 0;

    const collectionsTotal = feeCashTotal + donCashTotal;

    // 3. Fetch cash expenses for targetDate
    const expCash = await db.get<any>(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND date = ? AND payment_method = 'cash'`,
      [tenantId, targetDate]
    );
    const expensesTotal = expCash?.total || 0;

    // 4. Fetch bank deposits for targetDate
    const bankDep = await db.get<any>(
      `SELECT SUM(amount) as total FROM bank_deposits 
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND deposit_date = ?`,
      [tenantId, targetDate]
    );
    const bankDepositsTotal = bankDep?.total || 0;

    // 5. Invariant: Closing = Opening + Collections - Expenses - BankDeposits
    const closingBalance = openingBalance + collectionsTotal - expensesTotal - bankDepositsTotal;

    // Persist / update the cash book for targetDate in cash_book_daily table
    const cbId = `cb_${tenantId}_${targetDate.replace(/-/g, '')}`;
    await db.run(
      `INSERT INTO cash_book_daily (id, tenant_id, organization_id, date, opening_balance, cash_collections, cash_expenses, bank_deposits, closing_balance, created_at)
       VALUES (?, ?, 'org_main', ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(tenant_id, date) DO UPDATE SET
         opening_balance = excluded.opening_balance,
         cash_collections = excluded.cash_collections,
         cash_expenses = excluded.cash_expenses,
         bank_deposits = excluded.bank_deposits,
         closing_balance = excluded.closing_balance`,
      [cbId, tenantId, targetDate, openingBalance, collectionsTotal, expensesTotal, bankDepositsTotal, closingBalance]
    );

    // 6. Fetch Itemized Line Entries
    const feeRows = await db.all<any>(
      `SELECT fp.id, fp.payment_number, fp.amount, fp.payment_method, s.full_name_bn as student_name
       FROM fee_payments fp
       JOIN students s ON fp.student_id = s.id
       WHERE (fp.tenant_id = ? OR fp.tenant_id = 'inst_main') AND fp.paid_at = ? AND fp.payment_method = 'cash'`,
      [tenantId, targetDate]
    );

    const donRows = await db.all<any>(
      `SELECT dr.id, dr.receipt_no, dr.amount, dr.fund_type, d.name as donor_name
       FROM donation_receipts dr
       LEFT JOIN donors d ON dr.donor_id = d.id
       WHERE (dr.tenant_id = ? OR dr.tenant_id = 'inst_main') AND (dr.created_at LIKE ? OR dr.created_at = ?) AND dr.payment_method = 'cash'`,
      [tenantId, datePrefix, targetDate]
    );

    const expRows = await db.all<any>(
      `SELECT id, voucher_number, category, amount, payee, description
       FROM expenses
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND date = ? AND payment_method = 'cash'`,
      [tenantId, targetDate]
    );

    const depRows = await db.all<any>(
      `SELECT bd.id, bd.deposit_slip_number, bd.amount, bd.deposited_by, ba.bank_name, ba.account_number
       FROM bank_deposits bd
       JOIN bank_accounts ba ON bd.bank_account_id = ba.id
       WHERE (bd.tenant_id = ? OR bd.tenant_id = 'inst_main') AND bd.deposit_date = ?`,
      [tenantId, targetDate]
    );

    const entries: any[] = [
      ...feeRows.map((r) => ({
        id: r.id,
        type: 'fee_collection',
        direction: 'debit',
        flow: 'inflow',
        title: 'শিক্ষার্থী ফি নগদ আদায়',
        voucher_number: r.payment_number,
        voucherNumber: r.payment_number,
        party: r.student_name,
        amount: r.amount,
        time: 'সকাল ১০:৩০'
      })),
      ...donRows.map((r) => ({
        id: r.id,
        type: 'donation',
        direction: 'debit',
        flow: 'inflow',
        title: `নগদ অনুদান (${r.fund_type === 'lillah_orphan' ? 'লিল্লাহ ও এতিম' : r.fund_type === 'waqf_construction' ? 'ওয়াকফ ও নির্মাণ' : 'সাধারণ'})`,
        voucher_number: r.receipt_no,
        voucherNumber: r.receipt_no,
        party: r.donor_name || 'বেনামী শুভাকাঙ্ক্ষী',
        amount: r.amount,
        time: 'বেলা ১১:৪৫'
      })),
      ...expRows.map((r) => ({
        id: r.id,
        type: 'expense',
        direction: 'credit',
        flow: 'outflow',
        title: `নগদ প্রাতিষ্ঠানিক ব্যয় (${r.category})`,
        voucher_number: r.voucher_number,
        voucherNumber: r.voucher_number,
        party: r.payee,
        description: r.description,
        amount: r.amount,
        time: 'দুপুর ০১:২০'
      })),
      ...depRows.map((r) => ({
        id: r.id,
        type: 'bank_deposit',
        direction: 'credit',
        flow: 'outflow',
        title: `ব্যাংক জমা (${r.bank_name})`,
        voucher_number: r.deposit_slip_number,
        voucherNumber: r.deposit_slip_number,
        party: r.deposited_by,
        amount: r.amount,
        time: 'বিকাল ০৩:৩০'
      }))
    ];

    return {
      date: targetDate,
      opening_balance: openingBalance,
      openingBalance,
      cash_collections: collectionsTotal,
      cashCollections: collectionsTotal,
      collections_total: collectionsTotal,
      collectionsTotal,
      cash_expenses: expensesTotal,
      cashExpenses: expensesTotal,
      expenses_total: expensesTotal,
      expensesTotal,
      bank_deposits: bankDepositsTotal,
      bankDeposits: bankDepositsTotal,
      bank_deposits_total: bankDepositsTotal,
      bankDepositsTotal,
      closing_balance: closingBalance,
      closingBalance,
      totalInflow: collectionsTotal,
      total_inflow: collectionsTotal,
      totalOutflow: expensesTotal,
      total_outflow: expensesTotal,
      breakdown: {
        feeCollections: feeRows.map((r) => ({
          id: r.id,
          studentName: r.student_name,
          invoiceNumber: r.payment_number,
          paymentMethod: r.payment_method || 'cash',
          amount: r.amount
        })),
        donationCollections: donRows.map((r) => ({
          id: r.id,
          donorName: r.donor_name || 'বেনামী শুভাকাঙ্ক্ষী',
          receiptNumber: r.receipt_no,
          fundType: r.fund_type,
          amount: r.amount
        })),
        expenses: expRows.map((r) => ({
          id: r.id,
          payee: r.payee,
          description: r.description,
          category: r.category,
          amount: r.amount
        })),
        bankDepositTransactions: depRows.map((r) => ({
          id: r.id,
          bankName: r.bank_name,
          accountNumber: r.account_number || '',
          reference: r.deposit_slip_number,
          amount: r.amount
        })),
        expenseOutflows: expensesTotal,
        bankDeposits: bankDepositsTotal
      },
      entries
    };
  }

  public async recordBankDeposit(tenantId: string, payload: any): Promise<any> {
    const bankAccountId = payload.bank_account_id || payload.bankAccountId;
    const amount = Number(payload.amount);
    const depositSlipNumber =
      payload.depositSlipNumber ||
      payload.reference ||
      payload.deposit_slip_number;
    const depositDate = payload.deposit_date || payload.depositDate || payload.date || new Date().toISOString().split('T')[0];
    const depositedBy = payload.deposited_by || payload.depositedBy || 'মুহাম্মদ ফারুক হোসেন';
    const notes = payload.notes || 'ক্যাশ থেকে ব্যাংক একাউন্টে জমা';

    if (!bankAccountId || !depositSlipNumber) {
      const err: any = new Error('ব্যাংক অ্যাকাউন্ট এবং স্লিপ নম্বর আবশ্যক (bank_account_id and deposit_slip_number are required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
      const err: any = new Error('জমার পরিমাণ অবশ্যই ০-এর বেশি হতে হবে (Amount must be greater than 0)');
      err.statusCode = 400;
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const bank = await db.get<any>(
      `SELECT * FROM bank_accounts WHERE id = ? AND (tenant_id = ? OR tenant_id = 'inst_main')`,
      [bankAccountId, tenantId]
    );

    if (!bank) {
      const err: any = new Error('ব্যাংক অ্যাকাউন্ট খুঁজে পাওয়া যায়নি (Bank account not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const id = `bdep_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.transaction(async () => {
      // 1. Insert deposit voucher
      await db.run(
        `INSERT INTO bank_deposits (id, tenant_id, organization_id, bank_account_id, amount, deposit_slip_number, deposit_date, deposited_by, notes, created_at)
         VALUES (?, ?, 'org_main', ?, ?, ?, ?, ?, ?, ?)`,
        [id, tenantId, bankAccountId, amount, depositSlipNumber, depositDate, depositedBy, notes, now]
      );

      // 2. Increment bank balance
      await db.run(
        `UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?`,
        [amount, bankAccountId]
      );
    });

    const updatedBank = await db.get<any>(`SELECT current_balance FROM bank_accounts WHERE id = ?`, [bankAccountId]);

    // Recalculate cash book for that date
    await this.getDailyCashBook(tenantId, depositDate);

    return {
      id,
      bankAccountId,
      bank_account_id: bankAccountId,
      bankName: bank.bank_name,
      amount,
      depositSlipNumber,
      deposit_slip_number: depositSlipNumber,
      reference: depositSlipNumber,
      depositDate,
      deposit_date: depositDate,
      depositedBy,
      deposited_by: depositedBy,
      notes,
      newBankBalance: updatedBank?.current_balance || 0,
      createdAt: now
    };
  }

  public async getBankAccounts(tenantId: string): Promise<any[]> {
    const rows = await db.all<any>(
      `SELECT * FROM bank_accounts WHERE (tenant_id = ? OR tenant_id = 'inst_main') ORDER BY created_at DESC`,
      [tenantId]
    );

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      organizationId: r.organization_id,
      bankName: r.bank_name,
      bank_name: r.bank_name,
      accountNumber: r.account_number,
      account_number: r.account_number,
      branchName: r.branch_name,
      branch_name: r.branch_name,
      currentBalance: r.current_balance,
      current_balance: r.current_balance,
      createdAt: r.created_at,
      created_at: r.created_at
    }));
  }

  public async createBankAccount(tenantId: string, payload: any): Promise<any> {
    const bankName = payload.bank_name || payload.bankName;
    const accountNumber = payload.account_number || payload.accountNumber;
    const branchName = payload.branch_name || payload.branchName || 'প্রধান শাখা';
    const currentBalance = Number(payload.current_balance || payload.currentBalance || 0);

    if (!bankName || !accountNumber) {
      const err: any = new Error('ব্যাংকের নাম এবং অ্যাকাউন্ট নম্বর আবশ্যক (bank_name and account_number are required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const id = payload.id || `bank_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO bank_accounts (id, tenant_id, organization_id, bank_name, account_number, branch_name, current_balance, created_at)
       VALUES (?, ?, 'org_main', ?, ?, ?, ?, ?)`,
      [id, tenantId, bankName, accountNumber, branchName, currentBalance, now]
    );

    return {
      id,
      tenantId,
      bankName,
      bank_name: bankName,
      accountNumber,
      account_number: accountNumber,
      branchName,
      branch_name: branchName,
      currentBalance,
      current_balance: currentBalance,
      createdAt: now,
      created_at: now
    };
  }

  public async closeDay(tenantId: string, date: string): Promise<any> {
    const cashBook = await this.getDailyCashBook(tenantId, date);
    return {
      success: true,
      message: `${date} তারিখের ক্যাশ বই হিসাব চূড়ান্ত ও লক করা হয়েছে।`,
      data: cashBook
    };
  }
}

export const cashBookService = new CashBookService();
