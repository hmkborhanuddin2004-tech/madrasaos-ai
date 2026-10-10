import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { DocumentCapture } from './DocumentCapture';
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
  SlidersHorizontal,
  Scan,
  LogOut,
  ArrowLeft,
  RotateCcw,
  Plus,
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenCommand: () => void;
  onOpenAI: () => void;
  onOpenOnboarding: () => void;
  activeTab?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommand,
  onOpenAI,
  onOpenOnboarding,
  activeTab,
  canGoBack,
  onGoBack,
  onRefresh,
  isRefreshing
}) => {
  const { user, switchRole, language, setLanguage, activeBranch, branches, setActiveBranchId, networkStatus, toggleNetworkStatus, t, logout, addBranch } = useAuth();
  const { settings, getDesignationLabel } = useSettings();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'madrasa_admin', label: `${getDesignationLabel('muhtamim')} / অ্যাডমিন`, icon: '👑' },
    { role: 'principal', label: getDesignationLabel('principal') || getDesignationLabel('naib_muhtamim') || 'নাযেমে তা’লীমাত (অধ্যক্ষ)', icon: '📜' },
    { role: 'teacher', label: getDesignationLabel('kitab_teacher') || 'সম্মানিত উস্তাদ (শিক্ষক)', icon: '📖' },
    { role: 'hifz_teacher', label: getDesignationLabel('hifz_teacher') || 'হাফেজ সাহেব (হিফজ শিক্ষক)', icon: '🕌' },
    { role: 'accountant', label: getDesignationLabel('accountant') || 'হিসাবরক্ষক (অর্থ ও ফি)', icon: '💰' },
    { role: 'hostel_manager', label: getDesignationLabel('hostel_manager') || 'হোস্টেল সুপার (ছাত্রাবাস)', icon: '🛏️' },
    { role: 'guardian', label: 'অভিভাবক (Guardian)', icon: '👨‍👧' },
    { role: 'student', label: 'শিক্ষার্থী (Student)', icon: '🎓' },
    { role: 'super_admin', label: 'সুপার অ্যাডমিন (SaaS)', icon: '⚙️' }
  ];

  return (
    <header
      className="text-white border-b border-black/10 sticky top-0 z-50 shadow-md transition-colors duration-300"
      style={{ backgroundColor: settings.primaryColor || '#064e3b' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap overflow-hidden">
        {/* Back and Refresh Navigation Controls in Navbar */}
        {canGoBack && (
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 mr-1">
            <button
              type="button"
              onClick={onGoBack}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-black/25 hover:bg-black/40 text-white rounded-xl text-xs font-bold border border-white/20 transition active:scale-95 cursor-pointer shadow-xs"
              title="পূর্ববর্তী পেজে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">পেছনে</span>
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1.5 bg-black/25 hover:bg-black/40 text-white rounded-xl text-xs font-bold border border-white/20 transition active:scale-95 cursor-pointer shadow-xs"
                title="রিফ্রেশ করুন"
              >
                <RotateCcw className={`w-4 h-4 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Left: Brand Identity with Live Preview */}
        <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0 max-w-[200px] sm:max-w-[260px] md:max-w-[280px] lg:max-w-[340px]">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.nameBn || 'Logo'}
              className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5 border border-emerald-300/40 shadow-inner flex-shrink-0"
              onError={(e) => {
                // If logo fails to load, hide image and show fallback initial
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner text-white tracking-wider border border-white/20 flex-shrink-0"
              style={{ backgroundColor: settings.primaryColor || '#059669' }}
            >
              {settings.nameBn ? settings.nameBn.trim().slice(0, 1) : 'ম'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm sm:text-base tracking-tight leading-none text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{settings.nameBn || 'জামিয়া ইসলামিয়া'}</span>
              <span className="text-[9px] uppercase font-semibold bg-black/20 text-white/90 px-1.5 py-0.5 rounded border border-white/20 flex-shrink-0">
                {settings.madrasaType || 'PRO'}
              </span>
            </div>
            <div className="text-[11px] text-white/80 font-normal leading-tight mt-0.5 truncate">
              {settings.tagline || (settings.nameEn ? `${settings.nameEn}` : 'MadrasaOS AI')}
            </div>
          </div>
        </div>

        {/* Center: Universal Command Bar Search trigger (Visible on larger desktop to prevent navbar wrapping) */}
        <div className="flex-1 max-w-xs xl:max-w-sm hidden xl:block min-w-0">
          <button
            onClick={onOpenCommand}
            className="w-full bg-primary-950/60 hover:bg-primary-950 border border-primary-700/60 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-emerald-200/80 flex items-center justify-between transition shadow-inner group"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-emerald-400 group-hover:text-emerald-200 transition flex-shrink-0" />
              <span className="truncate">{t('searchPlaceholder')}</span>
            </span>
            <kbd className="hidden sm:inline-block bg-primary-800/80 text-[10px] font-mono text-emerald-300 px-1.5 py-0.5 rounded border border-primary-600/60 flex-shrink-0">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Branch, AI, Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-nowrap">
          {/* Quick Search Icon for Laptops / Tablets where wide bar is hidden */}
          <button
            onClick={onOpenCommand}
            className="xl:hidden flex items-center justify-center w-8 h-8 bg-primary-950/60 hover:bg-primary-950 border border-primary-700/60 text-emerald-200 rounded-lg transition"
            title="অনুসন্ধান করুন (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* QR Scanner Trigger */}
          <button
            onClick={() => setShowQrScanner(true)}
            className="flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-600/50 text-white text-xs font-medium px-2 py-1.5 rounded-lg transition"
            title="QR কোড স্ক্যান করুন"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">QR স্ক্যান</span>
          </button>
          
          <DocumentCapture isOpen={showQrScanner} onClose={() => setShowQrScanner(false)} defaultTab="qr" />

          {/* Conversational Setup Wizard Trigger */}
          <button
            onClick={onOpenOnboarding}
            className="hidden lg:flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600/50 text-emerald-100 text-xs font-medium px-2 py-1.5 rounded-lg transition"
            title="মাদ্রাসার সিস্টেম সেটআপ ও কনফিগারেশন উইজার্ড"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent-gold" />
            <span className="hidden 2xl:inline">সেটআপ গাইড</span>
          </button>

          {/* AI Assistant Quick Trigger */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent-gold to-amber-600 hover:from-amber-500 hover:to-accent-gold text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition transform active:scale-95"
            title="এআই সহকারীকে প্রশ্ন করুন"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('askAI')}</span>
            <span className="sm:hidden">এআই</span>
          </button>

          {/* Branch Switcher Dropdown with Inline (+) Add Campus button */}
          <div className="relative flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="hidden sm:flex items-center gap-1.5 text-xs bg-primary-800/70 hover:bg-primary-800 px-2.5 py-1.5 rounded-lg border border-primary-700/60 transition text-emerald-100 cursor-pointer"
                title="ক্যাম্পাস শাখা নির্বাচন করুন"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="truncate max-w-[110px]">{activeBranch.nameBn}</span>
                <ChevronDown className="w-3 h-3 text-emerald-400" />
              </button>

              {showBranchMenu && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[9999] text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>ক্যাম্পাস শাখা পরিবর্তন</span>
                  </div>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
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
                  <div className="pt-1 mt-1 border-t border-slate-100 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBranchMenu(false);
                        setShowAddBranchModal(true);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন ক্যাম্পাস যোগ করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add Campus (+) Button */}
            <button
              type="button"
              onClick={() => setShowAddBranchModal(true)}
              className="hidden sm:flex items-center justify-center w-7 h-7 bg-primary-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-lg border border-primary-700/60 transition shadow-2xs active:scale-95 cursor-pointer"
              title="দ্রুত নতুন ক্যাম্পাস যুক্ত করুন (+)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 text-xs bg-primary-800/70 hover:bg-primary-800 px-2 py-1.5 rounded-lg border border-primary-700/60 transition text-emerald-100 cursor-pointer"
              title="ভাষা পরিবর্তন"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="uppercase font-semibold">{language}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1 z-[9999] text-xs">
                <button
                  type="button"
                  onClick={() => { setLanguage('bn'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${language === 'bn' ? 'font-bold text-primary-800' : ''}`}
                >
                  🇧🇩 বাংলা (Default)
                </button>
                <button
                  type="button"
                  onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${language === 'en' ? 'font-bold text-primary-800' : ''}`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => { setLanguage('ar'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${language === 'ar' ? 'font-bold text-primary-800' : ''}`}
                >
                  🇸🇦 العربية (RTL)
                </button>
              </div>
            )}
          </div>

          {/* Network Sync Status Interactive Toggle Switch */}
          <button
            type="button"
            onClick={toggleNetworkStatus}
            className="hidden sm:flex items-center gap-1.5 text-[11px] bg-primary-950/70 hover:bg-primary-950 px-2.5 py-1 rounded-md text-emerald-300 border border-primary-800 transition cursor-pointer active:scale-95 shadow-2xs"
            title="নেটওয়ার্ক স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন (অনলাইন / অফলাইন টগল)"
          >
            {networkStatus === 'online' ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="font-semibold">{t('online')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </>
            ) : networkStatus === 'syncing' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="font-semibold">{t('syncing')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span className="font-semibold text-rose-300">{t('offline')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              </>
            )}
          </button>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-primary-700 hover:from-emerald-600 hover:to-primary-600 px-3 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
              title="রোল ও প্রোফাইল পরিবর্তন করুন"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-800/80 flex items-center justify-center text-xs flex-shrink-0">
                {roles.find((r) => r.role === user?.role)?.icon || '👤'}
              </div>
              <div className="text-left hidden md:block min-w-0">
                <div className="text-[10px] text-emerald-200 font-semibold leading-none">
                  {roles.find((r) => r.role === user?.role)?.label.split('(')[0]?.trim() || 'মুহতামিম'}
                </div>
                <div className="text-xs font-bold leading-none mt-1 truncate max-w-[130px] sm:max-w-[160px] text-white">
                  {((user?.role === 'madrasa_admin' || user?.role === 'principal')
                    ? (settings.principalName || user?.fullNameBn)
                    : user?.fullNameBn) || 'মুহতামিম সাহেব'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-[9999]">
                <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                  <div className="font-bold text-xs text-slate-900">রোল ভিত্তিক প্রিভিউ মোড</div>
                  <div className="text-[11px] text-slate-500">বিভিন্ন রোলের ড্যাশবোর্ড ও পারমিশন পরীক্ষা করুন</div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition cursor-pointer ${
                        user?.role === r.role ? 'bg-emerald-50 text-primary-800 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </span>
                      {user?.role === r.role && (
                        <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kitabkhana-styled Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] text-[#17161A] rounded-xl border border-primary-900/20 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <h3 className="font-bold text-sm flex items-center gap-2 text-primary-900">
                <Building2 className="w-4 h-4 text-emerald-700" />
                নতুন ক্যাম্পাস শাখা যুক্ত করুন
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddBranchModal(false); setNewBranchInput(''); }}
                className="text-slate-500 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ক্যাম্পাসের নাম (বাংলায়)
              </label>
              <input
                type="text"
                value={newBranchInput}
                onChange={(e) => setNewBranchInput(e.target.value)}
                placeholder="যেমন: উত্তর ক্যাম্পাস / বালিকা শাখা"
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBranchInput.trim()) {
                    addBranch(newBranchInput.trim());
                    setNewBranchInput('');
                    setShowAddBranchModal(false);
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowAddBranchModal(false); setNewBranchInput(''); }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={!newBranchInput.trim()}
                onClick={() => {
                  if (newBranchInput.trim()) {
                    addBranch(newBranchInput.trim());
                    setNewBranchInput('');
                    setShowAddBranchModal(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg transition cursor-pointer"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
