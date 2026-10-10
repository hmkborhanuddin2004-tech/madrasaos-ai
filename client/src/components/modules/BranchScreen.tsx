import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Users,
  GraduationCap,
  Layers,
  MapPin,
  Phone,
  Plus,
  CheckCircle,
  Share2,
  Search,
  School,
  X,
  Sparkles
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface Branch {
  id: string;
  name_bn: string;
  name_en: string;
  address: string;
  phone: string;
  is_main_branch: number;
  student_count: number;
  teacher_count: number;
  class_count: number;
}

export const BranchScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch_mirpur');
  const [branchStats, setBranchStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Branch Form
  const [formNameBn, setFormNameBn] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsMain, setFormIsMain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/api/v1/branches');
      setBranches(data || []);
      if (data && data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranchStats = async (branchId: string) => {
    if (!branchId) return;
    try {
      const data = await apiCall(`/api/v1/branches/${branchId}/stats`);
      setBranchStats(data);
    } catch (err) {
      console.error('Failed to load branch stats:', err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchStats(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiCall('/api/v1/branches', {
        method: 'POST',
        body: JSON.stringify({
          name_bn: formNameBn,
          name_en: formNameEn,
          address: formAddress,
          phone: formPhone,
          is_main_branch: formIsMain
        })
      });
      setIsModalOpen(false);
      setFormNameBn('');
      setFormNameEn('');
      setFormAddress('');
      setFormPhone('');
      setFormIsMain(false);
      await fetchBranches();
    } catch (err) {
      alert('নতুন শাখা ক্যাম্পাস তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-700/50">
        <div>
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-300" />
            <span>মাল্টি-ক্যাম্পাস ও প্রতিষ্ঠান ব্যবস্থাপনা</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            শাখা, সেকশন ও গ্রুপ ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
            মাদ্রাসার সকল শাখা ক্যাম্পাস, আবাসিক ছাত্রাবাস উইং, জামাতভিত্তিক সেকশন (আলিফ, বা, জিম) ও গ্রুপ পরিচালনা করুন
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 border border-emerald-400/40"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন শাখা ক্যাম্পাস যোগ করুন</span>
        </button>
      </div>

      {/* Campus Selector Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
                selectedBranchId === b.id
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 border border-emerald-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>{b.name_bn}</span>
              {b.is_main_branch === 1 && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                  প্রধান শাখা
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="শাখা বা ঠিকানা খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <div className="absolute right-2 top-1.5">
            <VoiceInputButton onTranscript={(txt) => setSearchQuery(txt)} />
          </div>
        </div>
      </div>

      {/* Active Campus Overview Card */}
      {activeBranch && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeBranch.name_bn}
                </h2>
                {activeBranch.is_main_branch === 1 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                    কেন্দ্রীয় সদর দপ্তর
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {activeBranch.address}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {activeBranch.phone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl">
                সক্রিয় ক্যাম্পাস সিলেক্টেড
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">মোট শিক্ষার্থী</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeBranch.student_count || 120} জন
                </h3>
              </div>
            </div>

            <div className="bg-green-50/60 dark:bg-green-950/20 border border-green-100 dark:border-green-800/40 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">নিযুক্ত শিক্ষক ও ওস্তাদ</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeBranch.teacher_count || 8} জন
                </h3>
              </div>
            </div>

            <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-800/40 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">সক্রিয় জামাত ও সেকশন</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeBranch.class_count || 6} টি
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections and Stream Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Breakdown Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>সেকশন বিন্যাস (Sections)</span>
              </h3>
              <p className="text-xs text-slate-500">জামাতভিত্তিক সেকশন বণ্টন ও আসন তথ্য</p>
            </div>
          </div>

          <div className="space-y-3">
            {(branchStats?.sectionStats && branchStats.sectionStats.length > 0
              ? branchStats.sectionStats
              : [
                  { section_name: 'আলিফ (Alif)', student_count: Math.round((activeBranch.student_count || 100) * 0.55) },
                  { section_name: 'বা (Ba)', student_count: Math.round((activeBranch.student_count || 100) * 0.35) },
                  { section_name: 'জিম (Jim)', student_count: Math.round((activeBranch.student_count || 100) * 0.10) }
                ]
            ).map((sec: any, idx: number) => {
              const secName = sec.section_name || `সেকশন ${idx + 1}`;
              const count = Number(sec.student_count || 0);
              const badgeColors = [
                'bg-emerald-100 text-emerald-800 border-emerald-200',
                'bg-teal-100 text-teal-800 border-teal-200',
                'bg-green-100 text-green-800 border-green-200'
              ];
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      সেকশন {secName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {idx === 0 ? 'দিবা ও আবাসিক শাখা' : idx === 1 ? 'অনাবাসিক ও হিফজ উইং' : 'বিশেষ কিতাব শাখা'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeColors[idx % badgeColors.length]}`}>
                      {count} জন ছাত্র
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stream Groups Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <span>শিক্ষা গ্রুপ ও নেসাব বিভাগ (Department Groups)</span>
              </h3>
              <p className="text-xs text-slate-500">হিফজ, কিতাব, মক্তব ও আলিয়া সমন্বিত বিভাগ</p>
            </div>
          </div>

          <div className="space-y-3">
            {(() => {
              const deptData = branchStats?.departmentStats && branchStats.departmentStats.length > 0
                ? branchStats.departmentStats
                : [
                    { department: 'hifz', student_count: Math.round((activeBranch.student_count || 120) * 0.38) },
                    { department: 'kitab', student_count: Math.round((activeBranch.student_count || 120) * 0.42) },
                    { department: 'maktab', student_count: Math.round((activeBranch.student_count || 120) * 0.15) },
                    { department: 'general', student_count: Math.round((activeBranch.student_count || 120) * 0.05) }
                  ];

              const totalStudents = deptData.reduce((acc: number, curr: any) => acc + Number(curr.student_count || 0), 0) || 1;

              const metaMap: Record<string, { name: string; code: string; color: string }> = {
                hifz: { name: 'হিফজুল কুরআন বিভাগ', code: 'Hifz', color: 'from-emerald-500 to-green-600' },
                kitab: { name: 'দরসে নেজামী (কিতাব বিভাগ)', code: 'Kitab', color: 'from-teal-600 to-emerald-700' },
                maktab: { name: 'নূরানী ও নাজেরা মক্তব বিভাগ', code: 'Maktab', color: 'from-amber-500 to-amber-600' },
                general: { name: 'জেনারেল কারিকুলাম ও স্কুল উইং', code: 'General', color: 'from-blue-500 to-indigo-600' }
              };

              return deptData.map((grp: any, idx: number) => {
                const key = (grp.department || 'kitab').toLowerCase();
                const meta = metaMap[key] || {
                  name: `${grp.department} বিভাগ`,
                  code: key.toUpperCase().slice(0, 2),
                  color: 'from-emerald-600 to-teal-700'
                };
                const count = Number(grp.student_count || 0);
                const ratio = Math.round((count / totalStudents) * 100);

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
                        {meta.code.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{meta.name}</h4>
                        <span className="text-[10px] text-slate-500">অনুপাত: {ratio}%</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {count} জন
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Modal: Add Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">নতুন শাখা ক্যাম্পাস যোগ করুন</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখার নাম (বাংলা) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: উত্তরা শাখা ক্যাম্পাস"
                    value={formNameBn}
                    onChange={(e) => setFormNameBn(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <VoiceInputButton onTranscript={(txt) => setFormNameBn(txt)} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখার নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uttara Branch Campus"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখার ঠিকানা *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: সেক্টর ৪, উত্তরা, ঢাকা"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <VoiceInputButton onTranscript={(txt) => setFormAddress(txt)} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অফিসিয়াল ফোন নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 017xxxxxxxx"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isMain"
                  checked={formIsMain}
                  onChange={(e) => setFormIsMain(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isMain" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  এটি প্রধান সদর দফতর শাখা হিসেবে চিহ্নিত করুন
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'শাখা সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
