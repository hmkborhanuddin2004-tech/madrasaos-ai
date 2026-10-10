import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { Donor, DonationReceipt, DonationFundType, DonorCategory, CommitmentFrequency } from '../types/index.js';

export class DonationService {
  public async getDonors(
    tenantId: string,
    params: { category?: string; query?: string } = {}
  ): Promise<any[]> {
    let sql = `SELECT * FROM donors WHERE (tenant_id = ? OR tenant_id = 'inst_main')`;
    const queryParams: any[] = [tenantId];

    if (params.category) {
      sql += ' AND category = ?';
      queryParams.push(params.category);
    }

    if (params.query) {
      sql += ' AND (name LIKE ? OR org_name LIKE ? OR contact_phone LIKE ?)';
      const q = `%${params.query}%`;
      queryParams.push(q, q, q);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = await db.all<any>(sql, queryParams);

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      organizationId: r.organization_id,
      name: r.name,
      orgName: r.org_name,
      org_name: r.org_name,
      category: r.category as DonorCategory,
      contactPhone: r.contact_phone,
      contact_phone: r.contact_phone,
      whatsapp: r.whatsapp,
      email: r.email,
      commitmentFrequency: r.commitment_frequency as CommitmentFrequency,
      commitment_frequency: r.commitment_frequency as CommitmentFrequency,
      createdAt: r.created_at,
      created_at: r.created_at
    }));
  }

  public async getDonorById(tenantId: string, id: string): Promise<any> {
    const donor = await db.get<any>(
      `SELECT * FROM donors WHERE id = ? AND (tenant_id = ? OR tenant_id = 'inst_main')`,
      [id, tenantId]
    );

    if (!donor) {
      const err: any = new Error('দাতা খুঁজে পাওয়া যায়নি (Donor not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const receipts = await db.all<any>(
      `SELECT * FROM donation_receipts WHERE donor_id = ? ORDER BY created_at DESC`,
      [id]
    );

    return {
      id: donor.id,
      name: donor.name,
      orgName: donor.org_name,
      org_name: donor.org_name,
      category: donor.category,
      contactPhone: donor.contact_phone,
      contact_phone: donor.contact_phone,
      whatsapp: donor.whatsapp,
      email: donor.email,
      commitmentFrequency: donor.commitment_frequency,
      commitment_frequency: donor.commitment_frequency,
      createdAt: donor.created_at,
      created_at: donor.created_at,
      receipts: receipts.map((r) => ({
        id: r.id,
        receiptNo: r.receipt_no,
        receipt_no: r.receipt_no,
        fundType: r.fund_type,
        fund_type: r.fund_type,
        amount: r.amount,
        paymentMethod: r.payment_method,
        payment_method: r.payment_method,
        paymentReference: r.payment_reference,
        payment_reference: r.payment_reference,
        notes: r.notes,
        createdAt: r.created_at,
        created_at: r.created_at
      }))
    };
  }

  public async createDonor(tenantId: string, payload: any): Promise<any> {
    const name = payload.name;
    if (!name || typeof name !== 'string' || !name.trim()) {
      const err: any = new Error('দাতার নাম আবশ্যক (Donor name is required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const id = payload.id || `dnr_${uuidv4().slice(0, 8)}`;
    const orgName = payload.org_name || payload.orgName || null;
    const category = payload.category || 'one_time';
    const contactPhone = payload.contact_phone || payload.contactPhone || null;
    const whatsapp = payload.whatsapp || null;
    const email = payload.email || null;
    const commitmentFrequency = payload.commitment_frequency || payload.commitmentFrequency || 'none';
    const createdAt = payload.created_at || payload.createdAt || new Date().toISOString();

    await db.run(
      `INSERT INTO donors (id, tenant_id, organization_id, name, org_name, category, contact_phone, whatsapp, email, commitment_frequency, created_at)
       VALUES (?, ?, 'org_main', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, name.trim(), orgName, category, contactPhone, whatsapp, email, commitmentFrequency, createdAt]
    );

    return {
      id,
      tenantId,
      organizationId: 'org_main',
      name: name.trim(),
      orgName,
      org_name: orgName,
      category,
      contactPhone,
      contact_phone: contactPhone,
      whatsapp,
      email,
      commitmentFrequency,
      commitment_frequency: commitmentFrequency,
      createdAt,
      created_at: createdAt
    };
  }

  public async updateDonor(tenantId: string, id: string, payload: any): Promise<any> {
    const existing = await db.get<any>(
      `SELECT * FROM donors WHERE id = ? AND (tenant_id = ? OR tenant_id = 'inst_main')`,
      [id, tenantId]
    );
    if (!existing) {
      const err: any = new Error('দাতা খুঁজে পাওয়া যায়নি (Donor not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const name = payload.name !== undefined ? payload.name : existing.name;
    const orgName = payload.org_name !== undefined ? payload.org_name : (payload.orgName !== undefined ? payload.orgName : existing.org_name);
    const category = payload.category !== undefined ? payload.category : existing.category;
    const contactPhone = payload.contact_phone !== undefined ? payload.contact_phone : (payload.contactPhone !== undefined ? payload.contactPhone : existing.contact_phone);
    const whatsapp = payload.whatsapp !== undefined ? payload.whatsapp : existing.whatsapp;
    const email = payload.email !== undefined ? payload.email : existing.email;
    const commitmentFrequency = payload.commitment_frequency !== undefined ? payload.commitment_frequency : (payload.commitmentFrequency !== undefined ? payload.commitmentFrequency : existing.commitment_frequency);

    await db.run(
      `UPDATE donors 
       SET name = ?, org_name = ?, category = ?, contact_phone = ?, whatsapp = ?, email = ?, commitment_frequency = ?
       WHERE id = ?`,
      [name, orgName, category, contactPhone, whatsapp, email, commitmentFrequency, id]
    );

    return {
      id,
      tenantId: existing.tenant_id,
      name,
      orgName,
      org_name: orgName,
      category,
      contactPhone,
      contact_phone: contactPhone,
      whatsapp,
      email,
      commitmentFrequency,
      commitment_frequency: commitmentFrequency,
      createdAt: existing.created_at,
      created_at: existing.created_at
    };
  }

  public async createReceipt(tenantId: string, payload: any): Promise<any> {
    const donorId = payload.donor_id || payload.donorId;
    const fundType = payload.fund_type || payload.fundType;
    const amount = Number(payload.amount);
    const paymentMethod = payload.payment_method || payload.paymentMethod || 'cash';
    const paymentReference = payload.payment_reference || payload.paymentReference || payload.transaction_id || payload.transactionId || null;
    const notes = payload.notes || payload.description || null;
    const createdAt = payload.created_at || payload.createdAt || payload.date || new Date().toISOString();

    if (!donorId) {
      const err: any = new Error('দাতা আইডি আবশ্যক (donor_id is required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
      const err: any = new Error('অনুদানের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে (Amount must be greater than 0)');
      err.statusCode = 400;
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const validFunds: DonationFundType[] = ['lillah_orphan', 'general', 'waqf_construction'];
    if (!validFunds.includes(fundType)) {
      const err: any = new Error(`অবৈধ তহবিল ক্যাটাগরি (${fundType})। গ্রহণযোগ্য: lillah_orphan, general, waqf_construction`);
      err.statusCode = 400;
      err.code = 'INVALID_FUND_TYPE';
      throw err;
    }

    // Determine receipt number
    const receiptNo =
      payload.receipt_no ||
      payload.receiptNo ||
      `RCP-DON-${new Date().toISOString().slice(0, 7).replace('-', '')}-${uuidv4().slice(0, 5).toUpperCase()}`;

    // Idempotency / Duplicate Check
    const existingReceipt = await db.get<any>(
      `SELECT id, receipt_no FROM donation_receipts WHERE receipt_no = ?`,
      [receiptNo]
    );
    if (existingReceipt) {
      const err: any = new Error(`এই রসিদ নম্বর (${receiptNo}) ইতিমধ্যে বিদ্যমান`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_RECEIPT';
      throw err;
    }

    // Check donor exists
    const donor = await db.get<any>(
      `SELECT * FROM donors WHERE id = ?`,
      [donorId]
    );

    const id = `rcp_don_${uuidv4().slice(0, 8)}`;

    await db.run(
      `INSERT INTO donation_receipts (id, tenant_id, organization_id, receipt_no, donor_id, fund_type, amount, payment_method, payment_reference, notes, created_at)
       VALUES (?, ?, 'org_main', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, receiptNo, donorId, fundType, amount, paymentMethod, paymentReference, notes, createdAt]
    );

    return {
      id,
      tenantId,
      organizationId: 'org_main',
      receiptNo,
      receipt_no: receiptNo,
      donorId,
      donor_id: donorId,
      donorName: donor?.name || 'শুভাকাঙ্ক্ষী',
      donor_name: donor?.name || 'শুভাকাঙ্ক্ষী',
      fundType,
      fund_type: fundType,
      amount,
      paymentMethod,
      payment_method: paymentMethod,
      paymentReference,
      payment_reference: paymentReference,
      notes,
      createdAt,
      created_at: createdAt
    };
  }

  public async getReceipts(
    tenantId: string,
    params: { fundType?: string; fund_type?: string; donorId?: string; donor_id?: string; startDate?: string; endDate?: string } = {}
  ): Promise<any[]> {
    let sql = `
      SELECT dr.*, d.name as donor_name, d.category as donor_category, d.contact_phone as donor_phone
      FROM donation_receipts dr
      LEFT JOIN donors d ON dr.donor_id = d.id
      WHERE (dr.tenant_id = ? OR dr.tenant_id = 'inst_main')
    `;
    const queryParams: any[] = [tenantId];

    const fund = params.fund_type || params.fundType;
    if (fund) {
      sql += ' AND dr.fund_type = ?';
      queryParams.push(fund);
    }

    const donor = params.donor_id || params.donorId;
    if (donor) {
      sql += ' AND dr.donor_id = ?';
      queryParams.push(donor);
    }

    if (params.startDate) {
      sql += ' AND dr.created_at >= ?';
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      sql += ' AND dr.created_at <= ?';
      queryParams.push(params.endDate);
    }

    sql += ' ORDER BY dr.created_at DESC';
    const rows = await db.all<any>(sql, queryParams);

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      receiptNo: r.receipt_no,
      receipt_no: r.receipt_no,
      donorId: r.donor_id,
      donor_id: r.donor_id,
      donorName: r.donor_name || 'শুভাকাঙ্ক্ষী',
      donor_name: r.donor_name || 'শুভাকাঙ্ক্ষী',
      donorCategory: r.donor_category,
      donor_category: r.donor_category,
      donorPhone: r.donor_phone,
      donor_phone: r.donor_phone,
      fundType: r.fund_type,
      fund_type: r.fund_type,
      amount: r.amount,
      paymentMethod: r.payment_method,
      payment_method: r.payment_method,
      paymentReference: r.payment_reference,
      payment_reference: r.payment_reference,
      notes: r.notes,
      createdAt: r.created_at,
      created_at: r.created_at
    }));
  }

  public async getFundsSummary(tenantId: string): Promise<any> {
    const rows = await db.all<any>(
      `SELECT fund_type, COUNT(*) as count, SUM(amount) as total_amount
       FROM donation_receipts
       WHERE (tenant_id = ? OR tenant_id = 'inst_main')
       GROUP BY fund_type`,
      [tenantId]
    );

    const funds: Record<string, { total: number; total_amount: number; count: number }> = {
      lillah_orphan: { total: 0, total_amount: 0, count: 0 },
      general: { total: 0, total_amount: 0, count: 0 },
      waqf_construction: { total: 0, total_amount: 0, count: 0 }
    };

    let grandTotal = 0;
    for (const r of rows) {
      if (funds[r.fund_type]) {
        funds[r.fund_type].total = r.total_amount || 0;
        funds[r.fund_type].total_amount = r.total_amount || 0;
        funds[r.fund_type].count = r.count || 0;
        grandTotal += (r.total_amount || 0);
      }
    }

    return {
      funds,
      lillah_orphan: funds.lillah_orphan,
      general: funds.general,
      waqf_construction: funds.waqf_construction,
      total_collected: grandTotal,
      grand_total: grandTotal
    };
  }
}

export const donationService = new DonationService();
