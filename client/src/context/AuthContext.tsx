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
  user: UserProfile | null;
  token: string | null;
  language: LanguageCode;
  t: (key: string) => string;
  setLanguage: (lang: LanguageCode) => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  updateCurrentUser: (partial: Partial<UserProfile>) => void;
  activeBranch: { id: string; nameBn: string; nameEn: string };
  branches: { id: string; nameBn: string; nameEn: string }[];
  setActiveBranchId: (branchId: string) => void;
  networkStatus: 'online' | 'offline' | 'syncing';
  toggleNetworkStatus: () => void;
  addBranch: (nameBn: string, nameEn?: string) => Promise<void>;
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
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('madrasa_token') || localStorage.getItem('token')
  );
  const [language, setLanguageState] = useState<LanguageCode>('bn');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'syncing'>(() => {
    return (localStorage.getItem('madrasa_network_status') as any) || 'online';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('madrasa_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [branches, setBranches] = useState([
    { id: 'branch_mirpur', nameBn: 'প্রধান ক্যাম্পাস (মিরপুর)', nameEn: 'Main Campus (Mirpur)' },
    { id: 'branch_uttara', nameBn: 'উত্তরা শাখা ক্যাম্পাস', nameEn: 'Uttara Branch Campus' }
  ]);

  const [activeBranchId, setActiveBranchIdState] = useState<string>('branch_mirpur');
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const toggleNetworkStatus = () => {
    setNetworkStatus((prev) => {
      const next = prev === 'online' ? 'offline' : 'online';
      localStorage.setItem('madrasa_network_status', next);
      return next;
    });
  };

  const addBranch = async (nameBn: string, nameEn?: string) => {
    const newId = `branch_${Date.now()}`;
    const newBranch = {
      id: newId,
      nameBn: nameBn.trim(),
      nameEn: nameEn?.trim() || nameBn.trim()
    };
    setBranches((prev) => [...prev, newBranch]);
    setActiveBranchIdState(newId);
    try {
      await apiCall('/api/v1/branches', {
        method: 'POST',
        body: JSON.stringify({ name_bn: newBranch.nameBn, name_en: newBranch.nameEn })
      });
    } catch {}
  };

  // Language management with RTL support
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['bn']?.[key] || key;
  };

  // Real Login
  const login = async (identifier: string, password: string) => {
    setNetworkStatus('syncing');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'লগইন ব্যর্থ হয়েছে।');
      }
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('madrasa_token', data.data.token);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('madrasa_user', JSON.stringify(data.data.user));
    } finally {
      setNetworkStatus('online');
    }
  };

  // Madrasa Registration
  const register = async (formData: any) => {
    setNetworkStatus('syncing');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
      }
      if (data.data?.token) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('madrasa_token', data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('madrasa_user', JSON.stringify(data.data.user));
      }
    } finally {
      setNetworkStatus('online');
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('madrasa_token');
    localStorage.removeItem('token');
    localStorage.removeItem('madrasa_user');
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
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('madrasa_user', JSON.stringify(data.data.user));
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
      setUser((prev) => (prev ? {
        ...prev,
        role: targetRole,
        fullNameBn: cred.nameBn,
        fullNameEn: cred.nameEn
      } : {
        id: `usr_${targetRole}`,
        username: cred.identifier,
        fullNameBn: cred.nameBn,
        fullNameEn: cred.nameEn,
        role: targetRole,
        phone: '01711111111',
        tenantId: 'inst_main',
        branchId: 'branch_mirpur',
        assignedClassIds: [],
        linkedStudentIds: targetRole === 'student' || targetRole === 'guardian' ? ['std_001'] : []
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
      'X-Tenant-ID': user?.tenantId || 'inst_main',
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

      // Handle 401 gracefully — clear session and reload to login (no external redirect)
      if (response.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('madrasa_token');
        localStorage.removeItem('token');
        localStorage.removeItem('madrasa_user');
        throw new Error('সেশন মেয়াদ উত্তীর্ণ। আবার লগইন করুন।');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data as T;
    } catch (err: any) {
      // Prevent any navigation outside the app
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        setNetworkStatus('offline');
      }
      console.error(`API Call Error [${endpoint}]:`, err);
      throw err;
    }
  };


  const updateCurrentUser = (partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('madrasa_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        language,
        t,
        setLanguage,
        login,
        register,
        logout,
        switchRole,
        updateCurrentUser,
        activeBranch,
        branches,
        setActiveBranchId,
        networkStatus,
        toggleNetworkStatus,
        addBranch,
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
