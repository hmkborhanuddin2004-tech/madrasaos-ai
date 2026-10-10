import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { FeeInvoice, FeePayment, ExpenseRecord } from '../types/index.js';

// Payment Provider Interface (Bangladeshi Payment Architecture)
export interface PaymentVerificationResult {
  isSuccess: boolean;
  transactionId: string;
  amount: number;
  providerReference: string;
  provider: string;
}

export interface PaymentProvider {
  processPayment(amount: number, invoiceId: string, reference?: string): Promise<PaymentVerificationResult>;
}

export class BkashProvider implements PaymentProvider {
  async processPayment(amount: number, invoiceId: string, reference?: string): Promise<PaymentVerificationResult> {
    // Simulates secure bKash merchant checkout verification with API tokens
    return {
      isSuccess: true,
      transactionId: reference || `BKASH_${Date.now()}`,
      amount,
      providerReference: `BKASH_REF_${uuidv4().slice(0, 8)}`,
      provider: 'bKash'
    };
  }
}

export class NagadProvider implements PaymentProvider {
  async processPayment(amount: number, invoiceId: string, reference?: string): Promise<PaymentVerificationResult> {
    return {
      isSuccess: true,
      transactionId: reference || `NAGAD_${Date.now()}`,
      amount,
      providerReference: `NAGAD_REF_${uuidv4().slice(0, 8)}`,
      provider: 'Nagad'
    };
  }
}

export class CashProvider implements PaymentProvider {
  async processPayment(amount: number, invoiceId: string, reference?: string): Promise<PaymentVerificationResult> {
    return {
      isSuccess: true,
      transactionId: `CASH_${Date.now()}`,
      amount,
      providerReference: `VOUCHER_${uuidv4().slice(0, 6)}`,
      provider: 'Cash'
    };
  }
}

export class FinanceService {
  private providers: Record<string, PaymentProvider> = {
    bkash: new BkashProvider(),
    nagad: new NagadProvider(),
    cash: new CashProvider()
  };

