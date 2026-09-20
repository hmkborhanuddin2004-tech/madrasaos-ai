import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  Building2,
  Globe2,
  Search,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  Bell,
  SlidersHorizontal
} from 'lucide-react';

interface NavbarProps {
  onOpenCommand: () => void;
  onOpenAI: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommand, onOpenAI, onOpenOnboarding }) => {
  const { user, switchRole, language, setLanguage, activeBranch, branches, setActiveBranchId, networkStatus, t } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'madrasa_admin', label: 'মুহতামিম / অ্যাডমিন', icon: '👑' },
    { role: 'principal', label: 'নাযেমে তা’লীমাত (অধ্যক্ষ)', icon: '📜' },
    { role: 'teacher', label: 'সম্মানিত উস্তাদ (শিক্ষক)', icon: '📖' },
    { role: 'hifz_teacher', label: 'হাফেজ সাহেব (হিফজ শিক্ষক)', icon: '🕌' },
    { role: 'accountant', label: 'হিসাবরক্ষক (অর্থ ও ফি)', icon: '💰' },
    { role: 'hostel_manager', label: 'হোস্টেল সুপার (ছাত্রাবাস)', icon: '🛏️' },
    { role: 'guardian', label: 'অভিভাবক (Guardian)', icon: '👨‍👧' },
    { role: 'student', label: 'শিক্ষার্থী (Student)', icon: '🎓' },
    { role: 'super_admin', label: 'সুপার অ্যাডমিন (SaaS)', icon: '⚙️' }
  ];

  return (
    <header className="bg-primary-900 text-white border-b border-primary-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-primary-600 flex items-center justify-center font-bold text-lg shadow-inner text-white tracking-wider border border-emerald-300/40">
            ম
          </div>
          <div>
            <div className="font-bold text-base tracking-tight leading-none text-emerald-100 flex items-center gap-2">
              দারুল উলূম সেন্ট্রাল মাদ্রাসা
              <span className="text-[10px] uppercase font-semibold bg-emerald-700/60 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-500/30">
                PRO
              </span>
            </div>
            <div className="text-xs text-emerald-300/80 font-normal leading-tight mt-0.5">
              MadrasaOS AI • ঢাকা ক্যাম্পাস
            </div>
          </div>
        </div>

        {/* Center: Universal Command Bar Search trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenCommand}
            className="w-full bg-primary-950/60 hover:bg-primary-950 border border-primary-700/60 rounded-lg px-3.5 py-2 text-sm text-emerald-200/80 flex items-center justify-between transition shadow-inner group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400 group-hover:text-emerald-200 transition" />
              <span>{t('searchPlaceholder')}</span>
            </span>
            <kbd className="hidden sm:inline-block bg-primary-800/80 text-[11px] font-mono text-emerald-300 px-1.5 py-0.5 rounded border border-primary-600/60">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Branch, AI, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Conversational Setup Wizard Trigger */}
          <button
            onClick={onOpenOnboarding}
            className="hidden lg:flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600/50 text-emerald-100 text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
            title="মাদ্রাসার সিস্টেম সেটআপ ও কনফিগারেশন উইজার্ড"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent-gold" />
            <span>সেটআপ গাইড</span>
          </button>

          {/* AI Assistant Quick Trigger */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent-gold to-amber-600 hover:from-amber-500 hover:to-accent-gold text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('askAI')}</span>
            <span className="sm:hidden">এআই</span>
          </button>

          {/* Branch Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-primary-800/70 hover:bg-primary-800 px-2.5 py-1.5 rounded-lg border border-primary-700/60 transition text-emerald-100"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="truncate max-w-[110px]">{activeBranch.nameBn}</span>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {showBranchMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  ক্যাম্পাস শাখা পরিবর্তন
                </div>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBranchId(b.id);
                      setShowBranchMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-50 ${
                      b.id === activeBranch.id ? 'bg-emerald-50 text-primary-800 font-semibold' : ''
                    }`}
                  >
                    <span>{b.nameBn}</span>
                    {b.id === activeBranch.id && <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 text-xs bg-primary-800/70 hover:bg-primary-800 px-2 py-1.5 rounded-lg border border-primary-700/60 transition text-emerald-100"
              title="ভাষা পরিবর্তন"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="uppercase font-semibold">{language}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs">
                <button
                  onClick={() => { setLanguage('bn'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${language === 'bn' ? 'font-bold text-primary-800' : ''}`}
                >
                  🇧🇩 বাংলা (Default)
                </button>
                <button
                  onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${language === 'en' ? 'font-bold text-primary-800' : ''}`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => { setLanguage('ar'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${language === 'ar' ? 'font-bold text-primary-800' : ''}`}
                >
                  🇸🇦 العربية (RTL)
                </button>
              </div>
            )}
          </div>

          {/* Network Sync Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] bg-primary-950/60 px-2 py-1 rounded-md text-emerald-300 border border-primary-800">
            {networkStatus === 'online' ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>{t('online')}</span>
              </>
            ) : networkStatus === 'syncing' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>{t('syncing')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span>{t('offline')}</span>
              </>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-primary-700 hover:from-emerald-600 hover:to-primary-600 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-xs font-semibold shadow-sm transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
              <div className="text-left hidden md:block">
                <div className="text-[10px] text-emerald-200 font-normal leading-none">রোল পরিবর্তন</div>
                <div className="text-xs font-bold leading-none mt-0.5">{user.fullNameBn.split(' ')[0]}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-emerald-300" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                  <div className="font-bold text-xs text-slate-900">রোল ভিত্তিক প্রিভিউ মোড</div>
                  <div className="text-[11px] text-slate-500">বিভিন্ন রোলের ড্যাশবোর্ড ও পারমিশন পরীক্ষা করুন</div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition ${
                        user.role === r.role ? 'bg-emerald-50 text-primary-800 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </span>
                      {user.role === r.role && (
                        <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
