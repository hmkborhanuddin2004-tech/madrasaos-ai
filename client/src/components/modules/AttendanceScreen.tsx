import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck2, CheckCircle2, XCircle, Clock, AlertTriangle, Save, Check } from 'lucide-react';

export const AttendanceScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('cls_nahbemir');
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState('2026-09-20');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'repeated'>('register');
  const [repeatedAbsences, setRepeatedAbsences] = useState<any[]>([]);

  const fetchClasses = async () => {
    try {
      const cls = await apiCall('/api/v1/kitab/classes');
      setClasses(cls || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegister = async () => {
    setIsLoading(true);
    setIsSaved(false);
    try {
      const data = await apiCall(`/api/v1/attendance/register?classId=${selectedClassId}&date=${date}`);
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepeated = async () => {
    try {
      const rep = await apiCall('/api/v1/attendance/repeated-absences?days=7&minAbsences=2');
      setRepeatedAbsences(rep || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchRepeated();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRegister();
    }
  }, [selectedClassId, date]);

  // Fast "Mark All Present" Action
  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'present'
      }))
    );
  };

  // Toggle status for individual student
  const setStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleSave = async () => {
    try {
      await apiCall('/api/v1/attendance/register', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          date,
          records: students.map((s) => ({
            studentId: s.studentId,
            status: s.status,
            remarks: s.remarks
          }))
        })
      });
      setIsSaved(true);
      fetchRepeated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'register'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            দৈনিক ক্লাসের হাজিরা
          </button>
          <button
            onClick={() => setActiveTab('repeated')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'repeated'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>টানা অনুপস্থিতি ({repeatedAbsences.length} জন)</span>
          </button>
        </div>

        {activeTab === 'register' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none font-semibold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_bn}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
            />

            <button
              onClick={markAllPresent}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              ✓ সকলকে উপস্থিত করুন
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'সংরক্ষিত হয়েছে!' : 'হাজিরা সেভ করুন'}</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'register' ? (
        <>
          {/* Quick Counter Summary */}
          <div className="flex items-center gap-4 bg-emerald-50/70 border border-emerald-200/80 px-4 py-2.5 rounded-xl text-xs">
            <span className="font-bold text-slate-700">মোট ছাত্র: {students.length} জন</span>
            <span className="text-emerald-700 font-bold">উপস্থিত: {presentCount}</span>
            <span className="text-red-600 font-bold">অনুপস্থিত: {absentCount}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">টিপস: যারা অনুপস্থিত শুধু তাদের উপর ট্যাপ করে লাল করুন।</span>
          </div>

          {/* Student Roster Cards for Attendance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {students.map((s) => (
              <div
                key={s.studentId}
                className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
                  s.status === 'absent'
                    ? 'border-red-300 bg-red-50/70'
                    : s.status === 'late'
                    ? 'border-amber-300 bg-amber-50/70'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">রোল: {s.rollNumber}</div>
                    <div className="font-bold text-sm text-slate-900">{s.fullNameBn}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.guardianPhone}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      s.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.status === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.status === 'present' ? 'উপস্থিত' : s.status === 'absent' ? 'অনুপস্থিত' : 'বিলম্বে'}
                  </span>
                </div>

                {/* Fast Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setStatus(s.studentId, 'present')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                      s.status === 'present' ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    উপস্থিত
                  </button>
                  <button
                    onClick={() => setStatus(s.studentId, 'absent')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                      s.status === 'absent' ? 'bg-red-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    অনুপস্থিত
                  </button>
                  <button
                    onClick={() => setStatus(s.studentId, 'late')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                      s.status === 'late' ? 'bg-amber-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    বিলম্ব
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Repeated Absences Intervention List */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>টানা বা বারবার অনুপস্থিত শিক্ষার্থীদের তালিকা (গত ৭ দিন)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                এ সকল শিক্ষার্থীদের অভিভাবকদের সাথে যোগাযোগ করা অথবা সতর্কতা নোটিশ পাঠানো আবশ্যক।
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {repeatedAbsences.map((ra: any) => (
              <div key={ra.student_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">{ra.full_name_bn}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    শ্রেণি: {ra.class_name_bn} (রোল: {ra.roll_number}) • অভিভাবক: {ra.guardian_name_bn} ({ra.guardian_phone})
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full text-xs">
                    {ra.absent_count} দিন অনুপস্থিত
                  </span>
                  <button
                    onClick={() => alert(`${ra.guardian_phone} নম্বরে অভিভাবক সতর্কবার্তা পাঠানো ড্রাফট হয়েছে।`)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                  >
                    মেসেজ ড্রাফট
                  </button>
                </div>
              </div>
            ))}
            {repeatedAbsences.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                আলহামদুলিল্লাহ, কোনো শিক্ষার্থীর মাত্রাতিরিক্ত অনুপস্থিতি পরিলক্ষিত হয়নি।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
