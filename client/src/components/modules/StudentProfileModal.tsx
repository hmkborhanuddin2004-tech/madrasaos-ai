import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PhotoGallery } from '../common/PhotoGallery';
import { X, User, CalendarCheck2, BookOpen, Receipt, Bed, Clock, Phone, MapPin, Award, CreditCard, Camera } from 'lucide-react';
import { StudentIdCardModal } from '../common/StudentIdCardModal';
import { StudentPhotoModal } from '../common/StudentPhotoModal';

interface StudentProfileModalProps {
  studentId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ studentId, onClose, onRefresh }) => {
  const { apiCall } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'hifz' | 'fees' | 'timeline'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Profile Hero */}
        <div className="bg-gradient-to-r from-emerald-950 via-primary-900 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/80">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => setShowPhoto(true)}
              title="শিক্ষার্থীর ছবি আপলোড বা পরিবর্তন করতে ক্লিক করুন"
            >
              {student.avatar_url || student.photo_url ? (
                <img
                  src={student.avatar_url || student.photo_url}
                  alt={student.full_name_bn}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-lg bg-white"
                />
              ) : (
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-600 to-primary-800 flex items-center justify-center text-2xl font-bold text-white border-2 border-emerald-400/40 shadow-inner">
                  {student.full_name_bn?.slice(0, 1) || 'শ'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition text-white text-[9px] font-bold">
                <Camera className="w-4 h-4 mb-0.5 text-emerald-300" />
                <span>পরিবর্তন</span>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{student.full_name_bn}</h2>
                <span className="text-[10px] bg-emerald-600/90 text-white px-2 py-0.5 rounded-full font-bold shadow-2xs">
                  {student.status === 'active' ? 'নিয়মিত শিক্ষার্থী' : 'সাবেক'}
                </span>
                {student.is_hifz_student ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    হিফজুল কুরআন
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-emerald-200/90 font-medium">{student.full_name_en}</div>
              <div className="text-[11px] text-emerald-300 font-mono mt-1 flex flex-wrap items-center gap-2">
                <span className="bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800/80">আইডি: {student.student_id_number}</span>
                <span>•</span>
                <span>শ্রেণি: {student.class_name_bn}</span>
                <span>(রোল: {student.roll_number})</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowPhoto(true)}
              className="bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition border border-emerald-600/50 cursor-pointer active:scale-95"
              title="ছবি আপলোড বা স্ক্যান করুন"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ছবি পরিবর্তন</span>
            </button>
            <button
              type="button"
              onClick={() => setShowIdCard(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="আইডি কার্ড দেখুন ও প্রিন্ট করুন"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>আইডি কার্ড</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-300 hover:text-white p-1.5 rounded-xl hover:bg-emerald-800/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Only ID Card */}
        <div className="hidden print:block p-8">
          <div className="w-[300px] h-[450px] border-2 border-emerald-700 rounded-xl mx-auto flex flex-col items-center pt-8 relative overflow-hidden bg-white">
            <div className="absolute top-0 w-full h-24 bg-emerald-700"></div>
            <div className="z-10 w-24 h-24 bg-white rounded-full border-4 border-emerald-500 shadow-md flex items-center justify-center font-bold text-3xl text-emerald-800 mb-4">
              {student.full_name_bn?.slice(0, 1)}
            </div>
            <div className="z-10 text-center space-y-1 w-full px-4">
              <h2 className="text-lg font-bold text-slate-900">{student.full_name_bn}</h2>
              <div className="text-sm font-semibold text-emerald-700">{student.class_name_bn}</div>
              <div className="text-xs text-slate-500 font-mono">আইডি: {student.student_id_number}</div>
              <div className="text-xs text-slate-500 font-mono">রোল: {student.roll_number}</div>
              <div className="text-xs text-slate-500 mt-2">রক্তের গ্রুপ: {student.blood_group || 'B+'}</div>
            </div>
            <div className="mt-auto mb-6 flex flex-col items-center">
              <img src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1'}/qr/student/${student.id || student.student_id_number}`} className="w-20 h-20 border p-1" />
              <div className="text-[10px] text-slate-500 mt-1 font-bold">ভ্যালিডিটি স্ক্যানার</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-4 text-xs font-semibold print:hidden overflow-x-auto">
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
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs print:hidden">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Code Validation Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-2xs">
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1'}/qr/student/${student.id || student.student_id_number}`}
                  alt="QR Code"
                  className="w-32 h-32 mb-2 border border-slate-200 dark:border-slate-700 p-1.5 bg-white shadow-sm rounded-xl"
                />
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 text-[11px] uppercase tracking-wider">
                  স্মার্ট আইডি ভ্যালিডেশন QR
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  নিরাপদ ক্রিপ্টোগ্রাফিক যাচাইকরণ কিউআর
                </div>
              </div>

              {/* Personal & Academic Info Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
                <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>প্রাতিষ্ঠানিক ও ব্যক্তিগত তথ্য</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">ভর্তির তারিখ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.admission_date || '০১-০১-২০২৫'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">জন্ম তারিখ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.date_of_birth || '১০-০৫-২০১২'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">রক্তের গ্রুপ:</span>
                  <span className="font-black text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                    {student.blood_group || 'B+'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">ঠিকানা:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{student.address || 'ঢাকা, বাংলাদেশ'}</span>
                </div>
              </div>

              {/* Guardian Info Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 md:col-span-2 shadow-2xs">
                <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>অভিভাবকের তথ্য ও জরুরি যোগাযোগ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">অভিভাবকের নাম:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{student.guardian_name_bn}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">সম্পর্ক:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{student.guardian_relation || 'পিতা'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">মোবাইল নং:</span>
                      <a href={`tel:${student.guardian_phone}`} className="font-mono text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                        {student.guardian_phone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">জরুরি যোগাযোগ:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{student.emergency_contact || student.guardian_phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {student.is_residential && (
                <div className="md:col-span-2 p-4 bg-teal-50/80 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-teal-950 dark:text-teal-200">আবাসিক ছাত্রাবাস শিক্ষার্থী</div>
                      <div className="text-[11px] text-teal-800 dark:text-teal-300">
                        {student.hostelBed?.buildingName ? `${student.hostelBed.buildingName} • রুম: ${student.hostelBed.roomNumber} • বেড: ${student.hostelBed.bedNumber}` : 'ছাত্রাবাস ও খানা হিসাব সংযুক্ত'}
                      </div>
                    </div>
                  </div>
                  <span className="bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-200 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                    আবাসিক
                  </span>
                </div>
              )}
              
              <div className="md:col-span-2">
                <PhotoGallery 
                  type="student_doc" 
                  refId={student.id} 
                  buttonLabel="ছবি তুলুন / ডকুমেন্ট আপলোড"
                />
              </div>
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

      {/* Student ID Card Modal */}
      {showIdCard && (
        <StudentIdCardModal
          studentId={student.id}
          onClose={() => setShowIdCard(false)}
          onOpenPhotoModal={() => {
            setShowIdCard(false);
            setShowPhoto(true);
          }}
        />
      )}

      {/* Student Photo Modal */}
      {showPhoto && (
        <StudentPhotoModal
          isOpen={showPhoto}
          onClose={() => setShowPhoto(false)}
          studentId={student.id}
          studentName={student.full_name_bn}
          currentPhotoUrl={student.avatar_url || student.photo_url}
          onPhotoUpdated={(newUrl) => {
            setStudent((prev: any) => ({ ...prev, avatar_url: newUrl, photo_url: newUrl }));
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};
