import { Router, Response } from 'express';
import { libraryService } from '../services/libraryService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { search } = req.query;
    const data = await libraryService.getBooks(req.user!.tenantId, search as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('super_admin', 'madrasa_admin', 'librarian'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await libraryService.addBook(req.user!.tenantId, req.body);
    await logAudit(req, 'ADD_BOOK', 'library_book', result.id, `লাইব্রেরিতে নতুন কিতাব যুক্ত করা হয়েছে: ${req.body.titleBn}`);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
