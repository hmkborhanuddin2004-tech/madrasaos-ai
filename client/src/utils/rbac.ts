import { UserRole } from '../context/AuthContext';

/**
 * Master Role-Based Access Control (RBAC) Definition for MadrasaOS AI
 */

export interface RolePermissionConfig {
  role: UserRole;
  displayNameBn: string;
  allowedTabs: string[];
  canCustomizeSettings: boolean;
  canAccessFinances: boolean;
  canManageStudents: boolean;
  canManageStaff: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  super_admin: {
    role: 'super_admin',
    displayNameBn: 'সুপার অ্যাডমিন (প্ল্যাটফর্ম কন্ট্রোল)',
    allowedTabs: [
      'dashboard', 'students', 'branches', 'attendance', 'hifz', 'academics',
      'befaq', 'muhasaba', 'finance', 'payroll', 'canteen', 'donations',
      'cash_book', 'sms', 'hostel', 'exams', 'admissions', 'library',
      'certificates', 'portal', 'automation', 'ai', 'settings'
    ],
    canCustomizeSettings: true,
    canAccessFinances: true,
    canManageStudents: true,
    canManageStaff: true
  },

  madrasa_admin: {
    role: 'madrasa_admin',
    displayNameBn: 'মুহতামিম / প্রধান পরিচালক',
    allowedTabs: [
      'dashboard', 'students', 'branches', 'attendance', 'hifz', 'academics',
      'befaq', 'muhasaba', 'finance', 'payroll', 'canteen', 'donations',
      'cash_book', 'sms', 'hostel', 'exams', 'admissions', 'library',
      'certificates', 'portal', 'automation', 'ai', 'settings'
    ],
    canCustomizeSettings: true,
    canAccessFinances: true,
    canManageStudents: true,
    canManageStaff: true
  },

  principal: {
    role: 'principal',
    displayNameBn: 'নাযেমে তা’লীমাত (শিক্ষা সচিব)',
    allowedTabs: [
      'dashboard', 'students', 'branches', 'attendance', 'hifz', 'academics',
      'befaq', 'muhasaba', 'exams', 'admissions', 'library', 'certificates',
      'hostel', 'sms', 'portal', 'automation', 'ai', 'settings'
    ],
    canCustomizeSettings: true,
    canAccessFinances: false,
    canManageStudents: true,
    canManageStaff: true
  },

  teacher: {
    role: 'teacher',
    displayNameBn: 'উস্তাদ / শিক্ষক (কিতাব বিভাগ)',
    allowedTabs: [
      'dashboard', 'attendance', 'hifz', 'academics', 'befaq',
      'muhasaba', 'exams', 'students', 'library', 'payroll', 'portal', 'ai'
    ],
    canCustomizeSettings: false,
    canAccessFinances: false,
    canManageStudents: false,
    canManageStaff: false
  },

  hifz_teacher: {
    role: 'hifz_teacher',
    displayNameBn: 'হাফেজ সাহেব (হিফজ শিক্ষক)',
    allowedTabs: [
      'dashboard', 'hifz', 'muhasaba', 'attendance', 'students',
      'payroll', 'portal', 'ai'
    ],
    canCustomizeSettings: false,
    canAccessFinances: false,
    canManageStudents: false,
    canManageStaff: false
  },

  accountant: {
    role: 'accountant',
    displayNameBn: 'হিসাবরক্ষক (নাজেরে মালি)',
    allowedTabs: [
      'dashboard', 'finance', 'payroll', 'canteen', 'donations',
      'cash_book', 'sms', 'students', 'admissions', 'automation', 'portal', 'ai'
    ],
    canCustomizeSettings: false,
    canAccessFinances: true,
    canManageStudents: false,
    canManageStaff: false
  },

  hostel_manager: {
    role: 'hostel_manager',
    displayNameBn: 'ছাত্রাবাস তত্ত্বাবধায়ক (হোস্টেল সুপার)',
    allowedTabs: [
      'dashboard', 'hostel', 'canteen', 'attendance', 'students', 'portal', 'ai'
    ],
    canCustomizeSettings: false,
    canAccessFinances: false,
    canManageStudents: false,
    canManageStaff: false
  },

  guardian: {
    role: 'guardian',
    displayNameBn: 'সম্মানিত অভিভাবক (পিতা-মাতা)',
    allowedTabs: [
      'dashboard', 'attendance', 'hifz', 'muhasaba', 'finance',
      'exams', 'portal'
    ],
    canCustomizeSettings: false,
    canAccessFinances: false, // only paying own child invoices
    canManageStudents: false,
    canManageStaff: false
  },

  student: {
    role: 'student',
    displayNameBn: 'শিক্ষার্থী (তালিবুল ইলম)',
    allowedTabs: [
      'dashboard', 'muhasaba', 'attendance', 'hifz', 'exams',
      'library', 'portal'
    ],
    canCustomizeSettings: false,
    canAccessFinances: false,
    canManageStudents: false,
    canManageStaff: false
  },

  staff: {
    role: 'staff',
    displayNameBn: 'সাধারণ কর্মচারী',
    allowedTabs: ['dashboard', 'payroll', 'portal'],
    canCustomizeSettings: false,
    canAccessFinances: false,
    canManageStudents: false,
    canManageStaff: false
  },

  librarian: {
    role: 'librarian',
    displayNameBn: 'গ্রন্থাগারিক (লাইব্রেরিয়ান)',
    allowedTabs: ['dashboard', 'library', 'students', 'payroll', 'portal'],
    canCustomizeSettings: false,
    canAccessFinances: false,
    canManageStudents: false,
    canManageStaff: false
  },

  branch_manager: {
    role: 'branch_manager',
    displayNameBn: 'শাখা ব্যবস্থাপক',
    allowedTabs: [
      'dashboard', 'students', 'attendance', 'hifz', 'academics',
      'finance', 'hostel', 'exams', 'portal'
    ],
    canCustomizeSettings: false,
    canAccessFinances: true,
    canManageStudents: true,
    canManageStaff: false
  }
};

/**
 * Checks if a given role is authorized to view a specific tab
 */
export function isTabAllowedForRole(role: UserRole, tabId: string): boolean {
  const config = ROLE_PERMISSIONS[role];
  if (!config) return false;
  return config.allowedTabs.includes(tabId);
}

/**
 * Returns the Bengali human-readable role name
 */
export function getRoleNameBn(role: UserRole): string {
  return ROLE_PERMISSIONS[role]?.displayNameBn || role;
}
