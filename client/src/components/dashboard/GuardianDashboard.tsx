import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, BookOpen, Receipt, Bell, PhoneCall, Calendar, Award } from 'lucide-react';

interface GuardianDashboardProps {
  onNavigate: (tab: string) => void;
}

export const GuardianDashboard: React.FC<GuardianDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Friendly Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-primary-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="text-xs text-emerald-200">অভিভাবক পোর্টাল • আসসালামু আলাইকুম</div>
          <h1 className="text-xl font-bold mt-1">{user.fullNameBn}</h1>
          <p className="text-xs text-emerald-100/90 mt-0.5">আপনার সন্তান: আব্দুল্লাহ আল-মামুন (কাফিয়া জামাত ও হিফজ)</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-xl font-bold">
          আ
        </div>
      </div>

      {/* Today's Instant Status Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          আজকের দিনের পরিস্থিতি (২০ সেপ্টেম্বর ২০২৬)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Attendance Status */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">আজকের ক্লাসের হাজিরা</div>
              <div className="text-sm font-bold text-emerald-950">উপস্থিত (সময়: সকাল ০৭:৪৫)</div>
            </div>
          </div>

          {/* Hifz Today */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">আজকের সবক অগ্রগতি</div>
              <div className="text-sm font-bold text-amber-950">সূরা আন-নিসা (১ম পারা সমাপ্তি)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial & Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fees */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>বেতন ও ফি সংক্রান্ত হিসাব</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">পরিশোধিত</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">বকেয়া: ৳০.০০</div>
          <div className="text-[11px] text-slate-500">
            সেপ্টেম্বর মাসের বেতন ৳২,০০০ রসিদ নং RCP-202609-0012 এর মাধ্যমে পরিশোধিত হয়েছে।
          </div>
        </div>

        {/* Latest Exam Result */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <Award className="w-4 h-4 text-accent-gold" />
              <span>১ম সাময়িক পরীক্ষার ফল</span>
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
              মুমতাজ (A+)
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-600">প্রাপ্ত নম্বর: ৯০/১০০</div>
          <div className="text-[11px] text-slate-500">
            মেধা স্থান: ৩য় (কাফিয়া জামাত) • আরবি ব্যাকরণ ও হাদিস বিষয়ে শ্রেষ্ঠত্ব।
          </div>
        </div>
      </div>

      {/* Direct Contact Button */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
        <div>
          <div className="text-xs font-bold text-emerald-300">মাদ্রাসার দফতরে জরুরি যোগাযোগ</div>
          <div className="text-[11px] text-slate-400 mt-0.5">অধ্যক্ষ কার্যালয় ও হোস্টেল সুপার হেল্পলাইন</div>
        </div>
        <a
          href="tel:01711111111"
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
        >
          <PhoneCall className="w-4 h-4" />
          <span>কল করুন</span>
        </a>
      </div>
    </div>
  );
};