  public async getSummary(tenantId: string, month: string = 'সেপ্টেম্বর', year: number = 2026): Promise<any> {
    const invoices = await db.get<any>(
      `SELECT 
         COUNT(*) as total_invoices,
         SUM(total_amount) as total_billed,
         SUM(paid_amount) as total_collected,
         SUM(due_amount) as total_due
       FROM fee_invoices
       WHERE tenant_id = ? AND month = ? AND year = ?`,
      [tenantId, month, year]
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const todayPayments = await db.get<any>(
      `SELECT SUM(amount) as today_collection FROM fee_payments WHERE tenant_id = ? AND paid_at = ?`,
      [tenantId, todayStr]
    );

    const expenses = await db.get<any>(
      `SELECT SUM(amount) as total_expenses FROM expenses WHERE tenant_id = ?`,
      [tenantId]
    );

    const expenseCategories = await db.all<any>(
      `SELECT category, SUM(amount) as total FROM expenses WHERE tenant_id = ? GROUP BY category`,
      [tenantId]
    );

    return {
      month,
      year,
      totalBilled: invoices?.total_billed || 0,
      totalCollected: invoices?.total_collected || 0,
      totalDue: invoices?.total_due || 0,
      todayCollection: todayPayments?.today_collection || 0,
      totalExpenses: expenses?.total_expenses || 0,
      netBalance: (invoices?.total_collected || 0) - (expenses?.total_expenses || 0),
      expenseCategories: expenseCategories.map((c) => ({
        category: c.category,
        total: c.total
      }))
    };
  }

  public async getInvoices(
    tenantId: string,
    params: { studentId?: string; status?: string; month?: string; type?: string; ledgerType?: string; limit?: number }
  ): Promise<any[]> {
    let sql = `
      SELECT fi.*, s.full_name_bn as student_name_bn, s.student_id_number, s.guardian_phone,
             c.name_bn as class_name_bn
      FROM fee_invoices fi
      JOIN students s ON fi.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE fi.tenant_id = ?
    `;
    const queryParams: any[] = [tenantId];

    if (params.studentId) {
      sql += ' AND fi.student_id = ?';
      queryParams.push(params.studentId);
    }
    if (params.status) {
      sql += ' AND fi.status = ?';
      queryParams.push(params.status);
    }
    if (params.month) {
      sql += ' AND fi.month = ?';
      queryParams.push(params.month);
    }
    const ledger = params.ledgerType || params.type;
    if (ledger) {
      sql += ' AND fi.ledger_type = ?';
      queryParams.push(ledger);
    }

    const limit = params.limit || 50;
    sql += ' ORDER BY fi.created_at DESC LIMIT ?';
    queryParams.push(limit);

    const rows = await db.all<any>(sql, queryParams);

    return rows.map((r) => {
      const feeItems = JSON.parse(r.fee_items_json || '[]');
      return {
        ...r,
        ledger_type: r.ledger_type || 'non_residential',
        ledgerType: r.ledger_type || 'non_residential',
        feeItems,
        fee_items: feeItems
      };
    });
  }

  public async createInvoice(
    tenantId: string,
    payload: {
      studentId?: string;
      student_id?: string;
      ledgerType?: 'residential' | 'non_residential';
      ledger_type?: 'residential' | 'non_residential';
      month?: string;
      year?: number;
      feeItems?: { title?: string; name?: string; amount: number; feeTypeId?: string }[];
      fee_items?: { title?: string; name?: string; amount: number; feeTypeId?: string }[];
      items?: { title?: string; name?: string; amount: number; feeTypeId?: string }[];
      title?: string;
      dueDate?: string;
      due_date?: string;
    }
  ): Promise<any> {
    const studentId = payload.studentId || payload.student_id;
    const ledgerType = payload.ledgerType || payload.ledger_type;
    const rawItems = payload.feeItems || payload.items || payload.fee_items || [];
    const feeItems = Array.isArray(rawItems)
      ? rawItems.map((item: any) => ({
          feeTypeId: item.feeTypeId || item.fee_type_id || (ledgerType === 'residential' ? 'fee_dining' : 'fee_tuition'),
          title: item.title || item.name || payload.title || 'ফি',
          name: item.name || item.title || payload.title || 'ফি',
          amount: Number(item.amount) || 0
        }))
      : [];
    const month = payload.month || 'অক্টোবর';
    const year = payload.year || 2026;
    const dueDate = payload.dueDate || payload.due_date || '2026-10-10';

    if (!studentId || !ledgerType) {
      const err: any = new Error('শিক্ষার্থী আইডি এবং লেজার টাইপ আবশ্যক (student_id and ledger_type are required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (ledgerType !== 'residential' && ledgerType !== 'non_residential') {
      const err: any = new Error('অবৈধ লেজার টাইপ (Invalid ledger_type)');
      err.statusCode = 400;
      err.code = 'INVALID_LEDGER_TYPE';
      throw err;
    }

    if (!Array.isArray(feeItems) || feeItems.length === 0) {
      const err: any = new Error('ফি আইটেম তালিকা আবশ্যক (fee_items array is required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const totalAmount = feeItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    if (totalAmount <= 0) {
      const err: any = new Error('মোট ফির পরিমাণ ০-এর বেশি হতে হবে');
      err.statusCode = 400;
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const student = await db.get<any>(
      `SELECT s.*, c.name_bn as class_name_bn 
       FROM students s 
       JOIN classes c ON s.class_id = c.id 
       WHERE s.id = ? AND s.tenant_id = ?`,
      [studentId, tenantId]
    );
    if (!student) {
      const err: any = new Error('শিক্ষার্থী খুঁজে পাওয়া যায়নি (Student not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const id = `inv_${ledgerType}_${studentId}_${Date.now()}`;
    const invoiceSeq = Math.floor(1000 + Math.random() * 9000);
    const prefix = ledgerType === 'residential' ? 'RES' : 'ACAD';
    const invoiceNumber = `INV-${prefix}-${year}${month}-${invoiceSeq}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO fee_invoices (id, tenant_id, invoice_number, student_id, month, year, ledger_type, fee_items_json, total_amount, discount_amount, paid_amount, due_amount, status, due_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'unpaid', ?, ?)`,
      [
        id,
        tenantId,
        invoiceNumber,
        studentId,
        month,
        year,
        ledgerType,
        JSON.stringify(feeItems),
        totalAmount,
        totalAmount,
        dueDate,
        now
      ]
    );

    return {
      id,
      tenant_id: tenantId,
      tenantId,
      invoice_number: invoiceNumber,
      invoiceNumber,
      student_id: studentId,
      studentId,
      student_name_bn: student.full_name_bn,
      studentNameBn: student.full_name_bn,
      class_name_bn: student.class_name_bn,
      classNameBn: student.class_name_bn,
      month,
      year,
      ledger_type: ledgerType,
      ledgerType,
      fee_items: feeItems,
      feeItems,
      items: feeItems,
      total_amount: totalAmount,
      totalAmount,
      paid_amount: 0,
      paidAmount: 0,
      due_amount: totalAmount,
      dueAmount: totalAmount,
      status: 'unpaid',
      due_date: dueDate,
      dueDate,
      created_at: now,
      createdAt: now
    };
  }

  public async collectPayment(
    tenantId: string,
    receivedByUserId: string,
    payload: {
      invoiceId?: string;
      invoice_id?: string;
      amount: number;
      paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
      payment_method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
      transactionId?: string;
      transaction_id?: string;
      date?: string;
      paidAt?: string;
    }
  ): Promise<any> {
    const invoiceId = payload.invoiceId || payload.invoice_id;
    const paymentMethod = payload.paymentMethod || payload.payment_method || 'cash';
    const transactionId = payload.transactionId || payload.transaction_id;
    const paymentDate = payload.date || payload.paidAt || new Date().toISOString().split('T')[0];

    if (!invoiceId) {
      const err: any = new Error('ইনভয়েস আইডি প্রদান আবশ্যক (invoiceId is required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (payload.amount === undefined || payload.amount === null || payload.amount <= 0) {
      const err: any = new Error('পরিশোধের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে (Amount must be greater than 0)।');
      err.statusCode = 400;
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const invoice = await db.get<any>(
      'SELECT * FROM fee_invoices WHERE id = ? AND tenant_id = ?',
      [invoiceId, tenantId]
    );

    if (!invoice) {
      const err: any = new Error('ইনভয়েস খুঁজে পাওয়া যায়নি (Invoice not found)।');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (invoice.status === 'paid' || invoice.due_amount <= 0) {
      const err: any = new Error('এই ইনভয়েসের ফি ইতিমধ্যে সম্পূর্ণ পরিশোধিত (Invoice is already fully paid)।');
      err.statusCode = 400;
      err.code = 'INVOICE_ALREADY_PAID';
      throw err;
    }

    if (payload.amount > invoice.due_amount) {
      const err: any = new Error(`পরিশোধের পরিমাণ (৳${payload.amount}) অবশিষ্ট বকেয়া (৳${invoice.due_amount}) এর চেয়ে বেশি হতে পারে না।`);
      err.statusCode = 400;
      err.code = 'AMOUNT_EXCEEDS_DUE';
      throw err;
    }

    // Idempotency: Reject duplicate digital transaction IDs for the same tenant
    if (transactionId) {
      const existingPayment = await db.get<any>(
        'SELECT id, payment_number FROM fee_payments WHERE tenant_id = ? AND transaction_id = ?',
        [tenantId, transactionId]
      );
      if (existingPayment) {
        const err: any = new Error(`এই ডিজিটাল লেনদেন আইডি (${transactionId}) ইতিমধ্যে প্রসেস করা হয়েছে (রসিদ নং: ${existingPayment.payment_number})।`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_TRANSACTION';
        throw err;
      }
    }

    const provider = this.providers[paymentMethod] || this.providers.cash;
    const verification = await provider.processPayment(payload.amount, invoiceId, transactionId);

    if (!verification.isSuccess) {
      const err: any = new Error('পেমেন্ট গেটওয়ে ভেরিফিকেশন ব্যর্থ হয়েছে।');
      err.statusCode = 400;
      err.code = 'PAYMENT_FAILED';
      throw err;
    }

    const paymentId = `pay_${uuidv4().slice(0, 8)}`;
    const paymentNumber = `RCP-${Date.now().toString().slice(-6)}`;

    const newPaid = invoice.paid_amount + payload.amount;
    const newDue = Math.max(0, invoice.total_amount - newPaid);
    const newStatus = newDue <= 0 ? 'paid' : 'partially_paid';

    await db.transaction(async () => {
      // Record payment
      await db.run(
        `INSERT INTO fee_payments (id, tenant_id, invoice_id, payment_number, student_id, amount, payment_method, transaction_id, status, received_by_user_id, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?)`,
        [paymentId, tenantId, invoiceId, paymentNumber, invoice.student_id, payload.amount, paymentMethod, verification.transactionId, receivedByUserId, paymentDate]
      );

      // Update invoice
      await db.run(
        `UPDATE fee_invoices SET paid_amount = ?, due_amount = ?, status = ? WHERE id = ? AND tenant_id = ?`,
        [newPaid, newDue, newStatus, invoiceId, tenantId]
      );
    });

    return {
      success: true,
      paymentId,
      payment_id: paymentId,
      paymentNumber,
      payment_number: paymentNumber,
      amount: payload.amount,
      newDue,
      new_due: newDue,
      invoiceStatus: newStatus,
      invoice_status: newStatus
    };
  }

  public async recordExpense(tenantId: string, branchId: string, payload: Partial<ExpenseRecord>): Promise<any> {
    const id = `exp_${uuidv4().slice(0, 8)}`;
    const voucher = payload.voucherNumber || `VOUCH-${Date.now().toString().slice(-5)}`;
    const date = payload.date || new Date().toISOString().split('T')[0];

    await db.run(
      `INSERT INTO expenses (id, tenant_id, branch_id, category, amount, payment_method, voucher_number, payee, approved_by, date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, branchId, payload.category || 'other', payload.amount || 0,
        payload.paymentMethod || 'cash', voucher, payload.payee || 'সরবরাহকারী',
        payload.approvedBy || 'কর্তৃপক্ষ', date, payload.description || 'মাদ্রাসার নিয়মিত ব্যয়'
      ]
    );

    return { success: true, id, voucherNumber: voucher };
  }
}

export const financeService = new FinanceService();
