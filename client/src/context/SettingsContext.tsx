import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface LateFeeSettings {
  grace_days: number;
  amount: number;
  type: 'fixed' | 'daily' | 'percentage';
  description?: string;
}

export interface SecuritySettings {
  two_factor_auth?: boolean;
  password_expiry_days?: number;
  session_timeout_minutes?: number;
  ip_restriction?: boolean;
}

export interface InstitutionSettings {
  id?: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  principalName?: string;
  logoUrl?: string;
  address?: string;
  email?: string;
  phone?: string;
  establishedYear?: number;
  madrasaType: 'Qawmi' | 'Alia' | 'Hifz' | 'Mixed';
  tagline?: string;
  primaryColor: string;
  currencySymbol: string;
  hijriYearEnabled: boolean;
  academicYearType: 'hijri' | 'gregorian';
  smsSenderId?: string;
  brevoApiKey?: string;
  geminiApiKey?: string;
  whatsappEnabled: boolean;
  messengerEnabled: boolean;
  emailEnabled: boolean;
  lateFeeSettings: LateFeeSettings;
  designationLabels: Record<string, string>;
  customDepartments: string[];
  securitySettings?: SecuritySettings;
}

export interface FeeCategory {
  id: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one_time' | 'per_term';
  ledgerType?: 'residential' | 'non_residential';
  description?: string;
  isActive: boolean;
}

export interface ClassDefinition {
  id: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  orderIndex: number;
  department?: string;
}

export interface SubjectDefinition {
  id: string;
  tenantId: string;
  classId?: string;
  nameBn: string;
  nameEn: string;
  code?: string;
  totalMarks: number;
  passMarks: number;
}

export interface SettingsContextType {
  settings: InstitutionSettings;
  feeCategories: FeeCategory[];
  classDefinitions: ClassDefinition[];
  subjectDefinitions: SubjectDefinition[];
  loading: boolean;
  updateSettingsPreview: (partial: Partial<InstitutionSettings>) => void;
  saveSettings: (payload?: Partial<InstitutionSettings>) => Promise<boolean>;
  reloadSettings: () => Promise<void>;
  uploadLogo: (base64Data: string, filename?: string) => Promise<string>;
  getDesignationLabel: (roleKey: string) => string;
  createFeeCategory: (data: Partial<FeeCategory>) => Promise<FeeCategory>;
  updateFeeCategory: (id: string, data: Partial<FeeCategory>) => Promise<FeeCategory>;
  deleteFeeCategory: (id: string) => Promise<boolean>;
  createClassDefinition: (data: Partial<ClassDefinition>) => Promise<ClassDefinition>;
  updateClassDefinition: (id: string, data: Partial<ClassDefinition>) => Promise<ClassDefinition>;
  deleteClassDefinition: (id: string) => Promise<boolean>;
  createSubjectDefinition: (data: Partial<SubjectDefinition>) => Promise<SubjectDefinition>;
  updateSubjectDefinition: (id: string, data: Partial<SubjectDefinition>) => Promise<SubjectDefinition>;
  deleteSubjectDefinition: (id: string) => Promise<boolean>;
  addDepartment: (name: string) => Promise<void>;
  deleteDepartment: (name: string) => Promise<void>;
  updateDesignationLabels: (labels: Record<string, string>) => Promise<void>;
}

const defaultDesignations: Record<string, string> = {
  muhtamim: 'মুহতামিম (প্রধান পরিচালক)',
  naib_muhtamim: 'নায়েবে মুহতামিম (উপ-পরিচালক)',
  principal: 'নাযেমে তা’লীমাত (অধ্যক্ষ)',
  shaykhul_hadith: 'শায়খুল হাদীস',
  senior_muhaddis: 'সিনিয়র মুহাদ্দিস',
  kitab_teacher: 'কিতাব শিক্ষক (ওস্তাদ)',
  hifz_teacher: 'হাফেজ সাহেব (হিফজ শিক্ষক)',
  nazir_office: 'নাজের / অফিস সহকারী',
  cook_hostel: 'বাবুর্চি / হোস্টেল স্টাফ',
  security: 'নিরাপত্তা কর্মী'
};

const defaultDepartments = [
  'হিফজুল কুরআন বিভাগ',
  'কিতাব বিভাগ (দরসে নিজামী)',
  'নূরানী ও নাজেরা বিভাগ',
  'ইফতা ও ফতোয়া বিভাগ',
  'ক্বিরাআত ও তাজবীদ বিভাগ'
];

