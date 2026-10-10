import { Router, Response } from 'express';
import { canteenService } from '../services/canteenService.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';

export const canteenRoutes = Router();

canteenRoutes.use(authenticate);

// Get inventory items
canteenRoutes.get('/inventory', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await canteenService.getInventory(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Add new inventory item
canteenRoutes.post('/inventory', authorize('super_admin', 'madrasa_admin', 'accountant', 'hostel_manager'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await canteenService.addInventoryItem(tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Record stock purchase or consumption transaction
canteenRoutes.post('/transactions', authorize('super_admin', 'madrasa_admin', 'accountant', 'hostel_manager'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await canteenService.recordTransaction(tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Get transactions
canteenRoutes.get('/transactions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await canteenService.getTransactions(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Log daily meal
canteenRoutes.post('/meals', authorize('super_admin', 'madrasa_admin', 'hostel_manager', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await canteenService.logMeal(tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Get meal logs
canteenRoutes.get('/meals', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const { date } = req.query;
    const data = await canteenService.getMealLogs(tenantId, date as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Get summary metrics
canteenRoutes.get('/summary', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await canteenService.getSummary(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
