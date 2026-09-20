import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from './auth.js';

export async function logAudit(
  req: AuthenticatedRequest,
  action: string,
  entityName: string,
  entityId: string,
  details: string
): Promise<void> {
  const tenantId = req.user?.tenantId || 'inst_main';
  const userId = req.user?.userId || 'system';
  const userName = req.user?.fullNameBn || req.user?.username || 'System Engine';
  const userRole = req.user?.role || 'system';
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = new Date().toISOString();

  await db.run(`
    INSERT INTO audit_logs (id, tenant_id, user_id, user_name, user_role, action, entity_name, entity_id, details, timestamp, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    `aud_${uuidv4().slice(0, 12)}`,
    tenantId,
    userId,
    userName,
    userRole,
    action,
    entityName,
    entityId,
    details,
    now,
    ipAddress
  ]);
}
