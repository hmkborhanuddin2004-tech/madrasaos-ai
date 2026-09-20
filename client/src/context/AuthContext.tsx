import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LanguageCode } from '../i18n/translations';

export type UserRole =
  | 'super_admin'
  | 'madrasa_admin'
  | 'principal'
  | 'teacher'
  | 'hifz_teacher'
  | 'accountant'
  | 'hostel_manager'
  | 'guardian'
  | 'student';

export interface UserProfile {
  id: string;
  username: string;
  fullNameBn: string;
  fullNameEn: string;
  role: UserRole;
  phone: string;
  tenantId: string;
  branchId: string;
  assignedClassIds?: string[];
  linkedStudentIds?: string[];
}

interface AuthContextType {
  user: UserProfile;
  token: string | null;
  language: LanguageCode;
  t: (key: string) => string;
  setLanguage: (lang: LanguageCode) => void;
  switchRole: (role: UserRole) => Promise<void>;
  activeBranch: { id: string; nameBn: string; nameEn: string };
  branches: { id: string; nameBn: string; nameEn: string }[];
  setActiveBranchId: (branchId: string) => void;
  networkStatus: 'online' | 'offline' | 'syncing';
  apiCall: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

// Preset demo users for seamless role switching in pair programming / review
const DEMO_USERS: Record<UserRole, { identifier: string; password: string; nameBn: string; nameEn: string }> = {
  super_admin: { identifier: 'superadmin', password: 'admin123', nameBn: 'সুপার এডমিন', nameEn: 'Super Admin' },
  madrasa_admin: { identifier: 'muhtamim', password: 'admin123', nameBn: 'মাওলানা আব্দুল কুদ্দুস', nameEn: 'Maulana Abdul Quddus' },
  principal: { identifier: 'principal', password: 'admin123', nameBn: 'মাওলানা মাহমুদুল হাসান', nameEn: 'Maulana Mahmudul Hasan' },
  teacher: { identifier: 'teacher_rashid', password: 'teacher123', nameBn: 'মাওলানা হারুনুর রশিদ', nameEn: 'Maulana Harunur Rashid' },
  hifz_teacher: { identifier: 'hafez_zubair', password: 'hifz123', nameBn: 'হাফেজ ক্বারী জুবায়ের আহমেদ', nameEn: 'Hafez Qari Zubair Ahmed' },
  accountant: { identifier: 'accountant_faruq', password: 'account123', nameBn: 'মুহাম্মদ ফারুক হোসেন', nameEn: 'Mohammad Faruq Hossain' },
  hostel_manager: { identifier: 'warden_ismail', password: 'hostel123', nameBn: 'মাওলানা ইসমাইল হোসেন', nameEn: 'Maulana Ismail Hossain' },
  guardian: { identifier: '01811111111', password: 'parent123', nameBn: 'জনাব আব্দুর সালাম', nameEn: 'Abdur Salam' },
  student: { identifier: 'student_abdullah', password: 'student123', nameBn: 'আব্দুল্লাহ আল-মামুন', nameEn: 'Abdullah Al-Mamun' }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('madrasa_token'));
  const [language, setLanguageState] = useState<LanguageCode>('bn');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'syncing'>('online');

  const [user, setUser] = useState<UserProfile>({
    id: 'usr_muhtamim',
    username: 'muhtamim',
    fullNameBn: 'মাওলানা আব্দুল কুদ্দুস',
    fullNameEn: 'Maulana Abdul Quddus',
    role: 'madrasa_admin',
    phone: '01711111111',
    tenantId: 'inst_main',
    branchId: 'branch_mirpur',
    assignedClassIds: [],
    linkedStudentIds: []
  });

  const branches = [
    { id: 'branch_mirpur', nameBn: 'প্রধান ক্যাম্পাস (মিরপুর)', nameEn: 'Main Campus (Mirpur)' },
    { id: 'branch_uttara', nameBn: 'উত্তরা শাখা ক্যাম্পাস', nameEn: 'Uttara Branch Campus' }
  ];

  const [activeBranchId, setActiveBranchIdState] = useState<string>('branch_mirpur');
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Language management with RTL support
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['bn']?.[key] || key;
  };

  // Switch role and automatically fetch authentic JWT from backend
  const switchRole = async (targetRole: UserRole) => {
    const cred = DEMO_USERS[targetRole];
    try {
      setNetworkStatus('syncing');
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cred.identifier, password: cred.password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('madrasa_token', data.data.token);
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
      setUser((prev) => ({
        ...prev,
        role: targetRole,
        fullNameBn: cred.nameBn,
        fullNameEn: cred.nameEn
      }));
    } finally {
      setNetworkStatus('online');
    }
  };

  const setActiveBranchId = (bId: string) => {
    setActiveBranchIdState(bId);
    if (token) {
      apiCall('/api/v1/auth/switch-branch', {
        method: 'POST',
        body: JSON.stringify({ branchId: bId })
      }).catch(console.error);
    }
  };

  // Standardized API wrapper
  const apiCall = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': user.tenantId,
      'X-Branch-ID': activeBranchId,
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data as T;
    } catch (err: any) {
      console.error(`API Call Error [${endpoint}]:`, err);
      throw err;
    }
  };

  // On mount, establish authentication session
  useEffect(() => {
    switchRole('madrasa_admin');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        language,
        t,
        setLanguage,
        switchRole,
        activeBranch,
        branches,
        setActiveBranchId,
        networkStatus,
        apiCall
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
