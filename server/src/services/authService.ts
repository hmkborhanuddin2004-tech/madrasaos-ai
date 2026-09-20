import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { User, UserRoleCode } from '../types/index.js';

export class AuthService {
  public async login(identifier: string, passwordPlain: string): Promise<{ token: string; user: User; institution: any; branch: any }> {
    // Lookup by username, phone or email
    const userRow = await db.get<any>(
      `SELECT * FROM users WHERE (username = ? OR phone = ? OR email = ?) AND status = 'active'`,
      [identifier, identifier, identifier]
    );

    if (!userRow) {
      const err: any = new Error('ব্যবহারকারীর নাম অথবা মোবাইল নম্বর সঠিক নয়।');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(passwordPlain, userRow.password_hash);
    if (!isMatch) {
      const err: any = new Error('প্রদত্ত পাসওয়ার্ডটি সঠিক নয়।');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    const institution = await db.get<any>('SELECT * FROM institutions WHERE id = ?', [userRow.tenant_id]);
    const branch = await db.get<any>('SELECT * FROM branches WHERE id = ?', [userRow.branch_id]);

    const assignedClassIds = userRow.assigned_class_ids ? JSON.parse(userRow.assigned_class_ids) : [];
    const linkedStudentIds = userRow.linked_student_ids ? JSON.parse(userRow.linked_student_ids) : [];

    const user: User = {
      id: userRow.id,
      tenantId: userRow.tenant_id,
      branchId: userRow.branch_id,
      username: userRow.username,
      phone: userRow.phone,
      email: userRow.email,
      fullNameBn: userRow.full_name_bn,
      fullNameEn: userRow.full_name_en,
      role: userRow.role as UserRoleCode,
      avatarUrl: userRow.avatar_url,
      status: userRow.status,
      assignedClassIds,
      linkedStudentIds,
      createdAt: userRow.created_at
    };

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        branchId: user.branchId,
        username: user.username,
        role: user.role,
        fullNameBn: user.fullNameBn,
        assignedClassIds,
        linkedStudentIds
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user, institution, branch };
  }

  public async getMe(userId: string): Promise<{ user: User; institution: any; branch: any; branches: any[] }> {
    const userRow = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!userRow) {
      const err: any = new Error('ইউজার প্রোফাইল পাওয়া যায়নি।');
      err.statusCode = 404;
      throw err;
    }

    const institution = await db.get<any>('SELECT * FROM institutions WHERE id = ?', [userRow.tenant_id]);
    const branch = await db.get<any>('SELECT * FROM branches WHERE id = ?', [userRow.branch_id]);
    const branches = await db.all<any>('SELECT * FROM branches WHERE institution_id = ?', [userRow.tenant_id]);

    const user: User = {
      id: userRow.id,
      tenantId: userRow.tenant_id,
      branchId: userRow.branch_id,
      username: userRow.username,
      phone: userRow.phone,
      email: userRow.email,
      fullNameBn: userRow.full_name_bn,
      fullNameEn: userRow.full_name_en,
      role: userRow.role as UserRoleCode,
      status: userRow.status,
      assignedClassIds: userRow.assigned_class_ids ? JSON.parse(userRow.assigned_class_ids) : [],
      linkedStudentIds: userRow.linked_student_ids ? JSON.parse(userRow.linked_student_ids) : [],
      createdAt: userRow.created_at
    };

    return { user, institution, branch, branches };
  }

  public async switchBranch(userId: string, targetBranchId: string): Promise<{ token: string; branch: any }> {
    const userRow = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!userRow) throw new Error('User not found');

    const targetBranch = await db.get<any>(
      'SELECT * FROM branches WHERE id = ? AND institution_id = ?',
      [targetBranchId, userRow.tenant_id]
    );

    if (!targetBranch) {
      const err: any = new Error('নির্বাচিত ক্যাম্পাস শাখা বিদ্যমান নয়।');
      err.statusCode = 404;
      throw err;
    }

    await db.run('UPDATE users SET branch_id = ? WHERE id = ?', [targetBranchId, userId]);

    const token = jwt.sign(
      {
        userId: userRow.id,
        tenantId: userRow.tenant_id,
        branchId: targetBranchId,
        username: userRow.username,
        role: userRow.role,
        fullNameBn: userRow.full_name_bn,
        assignedClassIds: userRow.assigned_class_ids ? JSON.parse(userRow.assigned_class_ids) : [],
        linkedStudentIds: userRow.linked_student_ids ? JSON.parse(userRow.linked_student_ids) : []
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, branch: targetBranch };
  }
}

export const authService = new AuthService();
