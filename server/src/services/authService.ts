import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { User, UserRoleCode } from '../types/index.js';
import { ProblemDetailsException } from '../utils/problemDetails.js';

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

  public async checkSlugAvailability(slug: string): Promise<{ available: boolean; slug: string }> {
    const cleanSlug = (slug || '').toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const existing = await db.get('SELECT id FROM institutions WHERE code = ? OR id = ?', [cleanSlug, `inst_${cleanSlug}`]);
    return { available: !existing, slug: cleanSlug };
  }

  public async registerMadrasa(payload: {
    madrasaName: string;
    slug: string;
    phone: string;
    email: string;
    address: string;
    adminName: string;
    username: string;
    passwordPlain: string;
    referralCode?: string;
    studentCapacity?: string;
    staffCapacity?: string;
    planType?: string;
  }): Promise<{ token: string; user: User; institution: any; branch: any }> {
    const now = new Date().toISOString();
    const cleanSlug = (payload.slug || payload.username || 'madrasa').toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const tenantId = `inst_${cleanSlug}`;
    const branchId = `br_${cleanSlug}_main`;
    const userId = `usr_${cleanSlug}_${Date.now().toString().slice(-4)}`;

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [payload.username]);
    if (existingUser) {
      const err: any = new Error('এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে। দয়া করে অন্য একটি নির্বাচন করুন।');
      err.statusCode = 400;
      throw err;
    }

    // Check if institution exists, otherwise generate unique id
    const existingInst = await db.get('SELECT id FROM institutions WHERE id = ? OR code = ?', [tenantId, cleanSlug]);
    let finalTenantId = tenantId;
    if (existingInst) {
      finalTenantId = `inst_${cleanSlug}_${Date.now().toString().slice(-4)}`;
    }

    // 1. Create institution
    await db.run(
      `INSERT INTO institutions (id, organization_id, name_bn, name_en, name_ar, code, address, phone, enabled_models, settings_json, created_at)
       VALUES (?, 'org_main', ?, ?, ?, ?, ?, ?, '["qawmi","alia","hifz"]', '{}', ?)`,
      [finalTenantId, payload.madrasaName, payload.madrasaName, payload.madrasaName, cleanSlug, payload.address || 'বাংলাদেশ', payload.phone || '01800000000', now]
    );

    // 2. Create main branch
    await db.run(
      `INSERT INTO branches (id, institution_id, name_bn, name_en, address, phone, is_main_branch, created_at)
       VALUES (?, ?, 'প্রধান ক্যাম্পাস', 'Main Campus', ?, ?, 1, ?)`,
      [branchId, finalTenantId, payload.address || 'বাংলাদেশ', payload.phone || '01800000000', now]
    );

    // 3. Create admin user
    const passwordHash = await bcrypt.hash(payload.passwordPlain, 10);
    const userPhone = payload.phone || `018${Date.now().toString().slice(-8)}`;
    await db.run(
      `INSERT INTO users (id, tenant_id, branch_id, username, password_hash, role, full_name_bn, full_name_en, phone, email, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'madrasa_admin', ?, ?, ?, ?, 'active', ?)`,
      [userId, finalTenantId, branchId, payload.username, passwordHash, payload.adminName, payload.adminName, userPhone, payload.email || '', now]
    );

    // 4. Initialize institution settings
    const { SettingsService } = await import('./settingsService.js');
    const settingsService = new SettingsService();
    await settingsService.ensureSettings(finalTenantId);
    await db.run(
      `UPDATE institution_settings SET
        name_bn = ?,
        name_en = ?,
        address = ?,
        phone = ?,
        email = ?,
        principal_name = ?
       WHERE tenant_id = ?`,
      [payload.madrasaName, payload.madrasaName, payload.address || '', payload.phone || '', payload.email || '', payload.adminName, finalTenantId]
    );

    // 5. Generate token and return login payload
    return this.login(payload.username, payload.passwordPlain);
  }

  public async breakGlass(
    superAdminUserId: string,
    targetTenantId: string,
    reason: string,
    ip?: string,
    requestId?: string
  ): Promise<{
    token: string;
    ephemeralToken: string;
    targetTenantId: string;
    expiresIn: string;
    expiresAt: string;
    message: string;
  }> {
    if (!reason || reason.trim().length < 20) {
      throw new ProblemDetailsException({
        code: 'BREAK_GLASS_REASON_TOO_SHORT',
        title: 'Break Glass Reason Too Short',
        status: 400,
        detail: 'ব্রেক-গ্লাস জরুরি অ্যাক্সেসের জন্য কমপক্ষে ২০ অক্ষরের সুস্পষ্ট কারণ উল্লেখ আবশ্যক।'
      });
    }

    const tenant = await db.get<any>('SELECT * FROM institutions WHERE id = ?', [targetTenantId]);
    if (!tenant) {
      throw new ProblemDetailsException({
        code: 'TENANT_NOT_FOUND',
        title: 'Tenant Not Found',
        status: 404,
        detail: 'লক্ষ্য প্রতিষ্ঠানটি ডাটাবেজে পাওয়া যায়নি।'
      });
    }

    const now = new Date().toISOString();
    // 1. Record High-Severity Audit Log
    const auditId = 'bg_' + Date.now();
    await db.run(
      `INSERT INTO audit_logs (id, tenant_id, user_id, user_name, user_role, action, entity_name, entity_id, details, timestamp, ip_address)
       VALUES (?, ?, ?, 'Super Admin', 'super_admin', 'BREAK_GLASS_ACCESS', 'tenant', ?, ?, ?, ?)`,
      [
        auditId,
        targetTenantId,
        superAdminUserId,
        targetTenantId,
        `জরুরি ব্রেক-গ্লাস প্রবেশাধিকার প্রয়োগ করা হয়েছে। কারণ: ${reason}। অনুরোধ আইডি: ${requestId || 'none'}`,
        now,
        ip || '127.0.0.1'
      ]
    );

    // 2. Queue alert notification to Tenant Muhtamim within 5 minutes
    const muhtamim = await db.get<any>(
      `SELECT id, full_name_bn, phone, email FROM users WHERE tenant_id = ? AND role IN ('madrasa_admin', 'principal') LIMIT 1`,
      [targetTenantId]
    );
    if (muhtamim) {
      await db.run(
        `INSERT INTO notices (id, title, body, created_by, created_at)
         VALUES (?, ?, ?, 'system', ?)`,
        [
          'notice_bg_' + Date.now(),
          'জরুরি নিরাপত্তা বিজ্ঞপ্তি: সুপার এডমিন ব্রেক-গ্লাস অ্যাক্সেস',
          `সম্মানিত মুহতামিম, আপনার মাদ্রাসায় (${tenant.name_bn}) সুপার এডমিন জরুরি ব্রেক-গ্লাস অ্যাক্সেস গ্রহণ করেছেন। কারণ: "${reason}"। সময়: ${now}।`,
          now
        ]
      ).catch(() => {});
    }

    // 3. Issue 15-minute Ephemeral JWT
    const ephemeralToken = jwt.sign(
      {
        userId: superAdminUserId,
        tenantId: targetTenantId,
        branchId: 'main',
        username: 'superadmin_breakglass',
        role: 'super_admin',
        isBreakGlass: true,
        breakGlassReason: reason
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      token: ephemeralToken,
      ephemeralToken,
      targetTenantId,
      expiresIn: '15m',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      message: '১৫ মিনিটের জন্য জরুরি ব্রেক-গ্লাস অ্যাক্সেস মঞ্জুর করা হয়েছে এবং মুহতামিমকে অবহিত করা হয়েছে।'
    };
  }

  public async refreshToken(oldToken: string): Promise<{ token: string }> {
    try {
      const decoded: any = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          tenantId: decoded.tenantId,
          branchId: decoded.branchId,
          username: decoded.username,
          role: decoded.role,
          fullNameBn: decoded.fullNameBn,
          assignedClassIds: decoded.assignedClassIds,
          linkedStudentIds: decoded.linkedStudentIds
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      return { token: newToken };
    } catch {
      const err: any = new Error('অবৈধ বা মেয়াদোত্তীর্ণ রিফ্রেশ টোকেন।');
      err.code = 'INVALID_TOKEN';
      err.statusCode = 401;
      throw err;
    }
  }
}

export const authService = new AuthService();
