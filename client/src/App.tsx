import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { CommandPalette } from './components/common/CommandPalette';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { AIAssistantModal } from './components/ai/AIAssistantModal';

import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { HifzDashboard } from './components/dashboard/HifzDashboard';
import { AccountantDashboard } from './components/dashboard/AccountantDashboard';
import { HostelDashboard } from './components/dashboard/HostelDashboard';
import { GuardianDashboard } from './components/dashboard/GuardianDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';

import { StudentList } from './components/modules/StudentList';
import { AttendanceScreen } from './components/modules/AttendanceScreen';
import { HifzScreen } from './components/modules/HifzScreen';
import { FinanceScreen } from './components/modules/FinanceScreen';
import { PayrollScreen } from './components/modules/PayrollScreen';
import { DonationsScreen } from './components/modules/DonationsScreen';
import { CashBookScreen } from './components/modules/CashBookScreen';
import { HostelScreen } from './components/modules/HostelScreen';
import { ExamScreen } from './components/modules/ExamScreen';
import { CertificatesScreen } from './components/modules/CertificatesScreen';
import { AutomationCenter } from './components/automation/AutomationCenter';
import { AcademicsScreen } from './components/modules/AcademicsScreen';
import { AdmissionsScreen } from './components/modules/AdmissionsScreen';
import { LibraryScreen } from './components/modules/LibraryScreen';
import { PublicPortalScreen } from './components/modules/PublicPortalScreen';
import { BefaqScreen } from './components/modules/BefaqScreen';
import { MuhasabaScreen } from './components/modules/MuhasabaScreen';
import { CanteenScreen } from './components/modules/CanteenScreen';
import { SmsScreen } from './components/modules/SmsScreen';
import { BranchScreen } from './components/modules/BranchScreen';
import { InstallPwaBanner } from './components/common/InstallPwaBanner';
import { ToastContainer } from './components/common/ToastContainer';
import './utils/toast';

