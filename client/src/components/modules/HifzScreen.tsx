import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Award, CheckCircle2, AlertTriangle, Save, Check, TrendingUp, Sparkles } from 'lucide-react';

export const HifzScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentSummary, setSelectedStudentSummary] = useState<any>(null);
  const [decliningAlerts, setDecliningAlerts] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'daily' | 'progress' | 'alerts'>('daily');
  const [isSaving, setIsSaving] = useState(false);

  const fetchWorkspace = async () => {
    try {
      const data = await apiCall('/api/v1/hifz/today');
      setWorkspace(data);
      setStudents(data.students || []);
      if (data.students?.length > 0) {
        fetchStudentSummary(data.students[0].studentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeclining = async () => {
    try {
      const data = await apiCall('/api/v1/hifz/declining-alerts');
      setDecliningAlerts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentSummary = async (studentId: string) => {
    try {
      const data = await apiCall(`/api/v1/hifz/student/${studentId}/summary`);
      setSelectedStudentSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    fetchDeclining();
  }, []);

  const handleRatingChange = async (studentId: string, rating: 'excellent' | 'good' | 'weak') => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, sabaqRating: rating, hasRecordedToday: true } : s))
    );

    // Save record to backend
    const current = students.find((s) => s.studentId === studentId);
    if (!current) return;

    try {
      await apiCall('/api/v1/hifz/record', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          sabaqPara: current.sabaqPara,
          sabaqSurah: current.sabaqSurah,
          sabaqAyahRange: current.sabaqAyahRange,
          sabaqPages: current.sabaqPages,
          sabaqRating: rating,
          sabqiPara: current.sabqiPara,
          sabqiMistakes: current.sabqiMistakes,
          manzilPara: current.manzilPara,
          manzilMistakes: current.manzilMistakes,
          teacherNotes: current.teacherNotes
        })
      });
    } catch (err) {
      console.error('Failed to update hifz rating:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('daily')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'daily'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>আজকের সবক খাতা ({students.length} জন)</span>
          </button>
          <button
            onClick={() => setActiveView('progress')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'progress'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>হিফজ কুরআন ট্র্যাকার</span>
          </button>
          <button
            onClick={() => setActiveView('alerts')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'alerts'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>অগ্রগতি অ্যালার্ট ({decliningAlerts.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          রেকর্ড সম্পন্ন: {students.filter((s) => s.hasRecordedToday).length}/{students.length} জন
        </div>
      </div>

      {activeView === 'daily' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((s) => (
            <div
              key={s.studentId}
              className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
                s.hasRecordedToday
                  ? 'border-emerald-200 bg-white dark:bg-slate-800'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">রোল: {s.rollNumber}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{s.fullNameBn}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">{s.classNameBn}</div>
                  </div>
                  {s.hasRecordedToday && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      রেকর্ডকৃত
                    </span>
                  )}
                </div>

                {/* Sabaq details */}
                <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">আজকের সবক:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      পারা {s.sabaqPara} ({s.sabaqSurah})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">সবকী ও মঞ্জিল:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      পারা {s.sabqiPara} (ভুল: {s.sabqiMistakes}) • মঞ্জিল: পারা {s.manzilPara}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast 1-Tap Evaluation Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  মূল্যায়ন রেটিং নির্বাচন করুন:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleRatingChange(s.studentId, 'excellent')}
                    className={`py-1.5 text-[11px] font-bold rounded-xl transition ${
                      s.sabaqRating === 'excellent'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    ✓ মুমতাজ
                  </button>
                  <button
                    onClick={() => handleRatingChange(s.studentId, 'good')}
                    className={`py-1.5 text-[11px] font-bold rounded-xl transition ${
                      s.sabaqRating === 'good'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900'
                    }`}
                  >
                    ~ জাইয়্যিদ
                  </button>
                  <button
                    onClick={() => handleRatingChange(s.studentId, 'weak')}
                    className={`py-1.5 text-[11px] font-bold rounded-xl transition ${
                      s.sabaqRating === 'weak'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-red-50 hover:bg-red-100 text-red-900'
                    }`}
                  >
                    ⚠ দুর্বল
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === 'progress' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>হিফজুল কুরআন পূর্ণাঙ্গ ৩০ পারা ট্র্যাকার</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                শিক্ষার্থী অনুযায়ী পবিত্র কুরআনের ৩০ পারা হিফজ ও পুনরাবৃত্তি ট্র্যাকিং
              </p>
            </div>

            <select
              onChange={(e) => fetchStudentSummary(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold"
            >
              {students.map((st) => (
                <option key={st.studentId} value={st.studentId}>
                  {st.fullNameBn} (রোল {st.rollNumber})
                </option>
              ))}
            </select>
          </div>

          {selectedStudentSummary && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">হিফজ সমাপ্তি হার</div>
                  <div className="text-3xl font-bold text-emerald-700 mt-1">
                    {selectedStudentSummary.progressPercentage}%
                  </div>
                  <div className="text-[11px] text-emerald-900 font-medium mt-1">
                    মোট সম্পন্ন: {selectedStudentSummary.totalParasCompleted} পারা
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">বর্তমান সবক পারা</div>
                  <div className="text-3xl font-bold text-slate-800 mt-1">
                    পারা {selectedStudentSummary.currentPara}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {selectedStudentSummary.currentSurah}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">গড় ভুল সংখ্যা (শেষ ১০ দিন)</div>
                  <div className="text-3xl font-bold text-amber-700 mt-1">
                    {selectedStudentSummary.averageMistakes}টি
                  </div>
                  <div className="text-[11px] text-amber-900 font-medium mt-1">
                    ধারাবাহিকতা: {selectedStudentSummary.trend === 'improving' ? 'উন্নতিশীল (মাশাআল্লাহ)' : 'পুনরাবৃত্তি আবশ্যক'}
                  </div>
                </div>
              </div>

              {/* 30 Paras Visual Grid */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-3">পবিত্র কুরআন ৩০ পারা ভিজ্যুয়াল অগ্রগতি গ্রিড:</div>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const pNum = idx + 1;
                    const isCompleted = pNum < selectedStudentSummary.currentPara;
                    const isCurrent = pNum === selectedStudentSummary.currentPara;
                    return (
                      <div
                        key={pNum}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : isCurrent
                            ? 'bg-accent-gold text-white border-amber-600 animate-pulse'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-semibold leading-none">পারা</div>
                        <div className="text-sm font-bold mt-0.5">{pNum}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'alerts' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-red-50/50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-red-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>হিফজ অগ্রগতি দুর্বল বা অবনতিশীল শিক্ষার্থীদের তালিকা</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                যাদের সবকী বা মঞ্জিলে গড়ে ৪টির বেশি ভুল হচ্ছে অথবা দুর্বল রেটিং পেয়েছে।
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {decliningAlerts.map((da: any) => (
              <div key={da.student_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">{da.full_name_bn}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    আইডি: {da.student_id_number} • শ্রেণি: {da.class_name_bn}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full text-xs">
                    গড় ভুল: {Math.round(da.avg_mistakes || 4)}টি
                  </span>
                  <button
                    onClick={() => {
                      setActiveView('progress');
                      fetchStudentSummary(da.student_id);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                  >
                    ট্র্যাকার দেখুন
                  </button>
                </div>
              </div>
            ))}
            {decliningAlerts.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                আলহামদুলিল্লাহ, বর্তমানে কোনো শিক্ষার্থীর অগ্রগতিতে গুরুতর অবনতি পরিলক্ষিত হয়নি।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
