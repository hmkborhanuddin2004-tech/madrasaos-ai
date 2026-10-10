import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  BookOpen,
  BookMarked,
  Receipt,
  Bed,
  GraduationCap,
  Sparkles,
  Workflow,
  Award,
  Library,
  UserPlus,
  HeartHandshake,
  Landmark,
  Banknote,
  CheckSquare,
  Utensils,
  MessageSquare,
  Building2,
  Globe,
  SlidersHorizontal
} from 'lucide-react';

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, t } = useAuth();
  const { settings } = useSettings();

  const displayName = ((user?.role === 'madrasa_admin' || user?.role === 'principal')
    ? (settings.principalName || user?.fullNameBn)
    : user?.fullNameBn) || 'ব্যবহারকারী';

  // Role-aware navigation menu items
  const getNavItems = () => {
    switch (user.role) {
      case 'teacher':
        return [
          { id: 'dashboard', label: 'আমার ক্লাস ও রুটিন', icon: LayoutDashboard },
          { id: 'attendance', label: 'দৈনিক হাজিরা গ্রহণ', icon: CalendarCheck2 },
          { id: 'hifz', label: 'হিফজ সবক খাতা', icon: BookOpen },
          { id: 'academics', label: 'কিতাব নেসাব ও পাঠ', icon: BookMarked },
          { id: 'muhasaba', label: 'মুহাসাবা ও আমল ট্র্যাকার', icon: CheckSquare },
          { id: 'befaq', label: 'বেফাক বোর্ড পরীক্ষা', icon: Award },
          { id: 'payroll', label: 'আমার বেতন রসিদ', icon: Banknote },
          { id: 'exams', label: 'পরীক্ষার নম্বর এন্ট্রি', icon: GraduationCap },
          { id: 'students', label: 'ক্লাসের শিক্ষার্থী তালিকা', icon: Users }
        ];

      case 'hifz_teacher':
        return [
          { id: 'dashboard', label: 'হিফজ ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'hifz', label: 'আজকের সবক ও মঞ্জিল', icon: BookOpen },
          { id: 'muhasaba', label: 'মুহাসাবা ও আমল ট্র্যাকার', icon: CheckSquare },
          { id: 'payroll', label: 'আমার বেতন রসিদ', icon: Banknote },
          { id: 'students', label: 'হিফজ শিক্ষার্থী তালিকা', icon: Users },
          { id: 'attendance', label: 'হিফজ সার্কেল হাজিরা', icon: CalendarCheck2 },
          { id: 'ai', label: 'এআই অগ্রগতি বিশ্লেষণ', icon: Sparkles }
        ];

      case 'accountant':
        return [
          { id: 'dashboard', label: 'হিসাব ও অর্থ ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'finance', label: 'ফি আদায় ও লেজার (POS)', icon: Receipt },
          { id: 'payroll', label: 'ওস্তাদ ও স্টাফ বেতন (Payroll)', icon: Banknote },
          { id: 'canteen', label: 'ক্যান্টিন ও মেস খরচ', icon: Utensils },
          { id: 'donations', label: 'দান ও ওয়াকফ তহবিল', icon: HeartHandshake },
          { id: 'cash_book', label: 'দৈনিক ক্যাশ বই', icon: Landmark },
          { id: 'sms', label: 'SMS বকেয়া তাগাদা', icon: MessageSquare },
          { id: 'students', label: 'শিক্ষার্থী ও বকেয়া ফি', icon: Users },
          { id: 'automation', label: 'বকেয়া রিমাইন্ডার অটোমেশন', icon: Workflow },
          { id: 'ai', label: 'এআই ফাইন্যান্স সহকারী', icon: Sparkles }
        ];

      case 'hostel_manager':
        return [
          { id: 'dashboard', label: 'ছাত্রাবাস ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'hostel', label: 'রুম ও সিট বণ্টন', icon: Bed },
          { id: 'canteen', label: 'ক্যান্টিন ও মেস খাদ্য মজুদ', icon: Utensils },
          { id: 'attendance', label: 'রাত্রিকালীন কারফিউ হাজিরা', icon: CalendarCheck2 },
          { id: 'students', label: 'আবাসিক শিক্ষার্থী তালিকা', icon: Users }
        ];

      case 'guardian':
        return [
          { id: 'dashboard', label: 'সন্তানের অবস্থা', icon: LayoutDashboard },
          { id: 'attendance', label: 'হাজিরা রেকর্ড', icon: CalendarCheck2 },
          { id: 'hifz', label: 'হিফজ ও সবক আপডেট', icon: BookOpen },
          { id: 'muhasaba', label: 'সন্তানের আমল ট্র্যাকার', icon: CheckSquare },
          { id: 'finance', label: 'বেতন ও ফি পরিশোধ', icon: Receipt },
          { id: 'exams', label: 'পরীক্ষার ফলাফল', icon: GraduationCap },
          { id: 'portal', label: 'পাবলিক তথ্য পোর্টাল', icon: Globe }
        ];

      case 'student':
        return [
          { id: 'dashboard', label: 'আমার ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'muhasaba', label: 'আমার দৈনিক আমল ও মুহাসাবা', icon: CheckSquare },
          { id: 'attendance', label: 'আমার হাজিরা', icon: CalendarCheck2 },
          { id: 'hifz', label: 'সবক অগ্রগতি', icon: BookOpen },
          { id: 'exams', label: 'পরীক্ষার নম্বরপত্র', icon: GraduationCap },
          { id: 'portal', label: 'পাবলিক পোর্টাল', icon: Globe }
        ];

      default: // madrasa_admin, principal, super_admin
        return [
          { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
          { id: 'students', label: t('navStudents'), icon: Users },
          { id: 'branches', label: 'শাখা, সেকশন ও গ্রুপ', icon: Building2 },
          { id: 'attendance', label: t('navAttendance'), icon: CalendarCheck2 },
          { id: 'hifz', label: t('navHifz'), icon: BookOpen },
          { id: 'academics', label: 'একাডেমিক নেসাব ও রুটিন', icon: BookMarked },
          { id: 'befaq', label: 'বেফাক বোর্ড পরীক্ষা', icon: Award },
          { id: 'muhasaba', label: 'মুহাসাবা ও আমল ট্র্যাকার', icon: CheckSquare },
          { id: 'finance', label: t('navFinance'), icon: Receipt },
          { id: 'payroll', label: 'ওস্তাদ ও স্টাফ বেতন', icon: Banknote },
          { id: 'canteen', label: 'ক্যান্টিন ও মেস খাদ্য', icon: Utensils },
          { id: 'donations', label: 'দান ও ওয়াকফ তহবিল', icon: HeartHandshake },
          { id: 'cash_book', label: 'দৈনিক ক্যাশ বই', icon: Landmark },
          { id: 'sms', label: 'SMS ও ভয়েস ব্রডকাস্ট', icon: MessageSquare },
          { id: 'hostel', label: t('navHostel'), icon: Bed },
          { id: 'exams', label: t('navExams'), icon: GraduationCap },
          { id: 'admissions', label: 'ভর্তি কার্যক্রম', icon: UserPlus },
          { id: 'library', label: 'মাদ্রাসা লাইব্রেরি', icon: Library },
          { id: 'certificates', label: t('navCertificates'), icon: Award },
          { id: 'portal', label: 'পাবলিক ল্যান্ডিং পোর্টাল', icon: Globe },
          { id: 'automation', label: t('navAutomation'), icon: Workflow },
          { id: 'ai', label: t('navAI'), icon: Sparkles },
          { id: 'settings', label: 'মাদ্রাসা সেটিংস ও কাস্টমাইজেশন', icon: SlidersHorizontal }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="py-4 px-3">
        <div className="px-3 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          প্রধান মেনু
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm border border-emerald-600/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-emerald-200' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.id === 'automation' && (
                  <span className="ml-auto text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                    20
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Context Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 cursor-pointer transition"
          title="প্রোফাইল ও সেটিংস দেখুন"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
            {displayName ? displayName.slice(0, 1) : 'ম'}
          </div>
          <div className="truncate flex-1">
            <div className="text-xs font-bold text-slate-200 truncate">{displayName}</div>
            <div className="text-[10px] text-emerald-400 font-medium capitalize truncate">
              {user?.role ? user.role.replace('_', ' ') : ''}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
