import React, { useState, useEffect } from 'react';
import { Search, X, Users, CalendarCheck2, Receipt, BookOpen, Workflow, Sparkles, ArrowRight, ArrowLeft, SlidersHorizontal } from 'lucide-react';

import { VoiceInputButton } from './VoiceInputButton';
import { useAuth } from '../../context/AuthContext';
import { isTabAllowedForRole } from '../../utils/rbac';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onAskAI: (query: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectTab, onAskAI }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const { user } = useAuth();
  if (!isOpen) return null;

  const allQuickLinks = [
    { label: 'আজকের ক্লাসের হাজিরা গ্রহণ', icon: CalendarCheck2, tab: 'attendance' },
    { label: 'শিক্ষার্থী তালিকা ও অনুসন্ধান', icon: Users, tab: 'students' },
    { label: 'হিফজ সবক ও মঞ্জিল খাতা', icon: BookOpen, tab: 'hifz' },
    { label: 'ফি আদায় ও বকেয়া রসিদ (POS)', icon: Receipt, tab: 'finance' },
    { label: 'স্বয়ংক্রিয় কাজের অটোমেশন সেন্টার', icon: Workflow, tab: 'automation' },
    { label: 'মাদ্রাসা সেটিংস ও কাস্টমাইজেশন', icon: SlidersHorizontal, tab: 'settings' }
  ];

  const quickLinks = allQuickLinks.filter((item) => isTabAllowedForRole(user.role, item.tab));

  const handleAIQuery = (qText: string) => {
    onClose();
    onAskAI(qText);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar with prominent Back Arrow */}
        <div className="flex items-center px-3 sm:px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-2 bg-slate-50/50 dark:bg-slate-900">
          {/* Back Arrow Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl transition border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer shadow-2xs active:scale-95"
            title="পেছনে ফিরে যান (Back / Esc)"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">পেছনে যান</span>
          </button>

          <Search className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-1" />
          <input
            autoFocus
            type="text"
            placeholder="আপনি কী করতে চান? লিখুন অথবা মুখে বলুন..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleAIQuery(query);
              }
            }}
            className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 min-w-0"
          />
          <VoiceInputButton onTranscript={(txt) => setQuery((prev) => prev ? `${prev} ${txt}` : txt)} />
          {query ? (
            <button 
              onClick={() => setQuery('')} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              title="লেখা মুছুন"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic / Quick Options */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1">
          {query.trim() ? (
            <div className="p-2">
              <button
                onClick={() => handleAIQuery(query)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary-900 text-xs font-semibold transition"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-gold" />
                  <span>এআই সহকারী দিয়ে খুঁজুন: "{query}"</span>
                </span>
                <ArrowRight className="w-4 h-4 text-primary-700" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                সরাসরি পৃষ্ঠা ব্রাউজ
              </div>
              {quickLinks.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectTab(item.tab);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition text-left"
                  >
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="text-[11px] font-semibold text-slate-400 px-3 pt-3 pb-1 uppercase tracking-wider">
                জনপ্রিয় এআই জিজ্ঞাসা
              </div>
              <button
                onClick={() => handleAIQuery('আজকের অবস্থা বলো')}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-emerald-50 rounded-lg transition"
              >
                ✨ "আজকের অবস্থা বলো" (দৈনিক ব্রিফিং)
              </button>
              <button
                onClick={() => handleAIQuery('যাদের ৩ মাসের বেশি ফি বাকি তাদের রিপোর্ট')}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-emerald-50 rounded-lg transition"
              >
                ✨ "যাদের ৩ মাসের বেশি ফি বাকি তাদের রিপোর্ট"
              </button>
              <button
                onClick={() => handleAIQuery('কোন হিফজ ছাত্রদের অগ্রগতি কমছে?')}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-emerald-50 rounded-lg transition"
              >
                ✨ "কোন হিফজ ছাত্রদের অগ্রগতি কমছে?"
              </button>
            </>
          )}
        </div>

        {/* Bottom Navigation & Close Bar for Mobile & Desktop */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>পেছনে ফিরে যান (Back)</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] hidden sm:inline text-slate-400">বা কীবোর্ডের Esc চাপুন</span>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
