import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bed, Users, AlertCircle, Clock } from 'lucide-react';

interface HostelDashboardProps {
  onNavigate: (tab: string) => void;
}

export const HostelDashboard: React.FC<HostelDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-950 via-primary-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-teal-300">আবাসিক ছাত্রাবাস শাখা • আসসালামু আলাইকুম</div>
          <h1 className="text-xl font-bold mt-1">{user.fullNameBn}</h1>
          <p className="text-xs text-slate-300 mt-0.5">ওমর ফারুক ছাত্রাবাস ও উসমান গনী ছাত্রাবাস ইন-চার্জ</p>
        </div>
        <button
          onClick={() => onNavigate('hostel')}
          className="bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
        >
          সিট বণ্টন তালিকা
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">মোট আবাসিক ছাত্র</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">১৫ জন</div>
          <div className="text-[11px] text-teal-600 font-semibold mt-1">সবাই নিয়মিত খানা তালিকাভুক্ত</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">খালি বেড সংখ্যা</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">৩টি</div>
          <div className="text-[11px] text-slate-500 mt-1">রুম নং ১০১-সি ও ১০১-ডি খালি</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">অনুমোদিত আউটপাস</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">২ জন</div>
          <div className="text-[11px] text-slate-500 mt-1">আজ মাগরিবের মধ্যে ফেরার কথা</div>
        </div>
      </div>
    </div>
  );
};
