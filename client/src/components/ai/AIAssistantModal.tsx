import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, X, Send, Bot, User, ArrowRight, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onNavigate: (tab: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, initialQuery, onNavigate }) => {
  const { apiCall, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'assistant',
      text: `আসসালামু আলাইকুম ${user.fullNameBn}। আমি মাদ্রাসাOS এর এআই অপারেটিং সহকারী। আমি সরাসরি ডাটাবেজ যাচাই করে আপনার প্রশ্নের নির্ভুল উত্তর ও প্রাতিষ্ঠানিক কাজের স্বয়ংক্রিয় সমাধান প্রস্তুত করতে পারি।`,
      actions: [
        { labelBn: 'আজকের অবস্থা বলো', query: 'আজকের অবস্থা বলো' },
        { labelBn: 'বকেয়া ফি তালিকা দেখাও', query: 'বকেয়া ফি তালিকা দেখাও' },
        { labelBn: 'হিফজ অগ্রগতি পর্যালোচনা', query: 'কোন হিফজ ছাত্রদের অগ্রগতি কমছে?' }
      ]
    }
  ]);
  const [input, setInput] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiCall('/api/v1/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: q })
      });

      const assistantMsg = {
        sender: 'assistant',
        text: response.summaryBn,
        dataType: response.dataType,
        data: response.data,
        sources: response.sources,
        actions: response.actions
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'দুঃখিত, তথ্য সংগ্রহ করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-primary-900 to-slate-900 p-4 text-white flex items-center justify-between border-b border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-accent-gold to-amber-600 flex items-center justify-center shadow-inner font-bold text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>মাদ্রাসাOS এআই অপারেটিং সহকারী</span>
                <span className="text-[10px] bg-emerald-700/80 text-emerald-200 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                  জিরো হ্যালুসিনেশন
                </span>
              </div>
              <div className="text-[11px] text-emerald-300/80">সরাসরি ডাটাবেজ টুল ও পারমিশন ভিত্তিক সিদ্ধান্ত</div>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Conversation Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2.5 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-700 text-white font-medium rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80'
                  }`}
                >
                  {m.text}

                  {/* Grounded Data Sources Footnote */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>উৎস: {m.sources.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Structured Action Buttons */}
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.actions.map((act: any, aIdx: number) => (
                      <button
                        key={aIdx}
                        onClick={() => {
                          if (act.actionType === 'navigate' && act.payload?.route) {
                            onClose();
                            const route = act.payload.route.replace('/', '');
                            onNavigate(route || 'dashboard');
                          } else if (act.query) {
                            handleSend(act.query);
                          } else {
                            alert(`${act.labelBn} প্রস্তুত করা হয়েছে।`);
                          }
                        }}
                        className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-primary-900 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700 text-[11px] flex items-center gap-1 transition"
                      >
                        <span>{act.labelBn}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <span className="w-2 h-2 rounded-full bg-accent-gold animate-ping"></span>
              <span>মাদ্রাসার ডাটাবেজ বিশ্লেষণ করা হচ্ছে...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="বাংলা বা ইংরেজিতে আপনার প্রশ্ন বা নির্দেশ লিখুন..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-emerald-700 hover:bg-emerald-600 text-white p-2.5 rounded-xl transition shadow-sm disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
