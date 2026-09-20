import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().slice(0, 8)}`;
  const statusCode = err.statusCode || 500;
  
  // Log detailed technical error internally on server console
  console.error(`[ERROR] [${requestId}] ${req.method} ${req.originalUrl}:`, err);

  // Return clean, user-friendly, non-technical response without leaking stack traces
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.userMessage || 'সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    }
  });
}
