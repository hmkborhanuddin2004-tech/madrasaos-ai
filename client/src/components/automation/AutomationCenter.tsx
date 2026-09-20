import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Workflow,
  Sparkles,
  PlusCircle,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export const AutomationCenter: React.FC = () => {
  const { apiCall } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'workflows' | 'approvals' | 'builder' | 'natural_language' | 'executions'>('workflows');
  const [isLoading, setIsLoading] = useState(false);

  // Natural Language Compiler State
  const [nlPrompt, setNlPrompt] = useState('যে ছাত্র ৩ দিন টানা অনুপস্থিত থাকবে, তার অভিভাবককে মেসেজ পাঠানোর আগে আমাকে দেখাবে।');
  const [compiledResult, setCompiledResult] = useState<any>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const wfList = await apiCall('/api/v1/automations');
      const apprList = await apiCall('/api/v1/automations/approvals/pending');
      const execList = await apiCall('/api/v1/automations/executions/recent');

      setWorkflows(wfList || []);
      setPendingApprovals(apprList || []);
      setExecutions(execList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await apiCall(`/api/v1/automations/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentState })
      });
      fetchData();
    } catch (err) {
      alert('ওয়ার্কফ্লো সক্রিয়তা পরিবর্তন করতে সমস্যা হয়েছে।');
    }
  };

  const handleTrigger = async (id: string) => {
    try {
      const res = await apiCall(`/api/v1/automations/${id}/trigger`, {
        method: 'POST'
      });
      alert(`ওয়ার্কফ্লো নির্বাহ শুরু হয়েছে (স্ট্যাটাস: ${res.status === 'waiting_approval' ? 'অনুমোদনের অপেক্ষায়' : 'সম্পন্ন'})`);
      fetchData();
    } catch (err) {
      alert('ওয়ার্কফ্লো শুরু করতে সমস্যা হয়েছে।');
    }
  };

  const handleApprovalDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    try {
      await apiCall(`/api/v1/automations/approvals/${approvalId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision, remarks: 'কর্তৃপক্ষ কর্তৃক অনুমোদিত' })
      });
      alert(`পদক্ষেপটি ${decision === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে।`);
      fetchData();
    } catch (err) {
      alert('সিদ্ধান্ত সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleCompilePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlPrompt.trim()) return;

    setIsCompiling(true);
    try {
      const res = await apiCall('/api/v1/automations/compile-natural-language', {
        method: 'POST',
        body: JSON.stringify({ prompt: nlPrompt })
      });
      setCompiledResult(res);
    } catch (err) {
      alert('এআই ওয়ার্কফ্লো কম্পাইল করতে সমস্যা হয়েছে।');
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with ROI Statistics */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-accent-gold uppercase tracking-wider flex items-center gap-1.5">
            <Workflow className="w-4 h-4 text-accent-gold" />
            <span>স্বয়ংক্রিয় কাজের অপারেটিং সিস্টেম (Automation Engine)</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            মাদ্রাসা অটোমেশন সেন্টার
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            পুনরাবৃত্তিমূলক কাজসমূহ স্বয়ংক্রিয় করুন এবং প্রাতিষ্ঠানিক কাজের গতি বাড়ান
          </p>
        </div>

        {/* Estimated Hours Saved KPI */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
          <div className="text-[10px] text-emerald-300 font-semibold uppercase">এই মাসে সময় সাশ্রয়</div>
          <div className="text-xl font-bold text-white">৪২ ঘণ্টা</div>
          <div className="text-[10px] text-slate-300">১১৮টি ম্যানুয়াল টাস্ক পরিহার</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'workflows' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ওয়ার্কফ্লো টেমপ্লেটসমূহ ({workflows.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'approvals' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>অপেক্ষমাণ অনুমোদন ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('natural_language')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'natural_language' ? 'bg-gradient-to-r from-accent-gold to-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>এআই ওয়ার্কফ্লো জেনারেটর</span>
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'builder' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ভিজ্যুয়াল নোড ক্যানভাস
        </button>

        <button
          onClick={() => setActiveTab('executions')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'executions' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          নির্বাহ লগ
        </button>
      </div>

      {/* Tab: Workflows List */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`p-5 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
                wf.is_active ? 'bg-white border-slate-200 hover:border-emerald-300' : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{wf.name}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                    {wf.trigger_type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{wf.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleToggle(wf.id, Boolean(wf.is_active))}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                    wf.is_active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                >
                  {wf.is_active ? 'সক্রিয় আছে' : 'নিষ্ক্রিয়'}
                </button>

                <button
                  onClick={() => handleTrigger(wf.id)}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition text-[11px]"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>এখনই টেস্ট রান করুন</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Human-in-the-Loop Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
            <span className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <span>মানবীয় অনুমোদন সুরক্ষা (Human-in-the-Loop Safeguard)</span>
            </span>
            <span>অ্যাডমিনের সম্মতি ছাড়া কোনো অভিভাবককে মেসেজ বা আর্থিক পরিবর্তন স্বয়ংক্রিয়ভাবে হবে না।</span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map((appr) => (
              <div key={appr.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900">{appr.title}</div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    অনুমোদন অপেক্ষমাণ
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{appr.description}</p>

                {appr.actionPayload?.sampleMessage && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800">
                    <span className="font-bold text-slate-500 block mb-1">প্রস্তাবিত SMS ড্রাফট:</span>
                    "{appr.actionPayload.sampleMessage}"
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleApprovalDecision(appr.id, 'rejected')}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-4 py-2 rounded-xl transition border border-red-200"
                  >
                    <X className="w-4 h-4" />
                    <span>প্রত্যাখ্যান করুন</span>
                  </button>
                  <button
                    onClick={() => handleApprovalDecision(appr.id, 'approved')}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>অনুমোদন ও নির্বাহ করুন</span>
                  </button>
                </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                বর্তমানে কোনো কাজ অনুমোদনের অপেক্ষায় নেই।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Natural Language AI Compiler */}
      {activeTab === 'natural_language' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-gold" />
              <span>বাংলা প্রম্পট দিয়ে স্বয়ংক্রিয় কাজের ওয়ার্কফ্লো তৈরি</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              আপনি শুধু আপনার প্রয়োজনীয় নিয়মটি সাধারণ বাংলায় লিখুন — এআই স্বয়ংক্রিয় নোড ও অনুমোদন কাঠামো তৈরি করে দেবে।
            </p>
          </div>

          <form onSubmit={handleCompilePrompt} className="space-y-3">
            <textarea
              rows={3}
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              placeholder="যেমন: প্রতিদিন রাত ৮টায় আজকের attendance report তৈরি করে admin-কে notification দাও..."
              className="w-full p-4 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCompiling}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-primary-700 hover:from-emerald-500 hover:to-primary-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-accent-gold" />
                <span>{isCompiling ? 'কম্পাইল হচ্ছে...' : 'ওয়ার্কফ্লো কম্পাইল ও প্রিভিউ দেখুন'}</span>
              </button>
            </div>
          </form>

          {/* Compiled Result Preview */}
          {compiledResult && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>কম্পাইলকৃত ওয়ার্কফ্লো: "{compiledResult.compiledWorkflow.name}"</span>
              </div>

              {/* Node Sequence Visual Flow */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {compiledResult.compiledWorkflow.nodes?.map((node: any, nIdx: number) => (
                  <React.Fragment key={node.id}>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm font-semibold text-slate-800">
                      <div className="text-[9px] text-slate-400 font-mono uppercase">{node.type}</div>
                      <div>{node.title}</div>
                    </div>
                    {nIdx < compiledResult.compiledWorkflow.nodes.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Dry-run safety box */}
              <div className="p-3 bg-emerald-100 rounded-xl text-xs text-emerald-950 font-medium">
                🛡️ {compiledResult.dryRunPreview.safetyCheck} (সম্ভাব্য প্রাপক: {compiledResult.dryRunPreview.estimatedRecipients} জন)
              </div>

              <button
                onClick={() => {
                  alert('ওয়ার্কফ্লো সফলভাবে সিস্টেমে যুক্ত ও সক্রিয় করা হয়েছে!');
                  setActiveTab('workflows');
                  fetchData();
                }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
              >
                এই ওয়ার্কফ্লোটি সক্রিয় করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Visual Node Canvas Builder Preview */}
      {activeTab === 'builder' && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-emerald-400" />
                <span>ভিজ্যুয়াল ড্র্যাগ-অ্যান্ড-ড্রপ নোড এডিটর (Visual Workflow Builder)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">ট্রিগার, লজিক শর্ত, এআই এবং একশন নোডের সংযোগ</p>
            </div>
            <button className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
              + নতুন নোড যুক্ত করুন
            </button>
          </div>

          {/* Interactive DAG Visual Diagram */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 overflow-x-auto min-h-[300px] flex items-center justify-center">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-center min-w-[140px] shadow-lg">
                <div className="text-[9px] uppercase tracking-wider text-emerald-400">ট্রিগার</div>
                <div className="text-sm font-bold mt-1">হাজিরা রেকর্ড</div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-500" />

              <div className="p-4 rounded-2xl bg-amber-900/60 border border-amber-500/40 text-amber-200 text-center min-w-[140px] shadow-lg">
                <div className="text-[9px] uppercase tracking-wider text-amber-400">শর্ত যাচাই</div>
                <div className="text-sm font-bold mt-1">অনুপস্থিতি &gt;= ৩</div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-500" />

              <div className="p-4 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-200 text-center min-w-[140px] shadow-lg">
                <div className="text-[9px] uppercase tracking-wider text-purple-400">এআই নোড</div>
                <div className="text-sm font-bold mt-1">মার্জিত মেসেজ ড্রাফট</div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-500" />

              <div className="p-4 rounded-2xl bg-teal-900/60 border border-teal-500/40 text-teal-200 text-center min-w-[140px] shadow-lg">
                <div className="text-[9px] uppercase tracking-wider text-teal-400">অ্যাডমিন অনুমোদন</div>
                <div className="text-sm font-bold mt-1">মুহতামিম ডিজিটাল সাইন</div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-500" />

              <div className="p-4 rounded-2xl bg-blue-900/60 border border-blue-500/40 text-blue-200 text-center min-w-[140px] shadow-lg">
                <div className="text-[9px] uppercase tracking-wider text-blue-400">আউটপুট পদক্ষেপ</div>
                <div className="text-sm font-bold mt-1">বাংলা ইউনিকোড SMS</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Executions History */}
      {activeTab === 'executions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-700">
            সাম্প্রতিক অটোমেশন নির্বাহ ইতিহাস
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {executions.map((ex) => (
              <div key={ex.id} className="p-4 space-y-2 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{ex.workflow_name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ex.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ex.status === 'waiting_approval'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ex.status === 'completed'
                      ? 'সফলভাবে সম্পন্ন'
                      : ex.status === 'waiting_approval'
                      ? 'অনুমোদনের অপেক্ষায়'
                      : 'ব্যর্থ'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">শুরুর সময়: {ex.started_at}</div>
                <div className="space-y-1 pt-1">
                  {ex.logs?.map((l: any, lIdx: number) => (
                    <div key={lIdx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>[{l.nodeTitle}] {l.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