import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { InstitutionSettingsScreen } from './components/settings/InstitutionSettingsScreen';
import { AccessDeniedScreen } from './components/common/AccessDeniedScreen';
import { MobileMenuDrawer } from './components/common/MobileMenuDrawer';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegistrationScreen } from './components/auth/RegistrationScreen';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { isTabAllowedForRole } from './utils/rbac';

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  // Browser Back Button (Mobile & Desktop) Integration
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isCommandOpen) {
        setIsCommandOpen(false);
        return;
      }
      if (isAIOpen) {
        setIsAIOpen(false);
        return;
      }
      if (isOnboardingOpen) {
        setIsOnboardingOpen(false);
        return;
      }
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else if (tabHistory.length > 0) {
        const prev = tabHistory[tabHistory.length - 1];
        setTabHistory((h) => h.slice(0, -1));
        setActiveTab(prev);
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCommandOpen, isAIOpen, isOnboardingOpen, tabHistory]);

  const navigateToTab = (newTab: string) => {
    if (newTab !== activeTab) {
      try {
        window.history.pushState({ tab: newTab }, '', `#${newTab}`);
      } catch {}
      setTabHistory((prev) => [...prev, activeTab]);
      setActiveTab(newTab);
    }
  };

  const handleGoBack = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory((h) => h.slice(0, -1));
      setActiveTab(prev);
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const getTabTitle = (tab: string): string => {
    const titles: Record<string, string> = {
      dashboard: 'ড্যাশবোর্ড',
      students: 'শিক্ষার্থী তালিকা ও ভর্তি',
      branches: 'ক্যাম্পাস ও শাখা ব্যবস্থাপনা',
      attendance: 'দৈনিক ডিজিটাল হাজিরা',
      hifz: 'হিফজুল কুরআন বিভাগ',
      academics: 'শিক্ষা ও পাঠ্যক্রম',
      befaq: 'বেফাক ও কেন্দ্রীয় পরীক্ষা',
      muhasaba: 'দৈনিক আমল ও মুহাসাবা',
      canteen: 'ক্যান্টিন ও মেস খাবার',
      sms: 'এসএমএস ও নোটিফিকেশন',
      portal: 'পাবলিক পোর্টাল',
      finance: 'আর্থিক ব্যবস্থাপনা ও ফি',
      payroll: 'শিক্ষক ও স্টাফ বেতন',
      donations: 'দান ও অনুদান তহবিল',
      cash_book: 'দৈনিক ক্যাশ বুক',
      hostel: 'আবাসিক ছাত্রাবাস',
      exams: 'পরীক্ষা ও ফলাফল',
      admissions: 'নতুন ভর্তি আবেদন',
      library: 'গ্রন্থাগার ও কিতাব',
      certificates: 'সনদপত্র ও প্রত্যয়ন',
      automation: 'অটোমেশন সেন্টার',
      settings: 'মাদ্রাসার কাস্টমাইজেশন ও সেটিংস',
      ai: 'এআই অপারেটিং সহকারী'
    };
    return titles[tab] || tab;
  };

  // If user is not authenticated, render LoginScreen or RegistrationScreen
  if (!user) {
    if (authView === 'register') {
      return <RegistrationScreen onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onNavigateToRegister={() => setAuthView('register')} />;
  }

  const openAIWithQuery = (query: string) => {
    setAiInitialQuery(query);
    setIsAIOpen(true);
  };

  const renderContent = () => {
    // RBAC Security Route Guard
    if (activeTab !== 'dashboard' && !isTabAllowedForRole(user.role, activeTab)) {
      return <AccessDeniedScreen tabId={activeTab} onNavigateHome={() => setActiveTab('dashboard')} />;
    }

    // Role-specific home dashboards
    if (activeTab === 'dashboard') {
      switch (user.role) {
        case 'super_admin':
          return <SuperAdminDashboard />;
        case 'teacher':
          return <TeacherDashboard onNavigate={setActiveTab} />;
        case 'hifz_teacher':
          return <HifzDashboard onNavigate={setActiveTab} />;
        case 'accountant':
          return <AccountantDashboard onNavigate={setActiveTab} />;
        case 'hostel_manager':
          return <HostelDashboard onNavigate={setActiveTab} />;
        case 'guardian':
          return <GuardianDashboard onNavigate={setActiveTab} />;
        case 'student':
          return <StudentDashboard />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} onOpenAIQuery={openAIWithQuery} />;
      }
    }

    switch (activeTab) {
      case 'students':
        return <StudentList />;
      case 'branches':
        return <BranchScreen />;
      case 'attendance':
        return <AttendanceScreen />;
      case 'hifz':
        return <HifzScreen />;
      case 'academics':
        return <AcademicsScreen />;
      case 'befaq':
        return <BefaqScreen />;
      case 'muhasaba':
        return <MuhasabaScreen />;
      case 'canteen':
        return <CanteenScreen />;
      case 'sms':
        return <SmsScreen />;
      case 'portal':
        return <PublicPortalScreen onNavigate={setActiveTab} />;
      case 'finance':
        return <FinanceScreen />;
      case 'payroll':
        return <PayrollScreen />;
      case 'donations':
        return <DonationsScreen />;
      case 'cash_book':
        return <CashBookScreen />;
      case 'hostel':
        return <HostelScreen />;
      case 'exams':
        return <ExamScreen />;
      case 'admissions':
        return <AdmissionsScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'certificates':
        return <CertificatesScreen />;
      case 'automation':
        return <AutomationCenter />;
      case 'settings':
        return <InstitutionSettingsScreen />;
      case 'ai':
        return (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setIsAIOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md"
            >
              এআই অপারেটিং সহকারী ডায়ালগ খুলুন
            </button>
          </div>
        );
      default:
        return <AdminDashboard onNavigate={setActiveTab} onOpenAIQuery={openAIWithQuery} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* PWA Install Banner */}
      <InstallPwaBanner />

      {/* Top Navbar */}
      <Navbar
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenAI={() => { setAiInitialQuery(''); setIsAIOpen(true); }}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        activeTab={activeTab}
        canGoBack={activeTab !== 'dashboard' || tabHistory.length > 0}
        onGoBack={handleGoBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={navigateToTab} />

        {/* Main Work Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Universal Sticky Top Navigation Bar on Sub-pages */}
          {activeTab !== 'dashboard' && (
            <div className="mb-5 flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-700/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-1.5 rounded-xl transition border border-slate-200/80 dark:border-slate-600/50 active:scale-95 cursor-pointer shadow-2xs"
                  title="পূর্ববর্তী পেজে ফিরে যান (Back)"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>পিছনে যান</span>
                </button>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
                  <span className="text-slate-400">ড্যাশবোর্ড</span>
                  <span>/</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{getTabTitle(activeTab)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-700/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-1.5 rounded-xl transition border border-slate-200/80 dark:border-slate-600/50 active:scale-95 cursor-pointer shadow-2xs"
                  title="এই পেজের তথ্য রিফ্রেশ করুন"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">রিফ্রেশ</span>
                </button>
              </div>
            </div>
          )}

          <div key={refreshKey}>
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenAI={() => { setAiInitialQuery(''); setIsAIOpen(true); }}
        onOpenMore={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Navigation Drawer (Role-Filtered) */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={navigateToTab}
      />

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectTab={setActiveTab}
        onAskAI={openAIWithQuery}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        initialQuery={aiInitialQuery}
        onNavigate={setActiveTab}
      />

      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          handleRefresh();
        }}
      />

      <ToastContainer />
    </div>
  );
};
