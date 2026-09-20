import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
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
import { HostelScreen } from './components/modules/HostelScreen';
import { ExamScreen } from './components/modules/ExamScreen';
import { CertificatesScreen } from './components/modules/CertificatesScreen';
import { AutomationCenter } from './components/automation/AutomationCenter';

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  const openAIWithQuery = (query: string) => {
    setAiInitialQuery(query);
    setIsAIOpen(true);
  };

  const renderContent = () => {
    // Role-specific home dashboards
    if (activeTab === 'dashboard') {
      switch (user.role) {
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
      case 'attendance':
        return <AttendanceScreen />;
      case 'hifz':
        return <HifzScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'hostel':
        return <HostelScreen />;
      case 'exams':
        return <ExamScreen />;
      case 'certificates':
        return <CertificatesScreen />;
      case 'automation':
        return <AutomationCenter />;
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
      {/* Top Navbar */}
      <Navbar
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenAI={() => { setAiInitialQuery(''); setIsAIOpen(true); }}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Work Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAI={() => { setAiInitialQuery(''); setIsAIOpen(true); }}
        onOpenMore={() => setActiveTab('automation')}
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
        onComplete={() => alert('মাদ্রাসার কনফিগারেশন সফলভাবে আপডেট হয়েছে!')}
      />
    </div>
  );
};
