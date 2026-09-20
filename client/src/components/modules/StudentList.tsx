import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, UserPlus, Eye, BookOpen, Bed, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { StudentProfileModal } from './StudentProfileModal';

export const StudentList: React.FC = () => {
  const { apiCall, user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [hifzFilter, setHifzFilter] = useState<boolean | undefined>(undefined);
  const [resFilter, setResFilter] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, আইডি বা অভিভাবকের ফোন..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">সকল শ্রেণি (জামাত)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name_bn}</option>
            ))}
          </select>

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
        {['super_admin', 'madrasa_admin', 'principal'].includes(user.role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন শিক্ষার্থী ভর্তি</span>
          </button>
        )}
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
                    <button
                      onClick={() => setSelectedStudentId(st.id)}
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg transition text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>প্রোফাইল</span>
                    </button>
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>নতুন শিক্ষার্থী ভর্তি ও তথ্য সংরক্ষণ</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আব্দুল্লাহ আল-মামুন"
                    value={newFullNameBn}
                    onChange={(e) => setNewFullNameBn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">নাম (ইংরেজিতে)</label>
                  <input
                    type="text"
                    placeholder="e.g. Abdullah Al-Mamun"
                    value={newFullNameEn}
                    onChange={(e) => setNewFullNameEn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">শ্রেণি (জামাত)</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_bn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">রোল নম্বর</label>
                  <input
                    type="text"
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">অভিভাবকের নাম</label>
                  <input
                    type="text"
                    placeholder="পিতা / অভিভাবক"
                    value={newGuardianName}
                    onChange={(e) => setNewGuardianName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">অভিভাবকের মোবাইল নং *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={newGuardianPhone}
                    onChange={(e) => setNewGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={newIsHifz}
                    onChange={(e) => setNewIsHifz(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>হিফজুল কুরআন বিভাগ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={newIsRes}
                    onChange={(e) => setNewIsRes(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>আবাসিক ছাত্রাবাস</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-slate-600 font-semibold mb-1">নির্ধারিত মাসিক বেতন (টাকা)</label>
                <input
                  type="number"
                  value={newFee}
                  onChange={(e) => setNewFee(parseInt(e.target.value) || 2000)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
