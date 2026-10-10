import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookMarked,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Layers,
  ChevronRight,
  Sparkles,
  X,
  Clock,
  Copy,
  Trash2,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';

const DAYS_BN: Record<string, string> = {
  Saturday: 'শনিবার',
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার'
};

const DAYS_LIST = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export const AcademicsScreen: React.FC = () => {
  const { apiCall, user } = useAuth();
  const [academicTab, setAcademicTab] = useState<'progress' | 'routine'>('progress');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [progressList, setProgressList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Kitab Progress Form State
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formKitabName, setFormKitabName] = useState('');
  const [formTeacherName, setFormTeacherName] = useState(user.fullNameBn || '');
  const [formBabChapter, setFormBabChapter] = useState('');
  const [formLessonTitle, setFormLessonTitle] = useState('');
  const [formPagesCompleted, setFormPagesCompleted] = useState(10);
  const [formTotalPages, setFormTotalPages] = useState(150);
  const [formRemarks, setFormRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Routine State
  const [selectedDay, setSelectedDay] = useState<string>('Saturday');
  const [routines, setRoutines] = useState<any[]>([]);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<string>('Saturday');
  const [copyTargetDay, setCopyTargetDay] = useState<string>('Sunday');

  // Routine Form State
  const [routinePeriod, setRoutinePeriod] = useState<number>(1);
  const [routineStartTime, setRoutineStartTime] = useState('০৮:০০ AM');
  const [routineEndTime, setRoutineEndTime] = useState('০৮:৪৫ AM');
  const [routineSubject, setRoutineSubject] = useState('');
  const [routineTeacher, setRoutineTeacher] = useState(user.fullNameBn || '');
  const [routineRoom, setRoutineRoom] = useState('১০১');
  const [isRoutineSubmitting, setIsRoutineSubmitting] = useState(false);

  const fetchClasses = async () => {
    try {
      const data = await apiCall('/api/v1/kitab/classes');
      setClasses(data || []);
      if (data && data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
        setFormClassId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchProgress = async (classId?: string) => {
    setIsLoading(true);
    try {
      const endpoint = classId ? `/api/v1/kitab/progress?classId=${classId}` : '/api/v1/kitab/progress';
      const data = await apiCall(endpoint);
      setProgressList(data || []);
    } catch (err) {
      console.error('Failed to load kitab progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoutines = async (classId?: string, day?: string) => {
    setIsLoading(true);
    try {
      const cId = classId || selectedClassId || 'cls_kafiya';
      const d = day || selectedDay;
      const data = await apiCall(`/api/v1/routines?classId=${cId}&dayOfWeek=${d}`);
      setRoutines(data || []);
    } catch (err) {
      console.error('Failed to load routines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (academicTab === 'progress') {
      fetchProgress(selectedClassId);
    } else {
      fetchRoutines(selectedClassId, selectedDay);
    }
  }, [academicTab, selectedClassId, selectedDay]);

  const handleCreateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiCall('/api/v1/kitab/progress', {
        method: 'POST',
        body: JSON.stringify({
          classId: formClassId || selectedClassId,
          subjectNameBn: formSubjectName,
          kitabName: formKitabName,
          teacherNameBn: formTeacherName,
          babOrChapter: formBabChapter,
          lessonTitle: formLessonTitle,
          pagesCompleted: Number(formPagesCompleted),
          totalKitabPages: Number(formTotalPages),
          remarks: formRemarks
        })
      });

      setIsModalOpen(false);
      setFormLessonTitle('');
      setFormBabChapter('');
      setFormRemarks('');
      await fetchProgress(selectedClassId);
    } catch (err) {
      console.error('Failed to save kitab progress:', err);
      alert('পাঠ সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRoutineSubmitting(true);
    try {
      await apiCall('/api/v1/routines', {
        method: 'POST',
        body: JSON.stringify({
          class_id: selectedClassId || 'cls_kafiya',
          day_of_week: selectedDay,
          period_number: Number(routinePeriod),
          start_time: routineStartTime,
          end_time: routineEndTime,
          subject_name_bn: routineSubject,
          teacher_name_bn: routineTeacher,
          room_number: routineRoom
        })
      });

      setIsRoutineModalOpen(false);
      setRoutineSubject('');
      await fetchRoutines(selectedClassId, selectedDay);
    } catch (err) {
      alert('রুটিন পিরিয়ড যোগ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsRoutineSubmitting(false);
    }
  };

  const handleCopyDayRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/api/v1/routines/copy-day', {
        method: 'POST',
        body: JSON.stringify({
          class_id: selectedClassId || 'cls_kafiya',
          fromDay: copySourceDay,
          toDay: copyTargetDay
        })
      });

      alert(`${DAYS_BN[copySourceDay]} এর সকল পিরিয়ড সফলভাবে ${DAYS_BN[copyTargetDay]} এ কপি করা হয়েছে!`);
      setIsCopyModalOpen(false);
      if (selectedDay === copyTargetDay) {
        await fetchRoutines(selectedClassId, selectedDay);
      }
    } catch (err) {
      alert('রুটিন কপি ব্যর্থ হয়েছে');
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm('এই পিরিয়ডটি মুছে ফেলতে চান?')) return;
    try {
      await apiCall(`/api/v1/routines/${id}`, { method: 'DELETE' });
      await fetchRoutines(selectedClassId, selectedDay);
    } catch (err) {
      alert('পিরিয়ড ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const filteredList = progressList.filter((p) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      p.kitab_name?.toLowerCase().includes(term) ||
      p.lesson_title?.toLowerCase().includes(term) ||
      p.bab_or_chapter?.toLowerCase().includes(term) ||
      p.teacher_name_bn?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/40">
        <div>
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
            <span>একাডেমিক নেসাব ও ডায়নামিক রুটিন বিল্ডার</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            একাডেমিক ম্যানেজমেন্ট ও রুটিন
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            কওমী ও আলিয়া বিভাগের জামাতভিত্তিক কিতাবের পাঠ অগ্রগতি এবং সাপ্তাহিক পিরিয়ড রুটিন ও ডে-টু-ডে কপি
          </p>
        </div>

        <div className="flex items-center gap-2">
          {academicTab === 'progress' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পাঠ এন্ট্রি করুন</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-emerald-800/80 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md border border-emerald-600/40 transition active:scale-95"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-300" />
                <span>ডে-টু-ডে কপি</span>
              </button>
              <button
                onClick={() => setIsRoutineModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন পিরিয়ড যোগ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setAcademicTab('progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            academicTab === 'progress'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>কিতাব নেসাব ও পাঠ অগ্রগতি</span>
        </button>

        <button
          onClick={() => setAcademicTab('routine')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            academicTab === 'routine'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>ডায়নামিক রুটিন বিল্ডার (ডে-টু-ডে কপি)</span>
        </button>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {academicTab === 'progress' && (
          <button
            onClick={() => setSelectedClassId('')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex-shrink-0 ${
              selectedClassId === ''
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            সকল জামাত
          </button>
        )}
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => {
              setSelectedClassId(cls.id);
              setFormClassId(cls.id);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex-shrink-0 ${
              selectedClassId === cls.id
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cls.name_bn}
            {cls.student_count !== undefined && (
              <span className="ml-1.5 opacity-75 font-normal">({cls.student_count} ছাত্র)</span>
            )}
          </button>
        ))}
      </div>

      {/* PROGRESS TAB CONTENT */}
      {academicTab === 'progress' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="কিতাবের নাম, পাঠের শিরোনাম অথবা উস্তাদের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <VoiceInputButton onTranscript={(txt) => setSearchQuery(txt)} />
          </div>

          {/* Content List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">কোনো কিতাব পাঠের তথ্য পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                এই জামাতের জন্য এখনো কোনো কিতাবের পাঠ রেকর্ড করা হয়নি। উপরে "নতুন পাঠ এন্ট্রি করুন" বাটনে ক্লিক করে আজ পড়ানো পাঠ রেকর্ড করুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((item) => {
                const percent = Math.min(100, Math.round(((item.pages_completed || 0) / (item.total_kitab_pages || 100)) * 100));
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4 hover:border-emerald-500/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {item.class_name_bn || 'কাফিয়া'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {item.kitab_name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.subject_name_bn}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {percent}% সমাপ্ত
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        আজকের পাঠ: {item.lesson_title}
                      </div>
                      {item.bab_or_chapter && (
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          অধ্যায়/বাব: {item.bab_or_chapter}
                        </div>
                      )}
                      {item.remarks && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200 dark:border-slate-800">
                          "{item.remarks}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.teacher_name_bn}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.date_logged}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ROUTINE BUILDER TAB CONTENT */}
      {academicTab === 'routine' && (
        <div className="space-y-4">
          {/* Day of Week Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DAYS_LIST.map((dayKey) => (
              <button
                key={dayKey}
                onClick={() => setSelectedDay(dayKey)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex-shrink-0 ${
                  selectedDay === dayKey
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {DAYS_BN[dayKey]}
              </button>
            ))}
          </div>

          {/* Timetable Period Grid */}
          {isLoading ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
              <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">ক্লাস রুটিন লোড হচ্ছে...</p>
            </div>
          ) : routines.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {DAYS_BN[selectedDay]} এর জন্য কোনো ক্লাস পিরিয়ড নেই
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                এই দিনে কোনো ক্লাস রুটিন যুক্ত করা হয়নি। আপনি "নতুন পিরিয়ড যোগ" করতে পারেন অথবা "ডে-টু-ডে কপি" এর মাধ্যমে অন্য দিনের রুটিন ক্লোন করতে পারেন।
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsRoutineModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 shadow-sm"
                >
                  নতুন পিরিয়ড যোগ করুন
                </button>
                <button
                  onClick={() => setIsCopyModalOpen(true)}
                  className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50"
                >
                  অন্য দিন থেকে কপি করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routines.map((rtn) => (
                <div
                  key={rtn.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 relative hover:border-emerald-500/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      পিরিয়ড #{rtn.period_number}
                    </span>
                    <button
                      onClick={() => handleDeleteRoutine(rtn.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {rtn.subject_name_bn}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{rtn.start_time} - {rtn.end_time}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {rtn.teacher_name_bn}
                    </span>
                    {rtn.room_number && (
                      <span className="text-[11px] font-bold text-slate-500">
                        রুম: {rtn.room_number}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: New Progress */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">নতুন কিতাব পাঠ এন্ট্রি</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    জামাত/শ্রেণী *
                  </label>
                  <select
                    value={formClassId || selectedClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_bn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিষয় *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: নাহব শাস্ত্র"
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কিতাবের নাম *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আল-কাফিয়া"
                    value={formKitabName}
                    onChange={(e) => setFormKitabName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <VoiceInputButton onTranscript={(txt) => setFormKitabName(txt)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বাব / অধ্যায়
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মারফূআত"
                    value={formBabChapter}
                    onChange={(e) => setFormBabChapter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আজকের পাঠ / মাকসাদ *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ইসম গাইরে মুনসারিফ"
                      value={formLessonTitle}
                      onChange={(e) => setFormLessonTitle(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <VoiceInputButton onTranscript={(txt) => setFormLessonTitle(txt)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সমাপ্ত পৃষ্ঠা
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formPagesCompleted}
                    onChange={(e) => setFormPagesCompleted(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোট পৃষ্ঠা
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formTotalPages}
                    onChange={(e) => setFormTotalPages(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  উস্তাদের মন্তব্য ও নির্দেশনা
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="আজকের ক্লাসের অগ্রগতি ও ছাত্রদের বোঝাপড়ার অবস্থা..."
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  ></textarea>
                  <VoiceInputButton onTranscript={(txt) => setFormRemarks(txt)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'পাঠ নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Routine Slot */}
      {isRoutineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">নতুন পিরিয়ড স্লট যুক্ত করুন</h3>
              </div>
              <button
                onClick={() => setIsRoutineModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoutine} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    দিন
                  </label>
                  <input
                    type="text"
                    disabled
                    value={DAYS_BN[selectedDay]}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পিরিয়ড নম্বর *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={routinePeriod}
                    onChange={(e) => setRoutinePeriod(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শুরুর সময়
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="০৮:০০ AM"
                    value={routineStartTime}
                    onChange={(e) => setRoutineStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শেষের সময়
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="০৮:৪৫ AM"
                    value={routineEndTime}
                    onChange={(e) => setRoutineEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিষয় / কিতাব *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: কাফিয়া (নাহব শাস্ত্র)"
                    value={routineSubject}
                    onChange={(e) => setRoutineSubject(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <VoiceInputButton onTranscript={(txt) => setRoutineSubject(txt)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    উস্তাদের নাম
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="মাওলানা হারুনুর রশিদ"
                    value={routineTeacher}
                    onChange={(e) => setRoutineTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="১০১"
                    value={routineRoom}
                    onChange={(e) => setRoutineRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoutineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isRoutineSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isRoutineSubmitting ? 'যোগ হচ্ছে...' : 'পিরিয়ড সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Day-to-Day Copy ("ডে-টু-ডে কপি") */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">ডে-টু-ডে রুটিন কপি (Day-to-Day Copy)</h3>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              এক দিনের রুটিনের সকল পিরিয়ড এক ক্লিকে অন্য দিনে কপি করে নিন। এতে বারবার একই রুটিন টাইপ করার ঝামেলা থাকে না।
            </p>

            <form onSubmit={handleCopyDayRoutine} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  উৎস দিন (যে দিনের রুটিন কপি করতে চান)
                </label>
                <select
                  value={copySourceDay}
                  onChange={(e) => setCopySourceDay(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {DAYS_LIST.map((d) => (
                    <option key={d} value={d}>{DAYS_BN[d]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  গন্তব্য দিন (যে দিনে রুটিন পেস্ট হবে)
                </label>
                <select
                  value={copyTargetDay}
                  onChange={(e) => setCopyTargetDay(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {DAYS_LIST.map((d) => (
                    <option key={d} value={d} disabled={d === copySourceDay}>
                      {DAYS_BN[d]} {d === copySourceDay ? '(একই দিন সম্ভব নয়)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
                >
                  কপি সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
