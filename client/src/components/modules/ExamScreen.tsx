import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Award, FileSpreadsheet, Eye, Printer, X } from 'lucide-react';

export const ExamScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('exam_first_term_2026');
  const [selectedClassId, setSelectedClassId] = useState('cls_nahbemir');
  const [tabulationData, setTabulationData] = useState<any>(null);
  const [studentMarksheet, setStudentMarksheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    }
  }, [selectedExamId, selectedClassId]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            <span>পরীক্ষার ফলাফল ও নম্বরপত্র (Tabulation & Marksheet)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ১ম সাময়িক পরীক্ষা ২০২৬ • ক্লাস ভিত্তিক ফলাফল ও মেধাতালিকা
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name_bn}</option>
            ))}
          </select>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold"
          >
            <option value="cls_nahbemir">নাহবেমীর জামাত</option>
            <option value="cls_kafiya">কাফিয়া জামাত</option>
            <option value="cls_hidayah">হেদায়াতুন্নাহু জামাত</option>
          </select>
        </div>
      </div>

      {/* Tabulation Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            {tabulationData?.classInfo?.name_bn || 'নাহবেমীর জামাত'} - ফলাফল বিবরণী তালিকা
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
            চূড়ান্ত ফলাফল প্রকাশিত
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">রোল</th>
                <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                <th className="py-3 px-4">নাহবেমীর ও ব্যাকরণ</th>
                <th className="py-3 px-4">কুরআন ও হিফজ</th>
                <th className="py-3 px-4 text-right">মোট নম্বর</th>
                <th className="py-3 px-4 text-center">শতাংশ</th>
                <th className="py-3 px-4 text-center">গ্রেড</th>
                <th className="py-3 px-4 text-center">নম্বরপত্র</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tabulationData?.students?.map((st: any) => (
                <tr key={st.studentId} className="hover:bg-emerald-50/50 transition">
                  <td className="py-3 px-4 font-bold text-slate-700">{st.rollNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{st.fullNameBn}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {st.subjects[0]?.obtained || 88}/100
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {st.subjects[1]?.obtained || 92}/100
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {st.totalObtained}/{st.totalMax}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {st.percentage}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {st.finalGrade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => fetchMarksheet(st.studentId)}
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>মার্কশিট</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marksheet Modal Preview */}
      {studentMarksheet && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-gold" />
                <span className="font-bold text-slate-900 text-sm">ডিজিটাল শিক্ষাবর্ষ নম্বরপত্র</span>
              </div>
              <button onClick={() => setStudentMarksheet(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Marksheet Layout */}
            <div className="border-2 border-emerald-800 rounded-2xl p-6 bg-slate-50 text-slate-800 space-y-4">
              <div className="text-center border-b border-emerald-700/30 pb-3">
                <div className="font-bold text-sm text-primary-950">দারুল উলূম সেন্ট্রাল মাদ্রাসা, ঢাকা</div>
                <div className="text-[11px] text-slate-600">১ম সাময়িক পরীক্ষা ২০২৬ • আনুষ্ঠানিক ফলাফলপত্র</div>
                <div className="text-[10px] text-emerald-800 font-bold mt-0.5">আল-জামিয়াতুল ইসলামিয়া ট্রাস্ট পরিচালিত</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">শিক্ষার্থীর নাম:</span>{' '}
                  <span className="font-bold">{studentMarksheet.student?.full_name_bn}</span>
                </div>
                <div>
                  <span className="text-slate-500">আইডি:</span>{' '}
                  <span className="font-mono font-bold">{studentMarksheet.student?.student_id_number}</span>
                </div>
                <div>
                  <span className="text-slate-500">শ্রেণি:</span>{' '}
                  <span className="font-bold">{studentMarksheet.student?.class_name_bn}</span>
                </div>
                <div>
                  <span className="text-slate-500">রোল নম্বর:</span>{' '}
                  <span className="font-bold">{studentMarksheet.student?.roll_number}</span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">বিষয় / কিতাব</th>
                      <th className="py-2 px-3 text-right">পূর্ণমান</th>
                      <th className="py-2 px-3 text-right">প্রাপ্ত নম্বর</th>
                      <th className="py-2 px-3 text-center">লেটার গ্রেড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentMarksheet.marks?.map((m: any) => (
                      <tr key={m.id}>
                        <td className="py-2 px-3 font-medium">{m.subject_name_bn}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{m.total_marks}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{m.obtained_marks}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">{m.letter_grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Final Summary */}
              <div className="p-3 bg-emerald-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-950">সর্বমোট প্রাপ্ত নম্বর:</span>{' '}
                  <span className="font-bold text-sm text-emerald-900">{studentMarksheet.summary?.obtainedMarks}</span> / {studentMarksheet.summary?.totalMarks}
                </div>
                <div>
                  <span className="font-bold text-emerald-950">চূড়ান্ত ফলাফল:</span>{' '}
                  <span className="font-bold text-emerald-900">{studentMarksheet.summary?.arabicGrade}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট / পিডিএফ ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
