import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck2, BookOpen, GraduationCap, Users, Clock, AlertCircle } from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-900 via-primary-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="text-xs font-semibold text-emerald-300">শিক্ষক ড্যাশবোর্ড • আসসালামু আলাইকুম</div>
        <h1 className="text-xl font-bold mt-1">{user.fullNameBn}</h1>
        <p className="text-xs text-emerald-200/80 mt-0.5">নাহবেমীর জামাত ও কাফিয়া জামাত ইন-চার্জ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Classes */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>আজকের পাঠ ও ক্লাস তালিকা</span>
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              ২টি ক্লাস
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">নাহবেমীর জামাত (আরবি ব্যাকরণ)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">সকাল ৮:০০ - ৯:০০ • বিষয়: মারফূআত ও ফায়েলের হুকুম</div>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
              >
                হাজিরা নিন
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">কাফিয়া জামাত (উসূলুন নাহব)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">সকাল ৯:১৫ - ১০:১৫ • বিষয়: ইসম গাইরে মুনসারিফ</div>
              </div>
              <button
                onClick={() => onNavigate('academics')}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
              >
                পাঠ অগ্রগতি
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-gold" />
            <span>শিক্ষকের দৈনন্দিন কাজসমূহ</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigate('attendance')}
              className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary-950 font-bold border border-emerald-200 text-left transition"
            >
              <CalendarCheck2 className="w-5 h-5 text-emerald-700 mb-1" />
              <span>১ ক্লিকে হাজিরা</span>
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 text-left transition"
            >
              <BookOpen className="w-5 h-5 text-teal-700 mb-1" />
              <span>কিতাব পাঠ এন্ট্রি</span>
            </button>
            <button
              onClick={() => onNavigate('exams')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 text-left transition"
            >
              <GraduationCap className="w-5 h-5 text-amber-700 mb-1" />
              <span>পরীক্ষার নম্বরপত্র</span>
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 text-left transition"
            >
              <Users className="w-5 h-5 text-blue-700 mb-1" />
              <span>ছাত্র প্রোফাইল</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
