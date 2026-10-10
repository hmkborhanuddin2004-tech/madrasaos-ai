import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, UserPlus, Eye, BookOpen, Bed, ChevronLeft, ChevronRight, X, CreditCard, Plus, Check, Camera, RefreshCw, Printer } from 'lucide-react';
import { StudentProfileModal } from './StudentProfileModal';
import { ExportButton } from '../common/ExportButton';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { StudentIdCard } from '../common/StudentIdCard';
import { StudentIdCardModal } from '../common/StudentIdCardModal';
import { StudentPhotoModal } from '../common/StudentPhotoModal';
import { useSettings } from '../../context/SettingsContext';

export const StudentList: React.FC = () => {
  const { apiCall, user } = useAuth();
  const { settings } = useSettings();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState<'all' | 'qawmi' | 'alia'>('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [hifzFilter, setHifzFilter] = useState<boolean | undefined>(undefined);
  const [resFilter, setResFilter] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const [allStudentsForPrint, setAllStudentsForPrint] = useState<any[]>([]);
  const [isFetchingAllForPrint, setIsFetchingAllForPrint] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState<string | null>(null); // holds studentId
  const [idCardData, setIdCardData] = useState<any>(null);
  const [photoStudent, setPhotoStudent] = useState<any | null>(null);


  // Add Custom Class Modal State
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassNameBn, setNewClassNameBn] = useState('');
  const [newClassNameEn, setNewClassNameEn] = useState('');
  const [newClassType, setNewClassType] = useState<'qawmi' | 'alia' | 'general'>('qawmi');
  const [isSavingClass, setIsSavingClass] = useState(false);

  // Form State for Add Student
  const [newFullNameBn, setNewFullNameBn] = useState('');
  const [newFullNameEn, setNewFullNameEn] = useState('');
  const [newClassId, setNewClassId] = useState('cls_nahbemir');
  const [newRoll, setNewRoll] = useState('1');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newIsHifz, setNewIsHifz] = useState(false);
  const [newIsRes, setNewIsRes] = useState(false);
  const [newFee, setNewFee] = useState(2000);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let url = `/api/v1/students?page=${page}&limit=12`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedClass) url += `&classId=${selectedClass}`;
      if (hifzFilter !== undefined) url += `&isHifz=${hifzFilter}`;
      if (resFilter !== undefined) url += `&isResidential=${resFilter}`;

      const res = await apiCall(url);
      setStudents(res.students || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const cls = await apiCall('/api/v1/kitab/classes');
      setClasses(cls || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, search, selectedClass, hifzFilter, resFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullNameBn || !newGuardianPhone) return;

    try {
      await apiCall('/api/v1/students', {
        method: 'POST',
        body: JSON.stringify({
          fullNameBn: newFullNameBn,
          fullNameEn: newFullNameEn,
          classId: newClassId,
          rollNumber: newRoll,
          guardianNameBn: newGuardianName,
          guardianPhone: newGuardianPhone,
          isHifzStudent: newIsHifz,
          isResidential: newIsRes,
          monthlyFee: newFee
        })
      });
      setShowAddModal(false);
      fetchStudents();
      // Reset form
      setNewFullNameBn('');
      setNewFullNameEn('');
      setNewGuardianName('');
      setNewGuardianPhone('');
    } catch (err) {
      alert('শিক্ষার্থী যোগ করতে সমস্যা হয়েছে।');
    }
  };

  const handleShowIdCard = async (studentId: string) => {
    try {
      const res = await apiCall(`/api/v1/students/${studentId}/id-card`);
      const cardData = res?.data || res;
      if (cardData && cardData.student) {
        setIdCardData(cardData);
      }
      setShowIdCardModal(studentId);
    } catch (err) {
      setShowIdCardModal(studentId);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassNameBn.trim()) return;
    setIsSavingClass(true);
    try {
      const res = await apiCall('/api/v1/settings/classes', {
        method: 'POST',
        body: JSON.stringify({
          name_bn: newClassNameBn.trim(),
          name_en: newClassNameEn.trim() || newClassNameBn.trim(),
          department: newClassType === 'alia' ? 'আলিয়া বিভাগ' : 'কওমী বিভাগ',
          madrasa_type: newClassType
        })
      });
      setShowAddClassModal(false);
      setNewClassNameBn('');
      setNewClassNameEn('');
      await fetchClasses();
      if (res?.id) {
        setSelectedClass(res.id);
      }
    } catch (err: any) {
      alert(err.message || 'শ্রেণি যুক্ত করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleBatchPrint = async () => {
    setIsFetchingAllForPrint(true);
    try {
      const res = await apiCall('/api/v1/students?page=1&limit=500');
      const allSts = res?.students || (Array.isArray(res) ? res : students);
      setAllStudentsForPrint(allSts);
      setShowBatchPrint(true);
      setTimeout(() => { window.print(); }, 1000);
    } catch {
      setAllStudentsForPrint(students);
      setShowBatchPrint(true);
      setTimeout(() => { window.print(); }, 800);
    } finally {
      setIsFetchingAllForPrint(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="শিক্ষার্থীর নাম, আইডি বা অভিভাবকের ফোন..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <VoiceInputButton onTranscript={(txt) => { setSearch(txt); setPage(1); }} />
          </div>

          {/* Stream Selector Chips (Qawmi vs Alia) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => { setStreamFilter('all'); setSelectedClass(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                streamFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              সকল ধারা
            </button>
            <button
              type="button"
              onClick={() => { setStreamFilter('qawmi'); setSelectedClass(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                streamFilter === 'qawmi'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              কওমি নেসাব
            </button>
            <button
              type="button"
              onClick={() => { setStreamFilter('alia'); setSelectedClass(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                streamFilter === 'alia'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              আলিয়া নেসাব
            </button>
          </div>

          {/* Class Filter Dropdown (Left) & Plus Button (Right) */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
              className="text-xs border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="">
                {streamFilter === 'qawmi' ? 'সকল কওমি জামাত' : streamFilter === 'alia' ? 'সকল আলিয়া শ্রেণি' : 'সকল শ্রেণি (জামাত)'}
              </option>
              
              {/* Qawmi Classes */}
              {(streamFilter === 'all' || streamFilter === 'qawmi') && classes.filter(c => !c.madrasa_type || c.madrasa_type === 'qawmi').length > 0 && (
                <optgroup label="─── কওমি মাদ্রাসা জামাতসমূহ ───" className="font-bold text-emerald-800 dark:text-emerald-400">
                  {classes
                    .filter(c => !c.madrasa_type || c.madrasa_type === 'qawmi')
                    .map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-800 dark:text-slate-200 font-normal">
                        {c.name_bn}
                      </option>
                    ))}
                </optgroup>
              )}

              {/* Alia Classes */}
              {(streamFilter === 'all' || streamFilter === 'alia') && classes.filter(c => c.madrasa_type === 'alia').length > 0 && (
                <optgroup label="─── আলিয়া মাদ্রাসা নেসাব (১ম - কামিল) ───" className="font-bold text-blue-800 dark:text-blue-400">
                  {classes
                    .filter(c => c.madrasa_type === 'alia')
                    .map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-800 dark:text-slate-200 font-normal">
                        {c.name_bn}
                      </option>
                    ))}
                </optgroup>
              )}

              {/* Custom Classes */}
              {streamFilter === 'all' && classes.filter(c => c.madrasa_type && c.madrasa_type !== 'qawmi' && c.madrasa_type !== 'alia').length > 0 && (
                <optgroup label="─── নিজস্ব যুক্তকৃত জামাত ───" className="font-bold text-amber-800 dark:text-amber-400">
                  {classes
                    .filter(c => c.madrasa_type && c.madrasa_type !== 'qawmi' && c.madrasa_type !== 'alia')
                    .map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-800 dark:text-slate-200 font-normal">
                        {c.name_bn}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>

            <button
              type="button"
              onClick={() => setShowAddClassModal(true)}
              className="p-2 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-slate-600 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
              title="নতুন শ্রেণি/জামাত যুক্ত করুন (+)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Hifz Quick Toggle */}
          <button
            onClick={() => { setHifzFilter(hifzFilter === true ? undefined : true); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              hifzFilter === true
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>হিফজ শিক্ষার্থী</span>
          </button>

          {/* Residential Quick Toggle */}
          <button
            onClick={() => { setResFilter(resFilter === true ? undefined : true); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              resFilter === true
                ? 'bg-teal-700 text-white border-teal-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>আবাসিক</span>
          </button>
        </div>

        {/* Add Student Button */}
        <div className="flex items-center gap-2">
          <ExportButton type="csv" url="/api/v1/export/students.csv" />
          <ExportButton type="xlsx" url="/api/v1/export/students.xlsx" />
          
          {['super_admin', 'madrasa_admin', 'principal'].includes(user.role) && (
            <>
              <button
                onClick={handleBatchPrint}
                disabled={isFetchingAllForPrint}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm border border-slate-300"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isFetchingAllForPrint ? 'লোড হচ্ছে...' : 'সকলের আইডি কার্ড প্রিন্ট'}
                </span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>নতুন শিক্ষার্থী ভর্তি</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Student Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">রোল ও আইডি</th>
                <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                <th className="py-3 px-4">শ্রেণি (জামাত)</th>
                <th className="py-3 px-4">বিভাগ</th>
                <th className="py-3 px-4">অভিভাবকের তথ্য</th>
                <th className="py-3 px-4 text-right">মাসিক ফি</th>
                <th className="py-3 px-4 text-center">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-emerald-50/50 dark:hover:bg-slate-700/40 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 dark:text-slate-100">রোল: {st.roll_number}</span>
                    <div className="text-[10px] text-slate-400 font-mono">{st.student_id_number}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{st.full_name_bn}</div>
                    <div className="text-[10px] text-slate-400">{st.full_name_en}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{st.class_name_bn || 'কওমী'}</span>
                  </td>
                  <td className="py-3 px-4 space-x-1">
                    {st.is_hifz_student ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        হিফজ
                      </span>
                    ) : null}
                    {st.is_residential ? (
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        আবাসিক
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 dark:text-slate-200">{st.guardian_name_bn}</div>
                    <div className="text-[10px] text-emerald-600 font-mono">{st.guardian_phone}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-100">
                    ৳{st.monthly_fee?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedStudentId(st.id)}
                        className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg transition text-[11px]"
                        title="সম্পূর্ণ প্রোফাইল দেখুন"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>প্রোফাইল</span>
                      </button>
                      <button
                        onClick={() => handleShowIdCard(st.id)}
                        className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold px-2.5 py-1 rounded-lg transition text-[11px]"
                        title="ডিজিটাল আইডি কার্ড"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>আইডি কার্ড</span>
                      </button>
                      <button
                        onClick={() => setPhotoStudent(st)}
                        className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-1 rounded-lg transition text-[11px]"
                        title="ছবি আপলোড, মোবাইল আপলোড বা ক্যামেরা স্ক্যান"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>মোট শিক্ষার্থী: {total} জন</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 rounded border disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>পৃষ্ঠা {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={students.length < 12}
              className="p-1 rounded border disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student 360 Profile Modal */}
      {selectedStudentId && (
        <StudentProfileModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Add Student Modal - Redesigned Modern Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-900 via-primary-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600/80 border border-emerald-400/40 flex items-center justify-center text-white shadow-inner">
                  <UserPlus className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    নতুন শিক্ষার্থী ভর্তি ফরম
                  </h3>
                  <div className="text-[11px] text-emerald-200/90">
                    প্রাতিষ্ঠানিক ডাটাবেজে সঠিক তথ্য সংরক্ষণ করুন
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-emerald-300 hover:text-white p-1.5 rounded-xl hover:bg-emerald-800/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              {/* Section 1: Academic & Personal Info */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>শিক্ষার্থীর তথ্য ও জামাত</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      নাম (বাংলায়) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মুহাম্মদ তাওহীদ হাসান"
                      value={newFullNameBn}
                      onChange={(e) => setNewFullNameBn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      নাম (ইংরেজিতে)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Tawhid Hasan"
                      value={newFullNameEn}
                      onChange={(e) => setNewFullNameEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      ভর্তি শ্রেণি (জামাত) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newClassId}
                      onChange={(e) => setNewClassId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_bn} {c.department ? `(${c.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      রোল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ০১ বা ১২"
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Guardian & Contact Info */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>অভিভাবক ও জরুরি যোগাযোগ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      অভিভাবকের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="পিতা / মাতার নাম"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      অভিভাবকের মোবাইল নং <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="০১৭১২-৩৪৫৬৭৮"
                      value={newGuardianPhone}
                      onChange={(e) => setNewGuardianPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Department & Tuition Fee */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>বিভাগ ও মাসিক ফি কাঠামো</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    newIsHifz
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newIsHifz}
                      onChange={(e) => setNewIsHifz(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>হিফজুল কুরআন বিভাগ</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    newIsRes
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-900 dark:text-teal-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newIsRes}
                      onChange={(e) => setNewIsRes(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>আবাসিক ছাত্রাবাস শিক্ষার্থী</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    নির্ধারিত মাসিক বেতন (টাকা)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">৳</span>
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-500">দ্রুত নির্বাচন:</span>
                    {[1500, 2000, 2500, 3000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewFee(amt)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          newFee === amt
                            ? 'bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-primary-700 hover:from-emerald-600 hover:to-primary-600 text-white font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>শিক্ষার্থীর তথ্য সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Class / Jamaat Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>নতুন শ্রেণি / জামাত তৈরি করুন</span>
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  জামাত / শ্রেণির নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: শরহে বেকায়া / মেসকাত / ৫ম শ্রেণি"
                  value={newClassNameBn}
                  onChange={(e) => setNewClassNameBn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  শ্রেণির নাম (ইংরেজিতে - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharhe Bekaya / Class 5"
                  value={newClassNameEn}
                  onChange={(e) => setNewClassNameEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  মাদ্রাসার নেসাব / ধরন
                </label>
                <select
                  value={newClassType}
                  onChange={(e: any) => setNewClassType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="qawmi">কওমি মাদ্রাসা সিলেবাস (দরসিয়াত)</option>
                  <option value="alia">আলিয়া মাদ্রাসা সিলেবাস (মাদ্রাসা শিক্ষা বোর্ড)</option>
                  <option value="general">জেনারেল / নিজস্ব বিশেষ জামাত</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingClass || !newClassNameBn.trim()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
                >
                  {isSavingClass ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student ID Card Modal */}
      {showIdCardModal && (
        <StudentIdCardModal
          studentId={showIdCardModal}
          onClose={() => setShowIdCardModal(null)}
          onOpenPhotoModal={() => {
            const found = students.find((s) => s.id === showIdCardModal);
            setShowIdCardModal(null);
            if (found) setPhotoStudent(found);
          }}
        />
      )}

      {/* Student Photo Modal */}
      {photoStudent && (
        <StudentPhotoModal
          isOpen={!!photoStudent}
          onClose={() => setPhotoStudent(null)}
          studentId={photoStudent.id}
          studentName={photoStudent.full_name_bn}
          currentPhotoUrl={photoStudent.avatar_url || photoStudent.photo_url}
          onPhotoUpdated={(newUrl) => {
            setPhotoStudent(null);
            fetchStudents();
          }}
        />
      )}

      {/* Batch Print Hidden Area — Only visible during window.print() */}
      {showBatchPrint && (
        <>
          <style>{`
            @media print {
              body > * { display: none !important; }
              #batch-print-area { display: block !important; }
              .print-id-card-page { page-break-after: always; }
              .print-id-card-page:last-child { page-break-after: avoid; }
            }
          `}</style>
          <div id="batch-print-area" style={{ display: 'none' }}>
            {allStudentsForPrint.map((st, idx) => (
              <div key={st.id || idx} className="print-id-card-page" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px', fontSize: '11px', color: '#555' }}>
                  {settings.nameBn || 'মাদরাসা'} — শিক্ষার্থী আইডি কার্ড
                </div>
                <div style={{
                  display: 'inline-block',
                  width: '308px',
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '12px',
                  fontFamily: 'serif',
                  fontSize: '13px',
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '6px' }}>
                    {st.full_name_bn}
                  </div>
                  <div>রোল: {st.roll_number}</div>
                  <div>আইডি: {st.student_id_number}</div>
                  <div>জামাত: {st.class_name_bn || '—'}</div>
                  <div>অভিভাবক: {st.guardian_name_bn || '—'}</div>
                  <div>মোবাইল: {st.guardian_phone || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
