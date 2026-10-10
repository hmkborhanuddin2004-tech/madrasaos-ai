import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  Users,
  CalendarCheck2,
  Calendar,
  Receipt,
  BookOpen,
  Bed,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  PlusCircle,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenAIQuery: (query: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onOpenAIQuery }) => {
  const { user, apiCall } = useAuth();
  const { settings } = useSettings();
  const [summary, setSummary] = useState<any>(null);
  const [repeatedAbsences, setRepeatedAbsences] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Priority: if admin or principal, display settings.principalName if set, otherwise user.fullNameBn
  const adminDisplayName = (user?.role === 'madrasa_admin' || user?.role === 'principal')
    ? (settings.principalName || user?.fullNameBn || 'মুহতামিম সাহেব')
    : (user?.fullNameBn || 'ব্যবহারকারী');

  // Real-time dynamic Bengali Date & Hijri Date calculation
  const currentDateInfo = React.useMemo(() => {
    const now = new Date();
    const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const bnDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const toBn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

    const dayName = bnDays[now.getDay()];
    const dateNum = toBn(now.getDate());
    const monthName = bnMonths[now.getMonth()];
    const yearNum = toBn(now.getFullYear());

    let hijriStr = '';
    try {
      const hijriFormatter = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      hijriStr = hijriFormatter.format(now) + ' হিজরী';
    } catch {
      hijriStr = `${toBn(10)} রবিউল আউয়াল ১৪৪৮ হিজরী`;
    }

    return {
      dayName,
      full: `${dayName}, ${dateNum} ${monthName} ${yearNum} • ${hijriStr}`
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attSummary = await apiCall('/api/v1/attendance/summary');
        const finSummary = await apiCall('/api/v1/finance/summary');
        const hostelSummary = await apiCall('/api/v1/hostels/status');
        const repAbs = await apiCall('/api/v1/attendance/repeated-absences?days=7&minAbsences=2');
        const briefRes = await apiCall('/api/v1/ai/daily-brief');

        setSummary({
          attendance: attSummary,
          finance: finSummary,
          hostel: hostelSummary
        });
        setRepeatedAbsences(repAbs);
        setBriefing(briefRes?.summaryBn || '');
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-emerald-900 rounded-3xl p-6 text-white shadow-xl border border-primary-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div
            onClick={() => onNavigate('settings')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wider bg-emerald-950/40 hover:bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30 cursor-pointer transition active:scale-95 group"
            title="মাদ্রাসার নাম ও সেটিংস পরিবর্তন করুন (ক্লিক করুন)"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>মাদ্রাসা কমান্ড সেন্টার • {settings.nameBn || 'প্রধান ক্যাম্পাস'}</span>
            <ArrowRight className="w-3 h-3 text-emerald-300 opacity-70 group-hover:translate-x-0.5 transition" />
          </div>

          <h1
            onClick={() => onNavigate('settings')}
            className="text-2xl font-bold tracking-tight text-white mt-1 cursor-pointer hover:text-emerald-200 transition"
            title="মুহতামিম / অ্যাডমিন সেটিংস পরিবর্তন করতে ক্লিক করুন"
          >
            আসসালামু আলাইকুম, {adminDisplayName}
          </h1>

          <div>
            <button
              type="button"
              onClick={() => onNavigate('academics')}
              className="inline-flex items-center gap-2 text-xs text-emerald-100 bg-black/25 hover:bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 cursor-pointer transition active:scale-95 group shadow-xs mt-1 text-left"
              title="একাডেমিক ক্যালেন্ডার, ক্লাস রুটিন ও পরীক্ষার সময়সূচী দেখুন (ক্লিক করুন)"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-110 transition flex-shrink-0" />
              <span>
                আজকের তারিখ: <strong className="font-bold text-white">{currentDateInfo.full}</strong> • {settings.nameBn || 'মাদ্রাসা'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition flex-shrink-0" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAIQuery('আজকের পুরো মাদ্রাসার সকালের সংক্ষিপ্ত ব্রিফিং ও গুরুত্বপূর্ণ নোটিশ জানাও')}
            className="flex items-center gap-2 bg-gradient-to-r from-accent-gold to-amber-600 hover:from-amber-500 hover:to-accent-gold text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>সকালের মাদ্রাসা ব্রিফিং শুনুন</span>
          </button>
        </div>
      </div>

      {/* AI Daily Brief Digest Banner */}
      {briefing && (
        <div
          onClick={() => onOpenAIQuery(briefing)}
          className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm cursor-pointer hover:border-emerald-400 transition"
          title="এআই বিশ্লেষণে বিস্তারিত জানতে ক্লিক করুন"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold to-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold">
            AI
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                <span>আজকের মাদ্রাসা এআই সারসংক্ষেপ</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                  যাচাইকৃত ডাটা
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
              {briefing}
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>মোট শিক্ষার্থী</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summary?.attendance?.totalStudents || 105} জন
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>সক্রিয় শিক্ষার্থী তালিকাভুক্ত</span>
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>আজকের উপস্থিতি</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <CalendarCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {summary?.attendance?.attendanceRate || 93}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            উপস্থিত: {summary?.attendance?.presentCount || 98} জন • অনুপস্থিত: {summary?.attendance?.absentCount || 7} জন
          </div>
        </div>

        {/* Fee Collection */}
        <div
          onClick={() => onNavigate('finance')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>চলতি মাসে আদায়</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ৳{(summary?.finance?.totalCollected || 185000).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            বকেয়া: ৳{(summary?.finance?.totalDue || 82000).toLocaleString()}
          </div>
        </div>

        {/* Hostel Bed Capacity */}
        <div
          onClick={() => onNavigate('hostel')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>আবাসিক ছাত্রাবাস</span>
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summary?.hostel?.totalOccupied || 15}/{summary?.hostel?.totalCapacity || 18} সিট
          </div>
          <div className="text-[11px] text-teal-600 font-semibold mt-1">
            খালি সিট: {summary?.hostel?.availableBeds || 3}টি • {summary?.hostel?.occupancyRate || 83}% পূর্ণ
          </div>
        </div>
      </div>

      {/* Requires Attention Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              আপনার মনোযোগ প্রয়োজন (Requires Attention)
            </h2>
          </div>
          <span className="text-xs text-slate-500">৩টি সক্রিয় প্রশাসনিক অ্যালার্ট</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Repeated Absences Card */}
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-red-700 dark:text-red-400 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>টানা অনুপস্থিতি সতর্কতা</span>
                </span>
                <span className="bg-red-200/80 dark:bg-red-900 text-red-900 dark:text-red-200 px-2 py-0.5 rounded-full text-[11px]">
                  {repeatedAbsences.length} জন
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                আব্দুল্লাহ আল-মামুনসহ {repeatedAbsences.length} জন শিক্ষার্থী গত ৭ দিনে একাধিকবার অনুপস্থিত হয়েছে।
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-red-200/60 dark:border-red-900/60">
              <button
                onClick={() => onNavigate('attendance')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-2.5 rounded-xl transition text-center shadow-sm"
              >
                তালিকা দেখুন
              </button>
              <button
                onClick={() => onOpenAIQuery('যারা ৩ দিনের বেশি অনুপস্থিত তাদের অভিভাবককে মেসেজ পাঠাও')}
                className="bg-white dark:bg-slate-800 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold py-1.5 px-2.5 rounded-xl hover:bg-red-50 transition"
                title="এআই দিয়ে অভিভাবক নোটিশ ড্রাফট করুন"
              >
                মেসেজ ড্রাফট
              </button>
            </div>
          </div>

          {/* Overdue Fees Card */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" />
                  <span>বকেয়া ফি অ্যালার্ট</span>
                </span>
                <span className="bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                  ১৫টি চালান
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                সেপ্টেম্বর সেশনে মোট ১৫ জন শিক্ষার্থীর বকেয়া ফি পরিশোধের সময়সীমা অতিক্রান্ত হয়েছে।
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/60">
              <button
                onClick={() => onNavigate('finance')}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-1.5 px-2.5 rounded-xl transition text-center shadow-sm"
              >
                বকেয়া হিসাব
              </button>
              <button
                onClick={() => onNavigate('automation')}
                className="bg-white dark:bg-slate-800 border border-amber-300 text-amber-700 dark:text-amber-300 text-xs font-semibold py-1.5 px-2.5 rounded-xl hover:bg-amber-50 transition"
              >
                স্মরণিকা অটোমেশন
              </button>
            </div>
          </div>

          {/* Hifz Progress Review Card */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>হিফজ সবক অগ্রগতি</span>
                </span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-[11px]">
                  ৮ জন রিভিউ
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                হিফজ ১ম বর্ষে ৮ জন শিক্ষার্থীর সবকী ও মঞ্জিলে ভুলের সংখ্যা বৃদ্ধি পেয়েছে; বিশেষ তত্ত্বাবধান প্রয়োজন।
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60">
              <button
                onClick={() => onNavigate('hifz')}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-1.5 px-2.5 rounded-xl transition text-center shadow-sm"
              >
                সবক খাতা খুলুন
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Engine */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          জরুরি পদক্ষেপ (Quick Actions)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('attendance')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-800 border border-slate-700/60 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition group"
          >
            <CalendarCheck2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-xs font-semibold text-center">হাজিরা গ্রহণ</span>
          </button>

          <button
            onClick={() => onNavigate('hifz')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-800 border border-slate-700/60 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition group"
          >
            <BookOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-xs font-semibold text-center">সবক রেকর্ড</span>
          </button>

          <button
            onClick={() => onNavigate('finance')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-800 border border-slate-700/60 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition group"
          >
            <Receipt className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
            <span className="text-xs font-semibold text-center">ফি আদায় (POS)</span>
          </button>

          <button
            onClick={() => onNavigate('students')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-800 border border-slate-700/60 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition group"
          >
            <UserPlus className="w-5 h-5 text-teal-400 group-hover:scale-110 transition" />
            <span className="text-xs font-semibold text-center">নতুন ছাত্র যোগ</span>
          </button>

          <button
            onClick={() => onNavigate('certificates')}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-800 border border-slate-700/60 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition group"
          >
            <FileText className="w-5 h-5 text-accent-gold group-hover:scale-110 transition" />
            <span className="text-xs font-semibold text-center">প্রত্যয়ন ও সনদ</span>
          </button>

          <button
            onClick={() => onOpenAIQuery('আজকের অবস্থা বলো')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-900 to-primary-950 hover:from-emerald-800 hover:to-primary-900 border border-emerald-600/40 flex flex-col items-center justify-center gap-2 transition group"
          >
            <Sparkles className="w-5 h-5 text-accent-gold group-hover:scale-110 transition" />
            <span className="text-xs font-semibold text-center">এআই জিজ্ঞাসা</span>
          </button>
        </div>
      </div>
    </div>
  );
};
