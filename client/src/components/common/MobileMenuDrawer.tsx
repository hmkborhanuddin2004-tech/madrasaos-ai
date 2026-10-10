import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isTabAllowedForRole, getRoleNameBn } from '../../utils/rbac';
import {
  LayoutDashboard, Users, CalendarCheck2, BookOpen, BookMarked,
  Receipt, Bed, GraduationCap, Sparkles, Workflow, Award, Library,
  UserPlus, HeartHandshake, Landmark, Banknote, CheckSquare, Utensils,
  MessageSquare, Building2, Globe
} from 'lucide-react';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'students', label: 'শিক্ষার্থী তালিকা ও তথ্য', icon: Users },
  { id: 'branches', label: 'শাখা ও ক্যাম্পাস', icon: Building2 },
  { id: 'attendance', label: 'দৈনিক হাজিরা', icon: CalendarCheck2 },
  { id: 'hifz', label: 'হিফজ সবক খাতা', icon: BookOpen },
  { id: 'academics', label: 'কিতাব নেসাব ও রুটিন', icon: BookMarked },
  { id: 'befaq', label: 'বেফাক বোর্ড পরীক্ষা', icon: Award },
  { id: 'muhasaba', label: 'মুহাসাবা ও আমল ট্র্যাকার', icon: CheckSquare },
  { id: 'finance', label: 'ফি আদায় ও লেজার (POS)', icon: Receipt },
  { id: 'payroll', label: 'ওস্তাদ ও স্টাফ বেতন', icon: Banknote },
  { id: 'canteen', label: 'ক্যান্টিন ও মেস খাদ্য', icon: Utensils },
  { id: 'donations', label: 'দান ও ওয়াকফ তহবিল', icon: HeartHandshake },
  { id: 'cash_book', label: 'দৈনিক ক্যাশ বই', icon: Landmark },
  { id: 'sms', label: 'SMS ও ভয়েস ব্রডকাস্ট', icon: MessageSquare },
  { id: 'hostel', label: 'হোস্টেল ও সিট বণ্টন', icon: Bed },
  { id: 'exams', label: 'পরীক্ষা ও ফলাফল', icon: GraduationCap },
  { id: 'admissions', label: 'ভর্তি কার্যক্রম', icon: UserPlus },
  { id: 'library', label: 'মাদ্রাসা লাইব্রেরি', icon: Library },
  { id: 'certificates', label: 'প্রত্যয়ন ও সনদপত্র', icon: Award },
  { id: 'portal', label: 'পাবলিক ল্যান্ডিং পোর্টাল', icon: Globe },
  { id: 'automation', label: 'অটোমেশন সেন্টার', icon: Workflow },
  { id: 'ai', label: 'এআই সহকারী', icon: Sparkles },
  { id: 'settings', label: 'মাদ্রাসা সেটিংস ও কাস্টমাইজেশন', icon: SlidersHorizontal }
];

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab
}) => {
  const { user } = useAuth();
  if (!isOpen) return null;

  const allowedItems = ALL_NAV_ITEMS.filter((item) =>
    isTabAllowedForRole(user.role, item.id)
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col justify-end md:hidden animate-fade-in">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">সকল অনুমোদিত মডিউল</h3>
            <p className="text-[10px] text-emerald-400 mt-0.5">
              প্রোফাইল: {getRoleNameBn(user.role)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable grid of items */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold text-left transition border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
