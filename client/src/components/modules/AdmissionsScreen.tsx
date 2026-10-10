import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  FileText,
  XCircle,
  Award,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const AdmissionsScreen: React.FC = () => {
  const { apiCall, user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Status Change State
  const [newStatus, setNewStatus] = useState<string>('approved');
  const [interviewScore, setInterviewScore] = useState<number>(85);
  const [decisionNotes, setDecisionNotes] = useState<string>('');

  // Create Form State
  const [formApplicantNameBn, setFormApplicantNameBn] = useState('');
  const [formApplicantNameEn, setFormApplicantNameEn] = useState('');
  const [formDob, setFormDob] = useState('2015-01-01');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formAppliedDept, setFormAppliedDept] = useState('কওমী বিভাগ');
  const [formAppliedClass, setFormAppliedClass] = useState('নাহবেমীর জামাত');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const endpoint = statusFilter ? `/api/v1/admissions?status=${statusFilter}` : '/api/v1/admissions';
      const data = await apiCall(endpoint);
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiCall('/api/v1/admissions', {
        method: 'POST',
        body: JSON.stringify({
          applicantNameBn: formApplicantNameBn,
          applicantNameEn: formApplicantNameEn,
          dateOfBirth: formDob,
          guardianNameBn: formGuardianName,
          guardianPhone: formGuardianPhone,
          appliedDepartment: formAppliedDept,
          appliedClass: formAppliedClass,
          notes: formNotes
        })
      });

      setIsModalOpen(false);
      setFormApplicantNameBn('');
      setFormApplicantNameEn('');
      setFormGuardianName('');
      setFormGuardianPhone('');
      setFormNotes('');
      await fetchApplications();
    } catch (err) {
      console.error('Failed to submit admission:', err);
      alert('ভর্তি আবেদন সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSubmitting(true);
    try {
      await apiCall(`/api/v1/admissions/${selectedApp.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          score: Number(interviewScore),
          notes: decisionNotes
        })
      });

      setIsStatusModalOpen(false);
      setSelectedApp(null);
      await fetchApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('স্ট্যাটাস হালনাগাদ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      app.applicant_name_bn?.toLowerCase().includes(term) ||
      app.application_number?.toLowerCase().includes(term) ||
      app.guardian_phone?.includes(term) ||
      app.applied_class?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'submitted':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full text-[10px]">নতুন আবেদন</span>;
      case 'interview_scheduled':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px]">সাক্ষাৎকার নির্ধারিত</span>;
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">ভর্তি অনুমোদিত</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full text-[10px]">প্রত্যাখ্যাত</span>;
      case 'enrolled':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full text-[10px]">ভর্তি সম্পন্ন</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">{st}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-emerald-900 to-primary-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-accent-gold" />
            <span>ভর্তি ব্যবস্থাপনা ও অনলাইন আবেদন পোর্টাল</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            শিক্ষার্থী ভর্তি কার্যক্রম
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            আবেদন যাচাই, মৌখিক ও লিখিত সাক্ষাৎকার নম্বর নির্ধারণ এবং চূড়ান্ত ভর্তি অনুমোদন
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-gold to-amber-600 hover:from-amber-500 hover:to-accent-gold text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন আবেদন জমা নিন</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-slate-500">মোট আবেদন</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{applications.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-blue-600">নতুন পর্যালোচনায়</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {applications.filter((a) => a.status === 'submitted').length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-amber-600">সাক্ষাৎকার অপেক্ষায়</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {applications.filter((a) => a.status === 'interview_scheduled').length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-emerald-600">ভর্তি অনুমোদিত</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {applications.filter((a) => a.status === 'approved').length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="আবেদন নম্বর, প্রার্থীর নাম অথবা অভিভাবকের ফোন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <VoiceInputButton onTranscript={(txt) => setSearchQuery(txt)} />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: '', label: 'সকল' },
            { id: 'submitted', label: 'নতুন' },
            { id: 'interview_scheduled', label: 'সাক্ষাৎকার' },
            { id: 'approved', label: 'অনুমোদিত' },
            { id: 'rejected', label: 'বাতিল' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                statusFilter === st.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse h-24"></div>
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <UserPlus className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">কোনো ভর্তি আবেদন পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            বর্তমান ফিল্টারে কোনো আবেদন তালিকাভুক্ত নেই। উপরে "নতুন আবেদন জমা নিন" বাটনে ক্লিক করে অফলাইন ভর্তি ফর্ম রেকর্ড করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {app.application_number}
                  </span>
                  {getStatusBadge(app.status)}
                  {app.interview_score !== null && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      সাক্ষাৎকার নম্বর: {app.interview_score}/১০০
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {app.applicant_name_bn}{' '}
                  <span className="text-xs font-normal text-slate-500">({app.applicant_name_en})</span>
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>বিভাগ: <b className="text-slate-700 dark:text-slate-300">{app.applied_department}</b></span>
                  <span>আবেদনকৃত জামাত: <b className="text-slate-700 dark:text-slate-300">{app.applied_class}</b></span>
                  <span>অভিভাবক: {app.guardian_name_bn} ({app.guardian_phone})</span>
                  <span>জন্মতারিখ: {app.date_of_birth}</span>
                </div>

                {app.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">
                    মন্তব্য: "{app.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setNewStatus('approved');
                    setInterviewScore(app.interview_score || 85);
                    setDecisionNotes(app.notes || '');
                    setIsStatusModalOpen(true);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
                >
                  স্ট্যাটাস ও ফলাফল
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-primary-900 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-accent-gold" />
                <h3 className="text-sm font-bold">নতুন ভর্তি আবেদন ফরম</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">প্রার্থীর নাম (বাংলা)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="যেমন: তাহমিদুল ইসলাম"
                      value={formApplicantNameBn}
                      onChange={(e) => setFormApplicantNameBn(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <VoiceInputButton onTranscript={(txt) => setFormApplicantNameBn(txt)} />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">প্রার্থীর নাম (ইংরেজি)</label>
                  <input
                    type="text"
                    required
                    placeholder="Tahmidul Islam"
                    value={formApplicantNameEn}
                    onChange={(e) => setFormApplicantNameEn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">অভিভাবকের নাম</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="মো: রফিকুল ইসলাম"
                      value={formGuardianName}
                      onChange={(e) => setFormGuardianName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <VoiceInputButton onTranscript={(txt) => setFormGuardianName(txt)} />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">অভিভাবকের মোবাইল</label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">জন্মতারিখ</label>
                  <input
                    type="date"
                    required
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শিক্ষা বিভাগ</label>
                  <select
                    value={formAppliedDept}
                    onChange={(e) => setFormAppliedDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="কওমী বিভাগ">কওমী বিভাগ</option>
                    <option value="হিফজুল কুরআন বিভাগ">হিফজুল কুরআন বিভাগ</option>
                    <option value="আলিয়া বিভাগ">আলিয়া বিভাগ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">আবেদনকৃত জামাত</label>
                  <input
                    type="text"
                    required
                    placeholder="নাহবেমীর জামাত"
                    value={formAppliedClass}
                    onChange={(e) => setFormAppliedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">পূর্বতন প্রতিষ্ঠান ও বিশেষ মন্তব্য</label>
                  <VoiceInputButton onTranscript={(txt) => setFormNotes((prev) => prev ? `${prev} ${txt}` : txt)} />
                </div>
                <textarea
                  rows={2}
                  placeholder="পূর্বের মাদ্রাসার নাম, সবক বা নূরানী পাঠের বিবরণ..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'আবেদন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-primary-900 to-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">ভর্তি আবেদন চূড়ান্তকরণ</h3>
                <p className="text-[11px] text-emerald-200 mt-0.5">{selectedApp.applicant_name_bn} ({selectedApp.application_number})</p>
              </div>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-emerald-200 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">আবেদনের স্ট্যাটাস নির্ধারণ</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="submitted">নতুন জমা (Submitted)</option>
                  <option value="interview_scheduled">সাক্ষাৎকার নির্ধারিত (Interview Scheduled)</option>
                  <option value="approved">ভর্তি অনুমোদন (Approved)</option>
                  <option value="rejected">আবেদন বাতিল (Rejected)</option>
                  <option value="enrolled">ভর্তি সম্পন্ন ও রোল প্রদান (Enrolled)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">মৌখিক / লিখিত সাক্ষাৎকার নম্বর (১০০-এর মধ্যে)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={interviewScore}
                  onChange={(e) => setInterviewScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">ভর্তি কমিটির সিদ্ধান্ত ও মন্তব্য</label>
                  <VoiceInputButton onTranscript={(txt) => setDecisionNotes((prev) => prev ? `${prev} ${txt}` : txt)} />
                </div>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="ভর্তি কমিটির মূল্যায়ন ও সুপারিশ..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সিদ্ধান্ত নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
