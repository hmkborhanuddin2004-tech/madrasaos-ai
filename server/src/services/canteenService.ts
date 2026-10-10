import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { CanteenInventoryItem, CanteenTransaction, CanteenMealLog, CanteenCategory } from '../types/index.js';

export class CanteenService {
  public async getInventory(tenantId: string = 'inst_main'): Promise<any[]> {
    const rows = await db.all<any>(
      `SELECT * FROM canteen_inventory WHERE (tenant_id = ? OR tenant_id = 'inst_main') ORDER BY category ASC, item_name_bn ASC`,
      [tenantId]
    );

    return rows.map((r) => ({
      ...r,
      isLowStock: r.current_stock <= r.min_stock_alert,
      totalValuation: Math.round(r.current_stock * r.unit_price)
    }));
  }

  public async addInventoryItem(
    tenantId: string = 'inst_main',
    payload: {
      item_name_bn: string;
      category: CanteenCategory;
      unit: string;
      current_stock?: number;
      min_stock_alert?: number;
      unit_price?: number;
    }
  ): Promise<CanteenInventoryItem> {
    if (!payload.item_name_bn || !payload.unit) {
      const err: any = new Error('পণ্যের নাম এবং পরিমাপের একক আবশ্যক');
      err.statusCode = 400;
      throw err;
    }

    const id = `cant_item_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO canteen_inventory (id, tenant_id, item_name_bn, category, unit, current_stock, min_stock_alert, unit_price, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        payload.item_name_bn,
        payload.category || 'groceries',
        payload.unit,
        Number(payload.current_stock || 0),
        Number(payload.min_stock_alert || 10),
        Number(payload.unit_price || 0),
        now
      ]
    );

    return (await db.get<any>(`SELECT * FROM canteen_inventory WHERE id = ?`, [id]))!;
  }

  public async recordTransaction(
    tenantId: string = 'inst_main',
    payload: {
      type: 'purchase_inflow' | 'consumption_outflow';
      item_id: string;
      quantity: number;
      total_cost?: number;
      supplier_name?: string;
      voucher_no?: string;
      date?: string;
      notes?: string;
    }
  ): Promise<CanteenTransaction> {
    const qty = Number(payload.quantity);
    if (!payload.item_id || !qty || qty <= 0) {
      const err: any = new Error('পণ্যের আইডি এবং সঠিক পরিমাণ আবশ্যক');
      err.statusCode = 400;
      throw err;
    }

    const item = await db.get<any>(`SELECT * FROM canteen_inventory WHERE id = ?`, [payload.item_id]);
    if (!item) {
      const err: any = new Error('ইনভেন্টরি পণ্য খুঁজে পাওয়া যায়নি');
      err.statusCode = 404;
      throw err;
    }

    if (payload.type === 'consumption_outflow' && item.current_stock < qty) {
      const err: any = new Error(`মজুদ অপর্যাপ্ত! বর্তমান মজুদ: ${item.current_stock} ${item.unit}`);
      err.statusCode = 400;
      throw err;
    }

    const totalCost = Number(payload.total_cost || qty * item.unit_price);
    const voucherNo = payload.voucher_no || `VCH-CANT-${Date.now().toString().slice(-6)}`;
    const date = payload.date || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const id = `ctx_${uuidv4().slice(0, 8)}`;

    await db.transaction(async () => {
      // 1. Insert transaction
      await db.run(
        `INSERT INTO canteen_transactions (id, tenant_id, type, item_id, quantity, total_cost, supplier_name, voucher_no, date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tenantId, payload.type, payload.item_id, qty, totalCost, payload.supplier_name || null, voucherNo, date, payload.notes || null, now]
      );

      // 2. Adjust stock
      const stockDelta = payload.type === 'purchase_inflow' ? qty : -qty;
      await db.run(
        `UPDATE canteen_inventory SET current_stock = current_stock + ?, updated_at = ? WHERE id = ?`,
        [stockDelta, now, payload.item_id]
      );
    });

    const tx = await db.get<any>(
      `SELECT t.*, i.item_name_bn, i.unit 
       FROM canteen_transactions t 
       JOIN canteen_inventory i ON t.item_id = i.id 
       WHERE t.id = ?`,
      [id]
    );
    return tx!;
  }

  public async getTransactions(tenantId: string = 'inst_main'): Promise<any[]> {
    return await db.all<any>(
      `SELECT t.*, i.item_name_bn, i.unit 
       FROM canteen_transactions t 
       JOIN canteen_inventory i ON t.item_id = i.id 
       WHERE (t.tenant_id = ? OR t.tenant_id = 'inst_main')
       ORDER BY t.created_at DESC LIMIT 50`,
      [tenantId]
    );
  }

  public async logMeal(
    tenantId: string = 'inst_main',
    payload: {
      date?: string;
      meal_type: 'breakfast' | 'lunch' | 'dinner';
      menu_description: string;
      headcount_students: number;
      headcount_staff: number;
      total_cost?: number;
      prepared_by?: string;
    }
  ): Promise<CanteenMealLog> {
    if (!payload.menu_description || !payload.meal_type) {
      const err: any = new Error('খাবারের ধরণ এবং মেন্যু বিবরণ আবশ্যক');
      err.statusCode = 400;
      throw err;
    }

    const id = `meal_${uuidv4().slice(0, 8)}`;
    const date = payload.date || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO canteen_meal_logs (id, tenant_id, date, meal_type, menu_description, headcount_students, headcount_staff, total_cost, prepared_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        date,
        payload.meal_type,
        payload.menu_description,
        Number(payload.headcount_students || 0),
        Number(payload.headcount_staff || 0),
        Number(payload.total_cost || 0),
        payload.prepared_by || 'মো. জামাল হোসেন বাবুর্চি',
        now
      ]
    );

    return (await db.get<any>(`SELECT * FROM canteen_meal_logs WHERE id = ?`, [id]))!;
  }

  public async getMealLogs(tenantId: string = 'inst_main', date?: string): Promise<any[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return await db.all<any>(
      `SELECT * FROM canteen_meal_logs 
       WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND date = ?
       ORDER BY created_at DESC`,
      [tenantId, targetDate]
    );
  }

  public async getSummary(tenantId: string = 'inst_main'): Promise<any> {
    const items = await this.getInventory(tenantId);
    const lowStockCount = items.filter((i) => i.isLowStock).length;
    const totalValuation = items.reduce((acc, i) => acc + i.totalValuation, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayMeals = await this.getMealLogs(tenantId, today);
    const todayMealCost = todayMeals.reduce((acc, m) => acc + Number(m.total_cost || 0), 0);
    const totalHeadcount = todayMeals.reduce((acc, m) => acc + Number(m.headcount_students || 0) + Number(m.headcount_staff || 0), 0);

    return {
      totalItems: items.length,
      lowStockCount,
      totalValuation,
      todayMealCost,
      totalHeadcount,
      todayMealsCount: todayMeals.length
    };
  }
}

export const canteenService = new CanteenService();
