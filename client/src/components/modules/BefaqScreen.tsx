import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  UserPlus,
  FileCheck2,
  Printer,
  ShieldCheck,
  CheckCircle,
  X,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const BefaqScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarhalah, setSelectedMarhalah] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [activeAdmitData, setActiveAdmitData] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formMarhalah, setFormMarhalah] = useState('takmil');
  const [examCenter, setExamCenter] = useState('জামিয়া রাহমানিয়া আরাবিয়া, ঢাকা');
  const [resultMarks, setResultMarks] = useState<number>(550);

  const marhalahOptions = [
    { id: 'takmil', name: 'তাকমীল (দাওরায়ে হাদীস)' },
    { id: 'fazilat', name: 'ফযীলত (মেশকাত)' },
    { id: 'sanabia_ulya', name: 'সানাবিয়া উলইয়া (শরহে বেকায়া)' },
    { id: 'mutawassita', name: 'মুতাওয়াসসিতাহ (কাফিয়া)' },
    { id: 'ibtidaiyah', name: 'ইবতিদাইয়্যাহ (মিযান)' },
    { id: 'hifzul_quran', name: 'হিফজুল কুরআন' },
    { id: 'qiraat', name: 'ইলমুত তাজবীদ ও ক্বিরাআত' }
  ];

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMarhalah !== 'all') params.set('marhalah', selectedMarhalah);
      if (searchQuery) params.set('search', searchQuery);

      const data = await apiCall(`/api/v1/befaq/registrations?${params.toString()}`);
      setRegistrations(data || []);
    } catch (err) {
      console.error('Failed to fetch Befaq candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await apiCall('/api/v1/students?limit=100');
      const list = Array.isArray(data) ? data : (data?.students || []);
      setStudents(list);
    } catch (err) {
      console.error('Failed to load students for Befaq:', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [selectedMarhalah, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('অনুগ্রহ করে শিক্ষার্থী নির্বাচন করুন');
      return;
    }

    try {
      await apiCall('/api/v1/befaq/registrations', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedStudentId,
          marhalah: formMarhalah,
          exam_center: examCenter,
          session_year: 2026
        })
      });
      alert('বেফাক কেন্দ্রীয় পরীক্ষায় শিক্ষার্থী সফলভাবে নিবন্ধিত হয়েছে!');
      setIsRegisterModalOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || 'নিবন্ধন ব্যর্থ হয়েছে');
    }
  };

  const handleViewAdmit = async (candidateId: string) => {
    try {
      const data = await apiCall(`/api/v1/befaq/admit-card/${candidateId}`);
      setActiveAdmitData(data);
      setIsAdmitModalOpen(true);
    } catch (err: any) {
      alert('প্রবেশপত্র লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const handleUpdateResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      await apiCall(`/api/v1/befaq/registrations/${selectedCandidate.id}/result`, {
        method: 'PUT',
        body: JSON.stringify({
          total_marks: resultMarks
        })
      });
      alert('ফলাফল ও সনদ সফলভাবে আপডেট হয়েছে!');
      setIsResultModalOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || 'ফলাফল আপডেট ব্যর্থ হয়েছে');
    }
  };

  const getDivisionBadge = (division?: string) => {
    switch (division) {
      case 'mumtaz':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">মুমতাজ (১ম স্থান) 🌟</span>;
      case 'jayyid_jiddan':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">জায়্যিদ জিদ্দান (১ম বিভাগ)</span>;
      case 'jayyid':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">জায়্যিদ (২য় বিভাগ)</span>;
      case 'maqbool':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">মাকবুল (উত্তীর্ণ)</span>;
      case 'rasib':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">রাসিব (অনুত্তীর্ণ)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">অপেক্ষমাণ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <Award className="w-4 h-4" />
            <span>বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (Wafaqul Madaris)</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">বেফাক বোর্ড পরীক্ষা ও ফলাফল ব্যবস্থাপনা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            কেন্দ্রীয় পরীক্ষার নিবন্ধন, প্রবেশপত্র প্রস্তুতকরণ, মার্কশিট এন্ট্রি এবং সনদ ভেরিফিকেশন।
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন পরীক্ষার্থী নিবন্ধন</span>
        </button>
      </div>

      {/* Marhalah filter tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedMarhalah('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedMarhalah === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            সকল মারহালাহ
          </button>
          {marhalahOptions.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMarhalah(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedMarhalah === m.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Search input with Voice button */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="রোল, রেজিস্ট্রেশন বা নাম..."
            className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-hidden"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <VoiceInputButton
              onTranscript={(text) => setSearchQuery(text)}
              size="sm"
              title="মুখে বলুন..."
            />
          </div>
        </div>
      </div>

      {/* Candidate List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3.5">পরীক্ষার্থী</th>
                <th className="px-5 py-3.5">মারহালাহ</th>
                <th className="px-5 py-3.5">রোল ও রেজিস্ট্রেশন</th>
                <th className="px-5 py-3.5">পরীক্ষা কেন্দ্র</th>
                <th className="px-5 py-3.5">ফলাফল ও সনদ</th>
                <th className="px-5 py-3.5 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    কোনো পরীক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                registrations.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{cand.student_name_bn}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cand.student_id_number}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {cand.marhalah}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      <div className="font-bold text-slate-700">রোল: {cand.roll_number}</div>
                      <div className="text-slate-400">রেজি: {cand.registration_number}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate">
                      {cand.exam_center}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        {getDivisionBadge(cand.division)}
                        {cand.sanad_number && (
                          <span className="text-[10px] font-mono text-slate-500">
                            সনদ: {cand.sanad_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewAdmit(cand.id)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
                          title="প্রবেশপত্র দেখুন"
                        >
                          <Printer className="w-3 h-3 text-emerald-600" />
                          <span>প্রবেশপত্র</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setResultMarks(cand.total_marks || 550);
                            setIsResultModalOpen(true);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-emerald-200 transition cursor-pointer"
                        >
                          নম্বর/সনদ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">নতুন বেফাক পরীক্ষার্থী নিবন্ধন</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden bg-slate-50"
                  required
                >
                  <option value="">-- শিক্ষার্থী বাছাই করুন --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name_bn} ({s.roll_number} - {s.class_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মারহালাহ (পরীক্ষার স্তর) *</label>
                <select
                  value={formMarhalah}
                  onChange={(e) => setFormMarhalah(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden bg-slate-50"
                >
                  {marhalahOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">পরীক্ষা কেন্দ্র *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={examCenter}
                    onChange={(e) => setExamCenter(e.target.value)}
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden bg-slate-50"
                    placeholder="কেন্দ্রের নাম ও ঠিকানা"
                  />
                  <VoiceInputButton onTranscript={(txt) => setExamCenter(txt)} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  নিবন্ধন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Card Modal */}
      {isAdmitModalOpen && activeAdmitData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-300 relative my-8">
            <button
              onClick={() => setIsAdmitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Admit Card Layout */}
            <div className="border-4 border-double border-emerald-800 p-6 rounded-2xl bg-emerald-50/20 text-center space-y-4">
              <div>
                <div className="text-xs font-bold text-emerald-800 tracking-wider">
                  {activeAdmitData.boardNameBn}
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {activeAdmitData.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  শিক্ষাবর্ষ: ২০২৬ ঈসাব্দ / ১৪৪৭ হিজরি
                </div>
              </div>

              {/* Student info box */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 text-xs text-left grid grid-cols-2 gap-3 shadow-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">পরীক্ষার্থীর নাম:</span>
                  <span className="font-bold text-slate-900">{activeAdmitData.registration?.student_name_bn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">মারহালাহ:</span>
                  <span className="font-bold text-emerald-800 uppercase">{activeAdmitData.registration?.marhalah}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">রোল নম্বর:</span>
                  <span className="font-bold text-slate-900 font-mono">{activeAdmitData.registration?.roll_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">রেজিস্ট্রেশন নম্বর:</span>
                  <span className="font-bold text-slate-900 font-mono">{activeAdmitData.registration?.registration_number}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">পরীক্ষা কেন্দ্র:</span>
                  <span className="font-semibold text-slate-800">{activeAdmitData.registration?.exam_center}</span>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="text-left">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5">পরীক্ষার সময়সূচি:</div>
                <table className="w-full text-[11px] border border-slate-200">
                  <thead className="bg-emerald-100 text-emerald-900 font-bold">
                    <tr>
                      <th className="p-1.5 border">তারিখ ও বার</th>
                      <th className="p-1.5 border">বিষয়</th>
                      <th className="p-1.5 border">সময়</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAdmitData.examSchedule?.map((sch: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-1.5 border">{sch.date} ({sch.day})</td>
                        <td className="p-1.5 border font-semibold">{sch.subject}</td>
                        <td className="p-1.5 border">{sch.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex items-center justify-between text-[11px] text-slate-600">
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1" />
                  <span>মুহতামিমের স্বাক্ষর</span>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1" />
                  <span>পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট / ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result & Grade Update Modal */}
      {isResultModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">পরীক্ষার নম্বর ও সনদ এন্ট্রি</h3>
              <button onClick={() => setIsResultModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateResultSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{selectedCandidate.student_name_bn}</div>
                <div className="text-slate-500 font-mono text-[11px]">রোল: {selectedCandidate.roll_number}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মোট প্রাপ্ত নম্বর (৬০০ এর মধ্যে) *</label>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={resultMarks}
                  onChange={(e) => setResultMarks(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden bg-slate-50 font-bold text-slate-800"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ৫৪০০+ মুমতাজ (Star), ৪৫০+ জায়্যিদ জিদ্দান (১ম), ৩৬০+ জায়্যিদ (২য়), ২৭০+ মাকবুল (পাস)।
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  ফলাফল ও সনদ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
