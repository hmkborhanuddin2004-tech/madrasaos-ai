import { db } from '../db/db.js';

export interface BranchSummary {
  id: string;
  institution_id: string;
  name_bn: string;
  name_en: string;
  address: string;
  phone: string;
  is_main_branch: number;
  student_count: number;
  teacher_count: number;
  class_count: number;
  created_at: string;
}

export const branchService = {
  getBranches: async (tenantId: string): Promise<BranchSummary[]> => {
    const rows = await db.all<BranchSummary>(`
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.id AND (s.tenant_id = ? OR s.tenant_id = 'inst_main')) as student_count,
        (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND (u.tenant_id = ? OR u.tenant_id = 'inst_main') AND u.role IN ('teacher', 'hifz_teacher', 'principal')) as teacher_count,
        (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.id AND (c.tenant_id = ? OR c.tenant_id = 'inst_main')) as class_count
      FROM branches b
      WHERE (b.institution_id = ? OR b.institution_id = 'inst_main')
      ORDER BY b.is_main_branch DESC, b.name_bn ASC
    `, [tenantId, tenantId, tenantId, tenantId]);

    return rows;
  },

  createBranch: async (tenantId: string, data: {
    name_bn: string;
    name_en?: string;
    address: string;
    phone: string;
    is_main_branch?: boolean;
  }) => {
    const id = `branch_${Date.now()}`;
    const now = new Date().toISOString();

    if (data.is_main_branch) {
      await db.run(`UPDATE branches SET is_main_branch = 0 WHERE institution_id = ? OR institution_id = 'inst_main'`, [tenantId]);
    }

    await db.run(`
      INSERT INTO branches (id, institution_id, name_bn, name_en, address, phone, is_main_branch, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      tenantId,
      data.name_bn,
      data.name_en || data.name_bn,
      data.address,
      data.phone,
      data.is_main_branch ? 1 : 0,
      now
    ]);

    return { id, ...data, created_at: now };
  },

  getBranchStats: async (tenantId: string, branchId: string) => {
    // Group / department distribution
    const departmentStats = await db.all(`
      SELECT 
        c.department,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND (s.tenant_id = ? OR s.tenant_id = 'inst_main')
      WHERE c.branch_id = ? AND (c.tenant_id = ? OR c.tenant_id = 'inst_main')
      GROUP BY c.department
    `, [tenantId, branchId, tenantId]);

    // Section distribution
    const sectionStats = await db.all(`
      SELECT 
        COALESCE(s.section, 'Alif') as section_name,
        COUNT(s.id) as student_count
      FROM students s
      WHERE s.branch_id = ? AND (s.tenant_id = ? OR s.tenant_id = 'inst_main')
      GROUP BY s.section
    `, [branchId, tenantId]);

    // Classes in this branch
    const classes = await db.all(`
      SELECT c.*, COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND (s.tenant_id = ? OR s.tenant_id = 'inst_main')
      WHERE c.branch_id = ? AND (c.tenant_id = ? OR c.tenant_id = 'inst_main')
      GROUP BY c.id
      ORDER BY c.order_index ASC
    `, [tenantId, branchId, tenantId]);

    return {
      departmentStats,
      sectionStats,
      classes
    };
  }
};
