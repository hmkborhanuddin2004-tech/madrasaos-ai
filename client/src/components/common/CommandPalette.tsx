import React, { useState, useEffect } from 'react';
import { Search, X, Users, CalendarCheck2, Receipt, BookOpen, Workflow, Sparkles, ArrowRight } from 'lucide-react';

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

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'আজকের ক্লাসের হাজিরা গ্রহণ', icon: CalendarCheck2, tab: 'attendance' },
    { label: 'শিক্ষার্থী তালিকা ও অনুসন্ধান', icon: Users, tab: 'students' },
    { label: 'হিফজ সবক ও মঞ্জিল খাতা', icon: BookOpen, tab: 'hifz' },
    { label: 'ফি আদায় ও বকেয়া রসিদ (POS)', icon: Receipt, tab: 'finance' },
    { label: 'স্বয়ংক্রিয় কাজের অটোমেশন সেন্টার', icon: Workflow, tab: 'automation' }
  ];

  const handleAIQuery = (qText: string) => {
    onClose();
    onAskAI(qText);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-emerald-600 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="আপনি কী করতে চান? লিখুন..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleAIQuery(query);
              }
            }}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
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
      </div>
    </div>
  );
};
