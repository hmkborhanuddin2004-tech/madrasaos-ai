import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Receipt, DollarSign, ArrowUpRight, ArrowDownRight, PlusCircle, FileText } from 'lucide-react';

interface AccountantDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-950 via-primary-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-amber-300">হিসাব ও অর্থ বিভাগ • আসসালামু আলাইকুম</div>
          <h1 className="text-xl font-bold mt-1">{user.fullNameBn}</h1>
          <p className="text-xs text-slate-300 mt-0.5">দৈনিক ক্যাশবুক, ফি আদায় ও ব্যাংক হিসাব রক্ষক</p>
        </div>
        <button
          onClick={() => onNavigate('finance')}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
        >
          <Receipt className="w-4 h-4" />
          <span>নতুন ফি আদায় (POS)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">আজকের নগদ ও বিকাশ আদায়</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">৳২৮,৪০০</div>
          <div className="text-[11px] text-slate-500 mt-1">১২টি সফল রসিদ তৈরি হয়েছে</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">চলতি মাসের মোট আদায়</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">৳৪,৮২,০০০</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">লক্ষ্যমাত্রার ৭৩% অর্জিত</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">বকেয়া ফি (অনাদায়ি)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">৳১,১২,০০০</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">৪৩ জন ছাত্রের ফি পেন্ডিং</div>
        </div>
      </div>
    </div>
  );
};
