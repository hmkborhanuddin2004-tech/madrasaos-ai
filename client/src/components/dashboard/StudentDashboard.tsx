import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, CalendarCheck2, Award, User } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-900 to-primary-950 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="text-xs text-emerald-300">শিক্ষার্থী ড্যাশবোর্ড • আসসালামু আলাইকুম</div>
          <h1 className="text-xl font-bold mt-1">{user.fullNameBn}</h1>
          <p className="text-xs text-emerald-200 mt-0.5">আইডি: DUCM-2026-001 • কাফিয়া জামাত ও হিফজ বিভাগ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">উপস্থিতি হার</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">৯৫%</div>
          <div className="text-[11px] text-slate-500 mt-1">আজ উপস্থিত ছিলেন</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">হিফজ সম্পন্ন</div>
          <div className="text-2xl font-bold text-accent-gold mt-1">৪র্থ পারা</div>
          <div className="text-[11px] text-slate-500 mt-1">রেটিং: মুমতাজ (চমৎকার)</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">১ম সাময়িক পরীক্ষার গ্রেড</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">A+ (মুমতাজ)</div>
          <div className="text-[11px] text-slate-500 mt-1">মেধা স্থান: ৩য়</div>
        </div>
      </div>
    </div>
  );
};
