import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, User, CalendarCheck2, BookOpen, Receipt, Bed, Clock, Phone, MapPin, Award } from 'lucide-react';

interface StudentProfileModalProps {
  studentId: string;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ studentId, onClose }) => {
  const { apiCall } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'hifz' | 'fees' | 'timeline'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiCall(`/api/v1/students/${studentId}`);
        setStudent(data);
      } catch (err) {
        console.error('Failed to load student profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [studentId]);

  if (!student && isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-xs text-slate-500">
          শিক্ষার্থীর প্রোফাইল লোড হচ্ছে...
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Profile Hero */}
        <div className="bg-gradient-to-r from-primary-900 via-emerald-900 to-slate-900 p-6 text-white flex items-center justify-between border-b border-primary-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary-700 flex items-center justify-center text-2xl font-bold text-white border-2 border-emerald-300/40 shadow-inner">
              {student.full_name_bn.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{student.full_name_bn}</h2>
                <span className="text-[10px] bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  {student.status === 'active' ? 'নিয়মিত শিক্ষার্থী' : 'সাবেক'}
                </span>
              </div>
              <div className="text-xs text-emerald-200/90">{student.full_name_en}</div>
              <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                আইডি: {student.student_id_number} • শ্রেণি: {student.class_name_bn} (রোল: {student.roll_number})
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 dark:bg-slate-850 px-4 text-xs font-semibold">
          {[
            { id: 'overview', label: 'সারসংক্ষেপ', icon: User },
            { id: 'attendance', label: 'হাজিরা রেকর্ড', icon: CalendarCheck2 },
            { id: 'hifz', label: 'হিফজ অগ্রগতি', icon: BookOpen },
            { id: 'fees', label: 'ফি ও রসিদ', icon: Receipt },
            { id: 'timeline', label: 'মাদ্রাসা টাইমলাইন', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
                  isActive
                    ? 'border-emerald-700 text-primary-900 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                  অভিভাবকের তথ্য
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">নাম:</span>
                  <span className="font-bold text-slate-800">{student.guardian_name_bn}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">সম্পর্ক:</span>
                  <span className="font-semibold text-slate-700">{student.guardian_relation || 'পিতা'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">মোবাইল নং:</span>
                  <span className="font-mono text-emerald-700 font-bold">{student.guardian_phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">জরুরি যোগাযোগ:</span>
                  <span className="font-mono text-slate-700">{student.emergency_contact}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                  প্রাতিষ্ঠানিক ও ব্যক্তিগত তথ্য
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ভর্তির তারিখ:</span>
                  <span className="font-semibold text-slate-800">{student.admission_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">জন্ম তারিখ:</span>
                  <span className="font-semibold text-slate-800">{student.date_of_birth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">রক্তের গ্রুপ:</span>
                  <span className="font-bold text-red-600">{student.blood_group || 'B+'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ঠিকানা:</span>
                  <span className="font-semibold text-slate-800">{student.address}</span>
                </div>
              </div>

              {student.is_residential && student.hostelBed && (
                <div className="md:col-span-2 p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bed className="w-5 h-5 text-teal-700" />
                    <div>
                      <div className="font-bold text-teal-950">আবাসিক ছাত্রাবাস বরাদ্দ</div>
                      <div className="text-[11px] text-teal-800">
                        {student.hostelBed.buildingName} • রুম নং: {student.hostelBed.roomNumber} • বেড: {student.hostelBed.bedNumber}
                      </div>
                    </div>
                  </div>
                  <span className="bg-teal-200 text-teal-900 font-bold px-2 py-0.5 rounded text-[11px]">বরাদ্দকৃত</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold">উপস্থিতি হার</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{student.attendanceStats?.rate}%</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold">উপস্থিত দিন</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">{student.attendanceStats?.presentDays} দিন</div>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold">অনুপস্থিত দিন</div>
                  <div className="text-xl font-bold text-red-600 mt-1">{student.attendanceStats?.absentDays} দিন</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hifz' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">সাম্প্রতিক সবক ও মূল্যায়ন ইতিহাস</div>
              <div className="space-y-2">
                {student.recentHifz?.map((h: any) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{h.sabaq_surah} (পারা {h.sabaq_para}, আয়াত {h.sabaq_ayah_range})</div>
                      <div className="text-[11px] text-slate-500">সবকী ভুল: {h.sabqi_mistakes} • মঞ্জিল ভুল: {h.manzil_mistakes} • {h.teacher_notes}</div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {h.sabaq_rating === 'excellent' ? 'মুমতাজ' : 'জাইয়্যিদ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">মাসিক বেতন ও ফি চালান</div>
              <div className="space-y-2">
                {student.feeInvoices?.map((inv: any) => (
                  <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{inv.month} {inv.year} এর চালান ({inv.invoice_number})</div>
                      <div className="text-[11px] text-slate-500">মোট ফি: ৳{inv.total_amount} • পরিশোধ: ৳{inv.paid_amount}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {inv.status === 'paid' ? 'পরিশোধিত' : `বকেয়া: ৳${inv.due_amount}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative border-l-2 border-emerald-500 ml-4 pl-4 space-y-4">
                {student.timeline?.map((item: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white"></div>
                    <div className="text-[10px] text-slate-400 font-semibold">{item.date}</div>
                    <div className="font-bold text-slate-800 text-xs mt-0.5">{item.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