const defaultSettings: InstitutionSettings = {
  tenantId: 'inst_main',
  nameBn: 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা',
  nameEn: 'Jamia Islamia Model Madrasa',
  principalName: 'মাওলানা মাহমুদুল হাসান',
  logoUrl: '',
  address: 'প্লট ১৪, সেকশন ৬, মিরপুর, ঢাকা-১২১৬',
  email: 'info@jamia-islamia.edu.bd',
  phone: '01711111111',
  establishedYear: 1994,
  madrasaType: 'Qawmi',
  tagline: 'ইলম, আমল ও খুলুসিয়্যাতের অনন্য দ্বীনি প্রতিষ্ঠান',
  primaryColor: '#059669',
  currencySymbol: '৳',
  hijriYearEnabled: true,
  academicYearType: 'hijri',
  smsSenderId: 'MADRASA_OS',
  brevoApiKey: '',
  geminiApiKey: '',
  whatsappEnabled: true,
  messengerEnabled: true,
  emailEnabled: true,
  lateFeeSettings: {
    grace_days: 10,
    amount: 50,
    type: 'fixed',
    description: '১০ তারিখের পর বিলম্ব ফি ৫০ ৳'
  },
  designationLabels: defaultDesignations,
  customDepartments: defaultDepartments,
  securitySettings: {
    two_factor_auth: false,
    password_expiry_days: 90,
    session_timeout_minutes: 60,
    ip_restriction: false
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiCall, token, user } = useAuth();
  const [settings, setSettings] = useState<InstitutionSettings>(defaultSettings);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [classDefinitions, setClassDefinitions] = useState<ClassDefinition[]>([]);
  const [subjectDefinitions, setSubjectDefinitions] = useState<SubjectDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // If user is madrasa_admin or super_admin, fetch full settings; otherwise fetch public branding
      const isAdmin = user?.role === 'madrasa_admin' || user?.role === 'super_admin';
      const endpoint = isAdmin && token ? '/api/v1/settings' : '/api/v1/settings/public';

      const res = await apiCall(endpoint);
      if (res) {
        if (isAdmin && res.settings) {
          setSettings((prev) => ({
            ...prev,
            ...res.settings,
            designationLabels: { ...defaultDesignations, ...res.settings.designationLabels }
          }));
          if (Array.isArray(res.feeCategories)) setFeeCategories(res.feeCategories);
          if (Array.isArray(res.classDefinitions)) setClassDefinitions(res.classDefinitions);
          if (Array.isArray(res.subjectDefinitions)) setSubjectDefinitions(res.subjectDefinitions);
        } else {
          // Public branding response
          setSettings((prev) => ({
            ...prev,
            nameBn: res.nameBn || prev.nameBn,
            nameEn: res.nameEn || prev.nameEn,
            logoUrl: res.logoUrl !== undefined ? res.logoUrl : prev.logoUrl,
            tagline: res.tagline || prev.tagline,
            primaryColor: res.primaryColor || prev.primaryColor,
            currencySymbol: res.currencySymbol || prev.currencySymbol,
            madrasaType: res.madrasaType || prev.madrasaType,
            address: res.address || prev.address,
            phone: res.phone || prev.phone,
            email: res.email || prev.email,
            establishedYear: res.establishedYear || prev.establishedYear,
            academicYearType: res.academicYearType || prev.academicYearType,
            hijriYearEnabled: res.hijriYearEnabled !== undefined ? res.hijriYearEnabled : prev.hijriYearEnabled,
            designationLabels: { ...defaultDesignations, ...(res.designationLabels || {}) },
            customDepartments: res.customDepartments || prev.customDepartments
          }));
        }
      }

      // Also try to load fee categories if authenticated
      if (token && (!feeCategories || feeCategories.length === 0)) {
        apiCall('/api/v1/settings/fee-categories')
          .then((cats) => {
            if (Array.isArray(cats)) setFeeCategories(cats);
          })
          .catch(() => {});
      }
    } catch (err) {
      console.warn('Could not load settings from server, using sensible defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token, user?.role]);

  // Dynamically sync primary color to root CSS property for instant live preview across app
  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary-theme', settings.primaryColor);
    }
  }, [settings.primaryColor]);

  // Live preview update in memory (updates Navbar & UI immediately before saving)
  const updateSettingsPreview = (partial: Partial<InstitutionSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
      designationLabels: partial.designationLabels
        ? { ...prev.designationLabels, ...partial.designationLabels }
        : prev.designationLabels
    }));
  };

  // Upload Logo via API endpoint POST /api/v1/settings/logo-upload
  const uploadLogo = async (base64Data: string, filename?: string): Promise<string> => {
    const res = await apiCall<{ logoUrl: string }>('/api/v1/settings/logo-upload', {
      method: 'POST',
      body: JSON.stringify({ image: base64Data, filename })
    });
    const newUrl = res.logoUrl;
    setSettings((prev) => ({ ...prev, logoUrl: newUrl }));
    return newUrl;
  };

  // Save to database via PUT /api/v1/settings
  const saveSettings = async (payload?: Partial<InstitutionSettings>): Promise<boolean> => {
    const toSave = payload ? { ...settings, ...payload } : settings;
    try {
      const res = await apiCall('/api/v1/settings', {
        method: 'PUT',
        body: JSON.stringify(toSave)
      });
      if (res) {
        setSettings((prev) => ({
          ...prev,
          ...res,
          designationLabels: { ...defaultDesignations, ...res.designationLabels }
        }));
      }
      return true;
    } catch (err) {
      console.error('Error saving settings:', err);
      throw err;
    }
  };

  const getDesignationLabel = (roleKey: string): string => {
    return settings.designationLabels?.[roleKey] || defaultDesignations[roleKey] || roleKey;
  };

  // ==================== Fee Categories Helpers ====================

  const createFeeCategory = async (data: Partial<FeeCategory>): Promise<FeeCategory> => {
    const res = await apiCall('/api/v1/settings/fee-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setFeeCategories((prev) => [...prev, res]);
    return res;
  };

  const updateFeeCategory = async (id: string, data: Partial<FeeCategory>): Promise<FeeCategory> => {
    const res = await apiCall(`/api/v1/settings/fee-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    setFeeCategories((prev) => prev.map((c) => (c.id === id ? res : c)));
    return res;
  };

  const deleteFeeCategory = async (id: string): Promise<boolean> => {
    await apiCall(`/api/v1/settings/fee-categories/${id}`, {
      method: 'DELETE'
    });
    setFeeCategories((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  // ==================== Class Definition Helpers ====================

  const createClassDefinition = async (data: Partial<ClassDefinition>): Promise<ClassDefinition> => {
    const res = await apiCall('/api/v1/settings/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setClassDefinitions((prev) => [...prev, res]);
    return res;
  };

  const updateClassDefinition = async (id: string, data: Partial<ClassDefinition>): Promise<ClassDefinition> => {
    const res = await apiCall(`/api/v1/settings/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    setClassDefinitions((prev) => prev.map((c) => (c.id === id ? res : c)));
    return res;
  };

  const deleteClassDefinition = async (id: string): Promise<boolean> => {
    await apiCall(`/api/v1/settings/classes/${id}`, {
      method: 'DELETE'
    });
    setClassDefinitions((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  // ==================== Subject Definition Helpers ====================

  const createSubjectDefinition = async (data: Partial<SubjectDefinition>): Promise<SubjectDefinition> => {
    const res = await apiCall('/api/v1/settings/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setSubjectDefinitions((prev) => [...prev, res]);
    return res;
  };

  const updateSubjectDefinition = async (id: string, data: Partial<SubjectDefinition>): Promise<SubjectDefinition> => {
    const res = await apiCall(`/api/v1/settings/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    setSubjectDefinitions((prev) => prev.map((s) => (s.id === id ? res : s)));
    return res;
  };

  const deleteSubjectDefinition = async (id: string): Promise<boolean> => {
    await apiCall(`/api/v1/settings/subjects/${id}`, {
      method: 'DELETE'
    });
    setSubjectDefinitions((prev) => prev.filter((s) => s.id !== id));
    return true;
  };

  // ==================== Department Helpers ====================

  const addDepartment = async (name: string) => {
    const res = await apiCall('/api/v1/settings/departments', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    setSettings((prev) => ({
      ...prev,
      customDepartments: res || [...prev.customDepartments, name]
    }));
  };

  const deleteDepartment = async (name: string) => {
    const res = await apiCall(`/api/v1/settings/departments/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    setSettings((prev) => ({
      ...prev,
      customDepartments: res || prev.customDepartments.filter((d) => d !== name)
    }));
  };

  const updateDesignationLabels = async (labels: Record<string, string>) => {
    const res = await apiCall('/api/v1/settings/designations', {
      method: 'PUT',
      body: JSON.stringify({ labels })
    });
    setSettings((prev) => ({
      ...prev,
      designationLabels: { ...prev.designationLabels, ...(res || labels) }
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        feeCategories,
        classDefinitions,
        subjectDefinitions,
        loading,
        updateSettingsPreview,
        saveSettings,
        reloadSettings: fetchSettings,
        uploadLogo,
        getDesignationLabel,
        createFeeCategory,
        updateFeeCategory,
        deleteFeeCategory,
        createClassDefinition,
        updateClassDefinition,
        deleteClassDefinition,
        createSubjectDefinition,
        updateSubjectDefinition,
        deleteSubjectDefinition,
        addDepartment,
        deleteDepartment,
        updateDesignationLabels
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
