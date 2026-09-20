import React from 'react';
import { LayoutDashboard, Users, CalendarCheck2, Receipt, Menu, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAI: () => void;
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenAI, onOpenMore }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-1 z-40 flex items-center justify-around text-slate-400">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] ${
          activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : ''
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>হোম</span>
      </button>

      <button
        onClick={() => setActiveTab('students')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] ${
          activeTab === 'students' ? 'text-emerald-400 font-bold' : ''
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>ছাত্র</span>
      </button>

      {/* Floating Center AI Button */}
      <button
        onClick={onOpenAI}
        className="-mt-5 bg-gradient-to-r from-accent-gold to-amber-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 active:scale-95 transition"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <button
        onClick={() => setActiveTab('attendance')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] ${
          activeTab === 'attendance' ? 'text-emerald-400 font-bold' : ''
        }`}
      >
        <CalendarCheck2 className="w-5 h-5 mb-0.5" />
        <span>হাজিরা</span>
      </button>

      <button
        onClick={onOpenMore}
        className={`flex flex-col items-center py-1 px-2 text-[10px] ${
          ['finance', 'hifz', 'hostel', 'automation', 'exams'].includes(activeTab)
            ? 'text-emerald-400 font-bold'
            : ''
        }`}
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>আরও</span>
      </button>
    </div>
  );
};
