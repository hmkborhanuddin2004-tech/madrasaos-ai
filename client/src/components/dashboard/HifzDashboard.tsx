import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Award, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface HifzDashboardProps {
  onNavigate: (tab: string) => void;
}

export const HifzDashboard: React.FC<HifzDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-950 via-primary-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="text-xs font-semibold text-emerald-300">হিফজুল কুরআন বিভাগ • উস্তাদ ড্যাশবোর্ড</div>
        <h1 className="text-xl font-bold mt-1">{user.fullNameBn}</h1>
        <p className="text-xs text-emerald-200/80 mt-0.5">হিফজ ১ম বর্ষ ও হিফজ ২য় বর্ষ তত্ত্বাবধায়ক</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">আজকের সবক পেশ</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">১৮/২৬ জন</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">৬৯% ছাত্র সবক শুনিয়েছে</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">মুমতাজ (চমৎকার রেটিং)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">১২ জন</div>
          <div className="text-[11px] text-slate-500 mt-1">ভুল ছাড়া অনর্গল তেলাওয়াত</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">সবকী/মঞ্জিল পুনরাবৃত্তি প্রয়োজন</div>
          <div className="text-2xl font-bold text-red-600 mt-1">৪ জন</div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">ভুলের সংখ্যা বৃদ্ধি পেয়েছে</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>আজকের হিফজ সবক খাতা খুলুন</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">সবক, সবকী, মঞ্জিল এবং ভুল সংখ্যার দ্রুত মূল্যায়ন এন্ট্রি</p>
        </div>
        <button
          onClick={() => onNavigate('hifz')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
        >
          সবক এন্ট্রি শুরু করুন
        </button>
      </div>
    </div>
  );
};
