import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  GraduationCap,
  Award,
  Download,
  Eye,
  Printer,
  X,
  Scan,
  Save,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Search
} from 'lucide-react';
import { PhotoGallery } from '../common/PhotoGallery';
import { DocumentCapture } from '../common/DocumentCapture';

export const ExamScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const { settings } = useSettings();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('exam_first_term_2026');
  const [selectedClassId, setSelectedClassId] = useState('cls_nahbemir');
  const [tabulationData, setTabulationData] = useState<any>(null);
  const [studentMarksheet, setStudentMarksheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mode: Tabulation View vs. Keyboard-First Mark Entry
  const [isEntryMode, setIsEntryMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marksGrid, setMarksGrid] = useState<Record<string, Record<string, number | ''>>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cellInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const fetchExams = async () => {
    try {
      const data = await apiCall('/api/v1/exams');
      setExams(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTabulation = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall(`/api/v1/exams/${selectedExamId}/tabulation?classId=${selectedClassId}`);
      setTabulationData(data);

      // Initialize grid state for entry mode
      if (data?.students) {
        const initialGrid: Record<string, Record<string, number | ''>> = {};
        data.students.forEach((st: any) => {
          initialGrid[st.studentId] = {};
          (st.subjects || []).forEach((sub: any) => {
            initialGrid[st.studentId][sub.subjectNameBn] = sub.obtained !== undefined ? sub.obtained : '';
          });
        });

        // Check for local storage drafts
        const draftKey = `madrasa_draft_marks_${selectedExamId}_${selectedClassId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setMarksGrid({ ...initialGrid, ...parsed });
            setIsDirty(true);
          } catch {
            setMarksGrid(initialGrid);
          }
        } else {
          setMarksGrid(initialGrid);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarksheet = async (studentId: string) => {
    try {
      const data = await apiCall(`/api/v1/exams/${selectedExamId}/student/${studentId}`);
      setStudentMarksheet(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      fetchTabulation();
      setIsDirty(false);
      setCellErrors({});
    }
  }, [selectedExamId, selectedClassId]);

  // Global Keyboard listener for '/' shortcut to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter students based on search
  const filteredStudents = tabulationData?.students?.filter((st: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.fullNameBn?.toLowerCase().includes(q) ||
      st.rollNumber?.toString().includes(q)
    );
  }) || [];

  // Subject columns in class
  const subjectList: string[] = tabulationData?.students?.[0]?.subjects?.map((s: any) => s.subjectNameBn) || [
    'নাহবেমীর ও ব্যাকরণ',
    'কুরআন ও হিফজ'
  ];

  // Update mark cell with strict validation
  const handleMarkChange = (studentId: string, subject: string, value: string) => {
    const cellKey = `${studentId}_${subject}`;

    if (value === '') {
      setMarksGrid(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [subject]: '' }
      }));
      setCellErrors(prev => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
      setIsDirty(true);
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num)) return;

    if (num > 100) {
      setCellErrors(prev => ({
        ...prev,
        [cellKey]: 'মার্ক ১০০-এর বেশি হতে পারে না'
      }));
      return;
    }

    if (num < 0) {
      setCellErrors(prev => ({
        ...prev,
        [cellKey]: 'মার্ক ০-এর কম হতে পারে না'
      }));
      return;
    }

    // Valid mark
    setCellErrors(prev => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });

    const updatedGrid = {
      ...marksGrid,
      [studentId]: { ...marksGrid[studentId], [subject]: num }
    };
    setMarksGrid(updatedGrid);
    setIsDirty(true);

    // Persist draft in localStorage
    const draftKey = `madrasa_draft_marks_${selectedExamId}_${selectedClassId}`;
    localStorage.setItem(draftKey, JSON.stringify(updatedGrid));
  };

  // Keyboard Navigation across cells
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    subjectIdx: number
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextStudent = filteredStudents[studentIdx + 1];
      if (nextStudent) {
        const nextSubject = subjectList[subjectIdx];
        cellInputRefs.current[`${nextStudent.studentId}_${nextSubject}`]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = filteredStudents[studentIdx - 1];
      if (prevStudent) {
        const currentSubject = subjectList[subjectIdx];
        cellInputRefs.current[`${prevStudent.studentId}_${currentSubject}`]?.focus();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      if (subjectIdx < subjectList.length - 1) {
        e.preventDefault();
        const nextSubject = subjectList[subjectIdx + 1];
        const currentStudent = filteredStudents[studentIdx];
        cellInputRefs.current[`${currentStudent.studentId}_${nextSubject}`]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (subjectIdx > 0) {
        e.preventDefault();
        const prevSubject = subjectList[subjectIdx - 1];
        const currentStudent = filteredStudents[studentIdx];
        cellInputRefs.current[`${currentStudent.studentId}_${prevSubject}`]?.focus();
      }
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  // Save batch marks
  const handleSaveMarks = async () => {
    if (Object.keys(cellErrors).length > 0) {
      showToast('ত্রুটিপূর্ণ নম্বর সংশোধন না করে সংরক্ষণ করা যাবে না।');
      return;
    }

    setIsSaving(true);
    try {
      const marksList: Array<{ studentId: string; subjectNameBn: string; obtained: number; total: number }> = [];

      Object.entries(marksGrid).forEach(([studentId, subjects]) => {
        Object.entries(subjects).forEach(([subjectNameBn, val]) => {
          if (val !== '' && typeof val === 'number') {
            marksList.push({
              studentId,
              subjectNameBn,
              obtained: val,
              total: 100
            });
          }
        });
      });

      await apiCall(`/api/v1/exams/${selectedExamId}/marks`, 'POST', {
        classId: selectedClassId,
        marksList
      });

      // Clear draft on successful save
      const draftKey = `madrasa_draft_marks_${selectedExamId}_${selectedClassId}`;
      localStorage.removeItem(draftKey);
      setIsDirty(false);
      showToast('নম্বর সফলভাবে সংরক্ষিত হয়েছে।');
      fetchTabulation();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'নম্বর সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Results
  const handlePublish = async () => {
    try {
      await apiCall(`/api/v1/exams/${selectedExamId}/publish`, 'POST');
      showToast('ফলাফল প্রকাশিত হয়েছে।');
      fetchTabulation();
    } catch (err: any) {
      showToast(err.message || 'ফলাফল প্রকাশ করা সম্ভব হয়নি।');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 page-enter">
      <DocumentCapture isOpen={showQrScanner} onClose={() => setShowQrScanner(false)} defaultTab="qr" />

      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2A44] text-[#E9E3D5] px-4 py-2.5 rounded-[2px] border border-[#17161A] shadow-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#A87A2E]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Header Card: Kitabkhana Styling */}
      <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2A44] mb-1 font-ui">
            <span className="w-2 h-2 rounded-[999px] bg-[#93321F]"></span>
            <span>পরীক্ষা ও ফলাফল দপ্তর</span>
            <span className="text-[#17161A]/30">/</span>
            <span>নম্বরপত্র ব্যবস্থাপনা</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#17161A] font-bangla-display">
            পরীক্ষার ফলাফল ও নম্বরপত্র (Tabulation & Marksheet)
          </h2>
          <p className="text-xs text-[#4A4A52] mt-0.5">
            গতিশীল নম্বর এন্ট্রি, কীবোর্ড নেভিগেশন এবং ক্লাস ভিত্তিক মেধাতালিকা খতিয়ান
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-ui text-xs">
          <button
            type="button"
            onClick={() => setShowQrScanner(true)}
            className="flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-[#E9E3D5] text-[#17161A] px-3 py-1.5 rounded-[2px] border border-[#17161A]/40 transition-all cursor-pointer font-semibold"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>QR স্ক্যান</span>
          </button>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="border border-[#17161A]/30 rounded-[2px] px-3 py-1.5 bg-white text-[#17161A] font-semibold focus:outline-hidden"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name_bn}</option>
            ))}
          </select>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border border-[#17161A]/30 rounded-[2px] px-3 py-1.5 bg-white text-[#17161A] font-semibold focus:outline-hidden"
          >
            <option value="cls_nahbemir">নাহবেমীর জামাত</option>
            <option value="cls_kafiya">কাফিয়া জামাত</option>
            <option value="cls_hidayah">হেদায়াতুন্নাহু জামাত</option>
          </select>

          {/* Toggle between Tabulation and Keyboard Entry Mode */}
          <button
            type="button"
            onClick={() => setIsEntryMode(!isEntryMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border transition-all cursor-pointer font-bold ${
              isEntryMode
                ? 'bg-[#93321F] text-[#FAF8F5] border-[#93321F]'
                : 'bg-[#1F2A44] text-[#E9E3D5] border-[#1F2A44] hover:bg-[#17161A]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{isEntryMode ? 'ফলাফল বিবরণী মোড' : 'দ্রুত নম্বর এন্ট্রি মোড'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabulation & Keyboard Entry Container */}
      <div className="border border-[#17161A] bg-[#FAF8F5] rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)] overflow-hidden">
        {/* Table Controls Sub-Bar */}
        <div className="p-4 border-b border-[#17161A]/20 bg-[#E2DBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#17161A] font-bangla-display">
              {tabulationData?.classInfo?.name_bn || 'নাহবেমীর জামাত'} — {isEntryMode ? 'দ্রুত নম্বর এন্ট্রি খতিয়ান' : 'ফলাফল বিবরণী তালিকা'}
            </span>
            {isDirty && (
              <span className="px-2 py-0.5 bg-[#93321F] text-white rounded-[2px] text-[10px] font-bold">
                ড্রাফট অপরিবর্তিত
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* '/' Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#4A4A52]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খুঁজুন (বা '/' চাপুন)..."
                className="pl-7 pr-3 py-1 text-xs border border-[#17161A]/30 rounded-[2px] bg-white text-[#17161A] focus:outline-hidden w-44"
              />
            </div>

            {isEntryMode ? (
              <button
                type="button"
                onClick={handleSaveMarks}
                disabled={isSaving || !isDirty}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F2A44] hover:bg-[#17161A] text-[#E9E3D5] rounded-[2px] font-bold transition-all disabled:opacity-40 cursor-pointer font-ui"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F2A44] hover:bg-[#17161A] text-[#E9E3D5] rounded-[2px] font-bold transition-all cursor-pointer font-ui"
                >
                  ফলাফল প্রকাশ করুন
                </button>
                <a
                  href={`/api/v1/pdf/result/${selectedExamId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#17161A] border border-[#17161A]/30 rounded-[2px] font-bold hover:bg-[#E9E3D5] transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-[#1F2A44]" />
                  <span>PDF খতিয়ান</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Dense Table View (Function Over Form, Hairline Borders, Outline Row Highlight) */}
        <div className="overflow-x-auto">
          <table className="table-kitab text-xs">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>রোল</th>
                <th>শিক্ষার্থীর নাম</th>
                {subjectList.map((sub) => (
                  <th key={sub} className="text-center">
                    {sub} {isEntryMode ? '(পূর্ণমান ১০০)' : ''}
                  </th>
                ))}
                {!isEntryMode && (
                  <>
                    <th className="text-right">মোট প্রাপ্ত</th>
                    <th className="text-center">শতাংশ</th>
                    <th className="text-center">গ্রেড</th>
                    <th className="text-center">নম্বরপত্র</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={subjectList.length + 5} className="py-8 text-center text-[#4A4A52]">
                    কোনো শিক্ষার্থী পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st: any, sIdx: number) => (
                  <tr key={st.studentId} tabIndex={0} className="hover:outline-2 hover:outline-[#93321F] hover:-outline-offset-2 transition-none">
                    <td className="font-bold text-[#17161A] font-ui">{st.rollNumber}</td>
                    <td className="font-bold text-[#17161A]">{st.fullNameBn}</td>

                    {/* Subject cells */}
                    {subjectList.map((sub, subIdx) => {
                      const cellKey = `${st.studentId}_${sub}`;
                      const cellError = cellErrors[cellKey];
                      const val = marksGrid[st.studentId]?.[sub];

                      if (isEntryMode) {
                        return (
                          <td key={sub} className="p-1 text-center">
                            <div className="relative">
                              <input
                                ref={(el) => { cellInputRefs.current[cellKey] = el; }}
                                type="text"
                                inputMode="numeric"
                                value={val !== undefined ? val : ''}
                                onChange={(e) => handleMarkChange(st.studentId, sub, e.target.value)}
                                onKeyDown={(e) => handleCellKeyDown(e, sIdx, subIdx)}
                                aria-label={`${st.fullNameBn} এর ${sub} নম্বর`}
                                className={`w-16 px-2 py-1 text-center font-bold font-ui text-xs border rounded-[2px] bg-white transition-none focus:outline-hidden ${
                                  cellError
                                    ? 'border-[#93321F] text-[#93321F] bg-[#93321F]/10 ring-1 ring-[#93321F]'
                                    : 'border-[#17161A]/30 text-[#17161A] focus:border-[#93321F] focus:ring-1 focus:ring-[#93321F]'
                                }`}
                              />
                              {cellError && (
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-30 bg-[#93321F] text-white text-[10px] px-2 py-0.5 rounded-[2px] whitespace-nowrap shadow-md pointer-events-none">
                                  {cellError}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Read-only tabulation cell
                      const subData = st.subjects?.find((s: any) => s.subjectNameBn === sub);
                      const displayMark = subData ? subData.obtained : 85;
                      return (
                        <td key={sub} className="text-center font-semibold text-[#17161A] font-ui">
                          {displayMark} / 100
                        </td>
                      );
                    })}

                    {!isEntryMode && (
                      <>
                        <td className="text-right font-bold text-[#17161A] font-ui">
                          {st.totalObtained || 180} / {st.totalMax || 200}
                        </td>
                        <td className="text-center font-bold text-[#1F2A44] font-ui">
                          {st.percentage || 90}%
                        </td>
                        <td className="text-center font-bold font-ui text-xs text-[#17161A]">
                          {st.finalGrade || 'মুমতাজ (A+)'}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => fetchMarksheet(st.studentId)}
                            className="px-2 py-1 bg-[#FAF8F5] hover:bg-[#E9E3D5] text-[#17161A] border border-[#17161A]/30 rounded-[2px] font-bold text-[11px] transition-all cursor-pointer font-ui"
                          >
                            মার্কশিট
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marksheet Modal Preview (Pure Kitabkhana Layout) */}
      {studentMarksheet && (
        <div className="fixed inset-0 bg-[#17161A]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] w-full max-w-xl rounded-[2px] p-6 shadow-2xl border border-[#17161A] space-y-4">
            <div className="flex items-center justify-between border-b border-[#17161A]/20 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#A87A2E]" />
                <span className="font-bold text-[#17161A] text-sm font-bangla-display">
                  আনুষ্ঠানিক শিক্ষাবর্ষ নম্বরপত্র (সনদ খতিয়ান)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStudentMarksheet(null)}
                aria-label="বন্ধ করুন"
                className="p-1 text-[#4A4A52] hover:text-[#93321F] rounded-[2px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Marksheet Layout */}
            <div className="border border-[#17161A] p-6 bg-[#FAF8F5] text-[#17161A] space-y-4 rounded-[2px]">
              <div className="text-center border-b border-[#17161A]/20 pb-3">
                <div className="font-bold text-base font-bangla-display text-[#1F2A44]">{settings.nameBn || 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা'}</div>
                <div className="text-xs text-[#4A4A52] mt-0.5">১ম সাময়িক পরীক্ষা ২০২৬ • আনুষ্ঠানিক ফলাফলপত্র</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#E9E3D5] p-3 rounded-[2px] border border-[#17161A]/20">
                <div>
                  <span className="text-[#4A4A52]">শিক্ষার্থীর নাম:</span>{' '}
                  <span className="font-bold text-[#17161A]">{studentMarksheet.student?.full_name_bn}</span>
                </div>
                <div>
                  <span className="text-[#4A4A52]">দাখেলা নম্বর:</span>{' '}
                  <span className="font-mono font-bold text-[#17161A]">{studentMarksheet.student?.student_id_number}</span>
                </div>
                <div>
                  <span className="text-[#4A4A52]">জামাত / শ্রেণি:</span>{' '}
                  <span className="font-bold text-[#17161A]">{studentMarksheet.student?.class_name_bn}</span>
                </div>
                <div>
                  <span className="text-[#4A4A52]">রোল নম্বর:</span>{' '}
                  <span className="font-bold text-[#17161A]">{studentMarksheet.student?.roll_number}</span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="overflow-hidden border border-[#17161A]">
                <table className="table-kitab text-xs">
                  <thead>
                    <tr>
                      <th>বিষয় / কিতাব</th>
                      <th className="text-right">পূর্ণমান</th>
                      <th className="text-right">প্রাপ্ত নম্বর</th>
                      <th className="text-center">গ্রেড</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarksheet.marks?.map((m: any) => (
                      <tr key={m.id}>
                        <td className="font-semibold text-[#17161A]">{m.subject_name_bn}</td>
                        <td className="text-right text-[#4A4A52] font-ui">{m.total_marks}</td>
                        <td className="text-right font-bold text-[#17161A] font-ui">{m.obtained_marks}</td>
                        <td className="text-center font-bold text-[#1F2A44] font-ui">{m.letter_grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Final Summary */}
              <div className="p-3 bg-[#E9E3D5] rounded-[2px] border border-[#17161A]/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#4A4A52]">সর্বমোট প্রাপ্ত নম্বর:</span>{' '}
                  <span className="font-bold text-sm text-[#17161A] font-ui">{studentMarksheet.summary?.obtainedMarks}</span> / {studentMarksheet.summary?.totalMarks}
                </div>
                <div>
                  <span className="text-[#4A4A52]">চূড়ান্ত ফলাফল:</span>{' '}
                  <span className="font-bold text-sm text-[#1F2A44] font-ui">{studentMarksheet.summary?.arabicGrade || studentMarksheet.summary?.finalGrade}</span>
                </div>
              </div>

              <div className="flex flex-col items-center mt-3 pt-3 border-t border-[#17161A]/10 text-center">
                <PhotoGallery 
                  type="result_card" 
                  refId={studentMarksheet.student?.id || studentMarksheet.student?.student_id_number || '123'} 
                  buttonLabel="রেজাল্ট কার্ডের ছবি সংরক্ষণ"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-[#1F2A44] hover:bg-[#17161A] text-[#E9E3D5] font-bold px-4 py-2 rounded-[2px] text-xs transition cursor-pointer font-ui"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট / ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
