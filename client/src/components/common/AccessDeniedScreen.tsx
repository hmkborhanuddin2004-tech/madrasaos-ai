import React from 'react';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleNameBn } from '../../utils/rbac';

interface AccessDeniedScreenProps {
  tabId: string;
  onNavigateHome: () => void;
}

const TAB_NAME_MAP: Record<string, string> = {
  settings: 'মাদ্রাসা সেটিংস ও কাস্টমাইজেশন',
  finance: 'ফি আদায় ও আর্থিক লেজার (POS)',
  payroll: 'ওস্তাদ ও স্টাফ বেতন (Payroll)',
  donations: 'দান ও ওয়াকফ তহবিল',
  cash_book: 'দৈনিক ক্যাশ বই',
  automation: 'অটোমেশন সেন্টার',
  branches: 'শাখা ও ক্যাম্পাস ম্যানেজমেন্ট',
  students: 'শিক্ষার্থী তথ্যভান্ডার',
  admissions: 'ভর্তি কার্যক্রম',
  certificates: 'সনদপত্র ও প্রত্যয়ন'
};

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ tabId, onNavigateHome }) => {
  const { user } = useAuth();
  const tabName = TAB_NAME_MAP[tabId] || tabId;
  const roleName = getRoleNameBn(user.role);

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-400 mb-4 shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 mb-2">
        নিরাপত্তা ও অনুমতি সীমাবদ্ধতা (RBAC Guard)
      </span>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
        "{tabName}" মডিউল ব্যবহারের অনুমতি সংরক্ষিত
      </h2>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
        আপনার বর্তমান প্রোফাইল: <strong className="text-slate-900 dark:text-slate-200">{roleName}</strong>। প্রাতিষ্ঠানিক গোপনীয়তা ও সুরক্ষা বিধিমালার কারণে এই অংশটি শুধুমাত্র অনুমোদিত কর্তৃপক্ষের জন্য নির্ধারিত।
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onNavigateHome}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-md"
        >
          <Home className="w-4 h-4" />
          <span>আমার ড্যাশবোর্ডে ফিরে যান</span>
        </button>
      </div>
    </div>
  );
};
