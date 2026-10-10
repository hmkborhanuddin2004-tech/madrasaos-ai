import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRoleCode } from '../types/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'madrasaos-secret-key-bangladesh-2026';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  branchId: string;
  username: string;
  role: UserRoleCode;
  fullNameBn: string;
  assignedClassIds?: string[];
  linkedStudentIds?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'অনুগ্রহ করে লগইন করুন (Please authenticate).',
        details: 'Missing or invalid Authorization header.'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;

    // Tenant Isolation Enforcement:
    // If client passes an X-Tenant-ID header, verify it strictly matches token's tenantId (unless super_admin)
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId && decoded.role !== 'super_admin' && headerTenantId !== decoded.tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          message: 'ভিন্ন প্রতিষ্ঠানের তথ্যে প্রবেশাধিকার নিষিদ্ধ (Cross-tenant access forbidden).',
          details: 'Header tenant does not match authorized token tenant.'
        }
      });
    }

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'লগইন সেশনের মেয়াদ উত্তীর্ণ হয়েছে, পুনরায় লগইন করুন।',
        details: err.message
      }
    });
  }
}

export function requireRole(...allowedRoles: UserRoleCode[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'লগইন আবশ্যক।' }
      });
    }

    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'আপনার এই অংশে কাজ করার অনুমতি নেই।',
        details: `Role '${req.user.role}' is not in allowed roles: [${allowedRoles.join(', ')}]`
      }
    });
  };
}

export const authorize = requireRole;
