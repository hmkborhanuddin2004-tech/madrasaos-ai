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

  public async getInvoices(tenantId: string, params: { studentId?: string; status?: string; month?: string }): Promise<any[]> {
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

    sql += ' ORDER BY fi.created_at DESC LIMIT 50';
    const rows = await db.all<any>(sql, queryParams);

    return rows.map((r) => ({
      ...r,
      feeItems: JSON.parse(r.fee_items_json || '[]')
    }));
  }

  public async collectPayment(
    tenantId: string,
    receivedByUserId: string,
    payload: {
      invoiceId: string;
      amount: number;
      paymentMethod: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
      transactionId?: string;
    }
  ): Promise<any> {
    const invoice = await db.get<any>(
      'SELECT * FROM fee_invoices WHERE id = ? AND tenant_id = ?',
      [payload.invoiceId, tenantId]
    );

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'paid') throw new Error('Invoice is already fully paid');

    const provider = this.providers[payload.paymentMethod] || this.providers.cash;
    const verification = await provider.processPayment(payload.amount, payload.invoiceId, payload.transactionId);

    if (!verification.isSuccess) {
      throw new Error('Payment verification failed');
    }

    const paymentId = `pay_${uuidv4().slice(0, 8)}`;
    const paymentNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newPaid = invoice.paid_amount + payload.amount;
    const newDue = Math.max(0, invoice.total_amount - newPaid);
    const newStatus = newDue <= 0 ? 'paid' : 'partially_paid';

    await db.transaction(async () => {
      // Record payment
      await db.run(
        `INSERT INTO fee_payments (id, tenant_id, invoice_id, payment_number, student_id, amount, payment_method, transaction_id, status, received_by_user_id, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?)`,
        [paymentId, tenantId, payload.invoiceId, paymentNumber, invoice.student_id, payload.amount, payload.paymentMethod, verification.transactionId, receivedByUserId, todayStr]
      );

      // Update invoice
      await db.run(
        `UPDATE fee_invoices SET paid_amount = ?, due_amount = ?, status = ? WHERE id = ? AND tenant_id = ?`,
        [newPaid, newDue, newStatus, payload.invoiceId, tenantId]
      );
    });

    return {
      success: true,
      paymentId,
      paymentNumber,
      amount: payload.amount,
      newDue,
      invoiceStatus: newStatus
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
