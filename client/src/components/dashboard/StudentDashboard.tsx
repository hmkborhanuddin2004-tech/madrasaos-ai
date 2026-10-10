import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  CalendarCheck2,
  Receipt,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';

const QURAN_30_PARAS = [
  { no: 1, nameBn: 'আলিফ লাম মীম', nameAr: 'الم' },
  { no: 2, nameBn: 'সায়াকূল', nameAr: 'سَيَقُولُ' },
  { no: 3, nameBn: 'তিলকার রুসুল', nameAr: 'تِلْكَ الرُّسُلُ' },
  { no: 4, nameBn: 'লান তানালূ', nameAr: 'لَنْ تَنَالُوا' },
  { no: 5, nameBn: 'ওয়াল মুহসানাতু', nameAr: 'وَالْمُحْصَنَاتُ' },
  { no: 6, nameBn: 'লা ইয়ুহিব্বুল্লাহ', nameAr: 'لَا يُحِبُّ اللَّهُ' },
  { no: 7, nameBn: 'ওয়া ইজা সামিঊ', nameAr: 'وَإِذَا سَمِعُوا' },
  { no: 8, nameBn: 'ওয়া লাও আন্নানা', nameAr: 'وَلَوْ أَنَّنَا' },
  { no: 9, nameBn: 'ক্বালল মালাউ', nameAr: 'قَالَ الْمَلَأُ' },
  { no: 10, nameBn: 'ওয়া’লামূ', nameAr: 'وَاعْلَمُوا' },
  { no: 11, nameBn: 'ইয়া’তাযিরূন', nameAr: 'يَعْتَذِرُونَ' },
  { no: 12, nameBn: 'ওয়া মা মিন দা-ব্বাহ', nameAr: 'وَمَا مِنْ دَابَّةٍ' },
  { no: 13, nameBn: 'ওয়া মা উবাররিউ', nameAr: 'وَمَا أُبَرِّئُ' },
  { no: 14, nameBn: 'রুবা-মা', nameAr: 'رُبَمَا' },
  { no: 15, nameBn: 'সুবহানাল্লাজি', nameAr: 'سُبْحَانَ الَّذِي' },
  { no: 16, nameBn: 'ক্বালা আলাম', nameAr: 'قَالَ أَلَمْ' },
  { no: 17, nameBn: 'ইকতারাবা', nameAr: 'اقْتَرَبَ' },
  { no: 18, nameBn: 'কাদ আফলাহা', nameAr: 'قَدْ أَفْلَحَ' },
  { no: 19, nameBn: 'ওয়া ক্বালাল্লাজিনা', nameAr: 'وَقَالَ الَّذِينَ' },
  { no: 20, nameBn: 'আম্মান খালাকা', nameAr: 'أَمَّنْ خَلَقَ' },
  { no: 21, nameBn: 'উতলু মা উহিয়া', nameAr: 'اتْلُ مَا أُوحِيَ' },
  { no: 22, nameBn: 'ওয়া মাইঁ ইয়াকনুত', nameAr: 'وَمَنْ يَقْنُتْ' },
  { no: 23, nameBn: 'ওয়া মা লিয়া', nameAr: 'وَمَا لِيَ' },
  { no: 24, nameBn: 'ফামান আজলামু', nameAr: 'فَمَنْ أَظْلَمُ' },
  { no: 25, nameBn: 'ইলাইহি য়ুরাদদু', nameAr: 'إِلَيْهِ يُرَدُّ' },
  { no: 26, nameBn: 'হা-মীম', nameAr: 'حم' },
  { no: 27, nameBn: 'ক্বালা ফামা খাতবুকুম', nameAr: 'قَالَ فَمَا خَطْبُكُمْ' },
  { no: 28, nameBn: 'কাদ সামি’আল্লাহ', nameAr: 'قَدْ سَمِعَ اللَّهُ' },
  { no: 29, nameBn: 'তাবারাকাল্লাজি', nameAr: 'تَبَارَكَ الَّذِي' },
  { no: 30, nameBn: '‘আম্মা ইয়াতাসা’আলূন', nameAr: 'عَمَّ يَتَسَاءَلُونَ' }
];

export const StudentDashboard: React.FC = () => {
  const { user, apiCall } = useAuth();
  const [student, setStudent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParaIndex, setSelectedParaIndex] = useState<number | null>(null);

  const studentId = user.linkedStudentIds?.[0] || 'std_001';

  useEffect(() => {
    const fetchStudentProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiCall(`/api/v1/students/${studentId}`);
        setStudent(data);
      } catch (err: any) {
        console.error('Failed to load student profile:', err);
        setError(err.message || 'শিক্ষার্থীর তথ্য লোড করা যায়নি।');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="h-44 bg-[#E2DBD0] border border-[#17161A]/10 rounded-[2px] animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-[#E2DBD0] border border-[#17161A]/10 rounded-[2px] animate-pulse"></div>
          <div className="h-32 bg-[#E2DBD0] border border-[#17161A]/10 rounded-[2px] animate-pulse"></div>
          <div className="h-32 bg-[#E2DBD0] border border-[#17161A]/10 rounded-[2px] animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8 text-center bg-[#FAF8F5] border border-[#93321F] rounded-[2px] max-w-md mx-auto my-12 space-y-3">
        <AlertCircle className="w-8 h-8 text-[#93321F] mx-auto" />
        <h3 className="text-base font-bold text-[#17161A] font-bangla-display">তথ্য পাওয়া যায়নি</h3>
        <p className="text-xs text-[#4A4A52]">{error || 'কোনো শিক্ষার্থী প্রোফাইল পাওয়া যায়নি।'}</p>
      </div>
    );
  }

  const attRate = student.attendanceStats?.rate ?? 100;
  const recentHifz = student.recentHifz?.[0];
  const recentFee = student.feeInvoices?.[0];
  const completedParas = student.hifzSummary?.completedParas ?? (recentHifz?.sabaq_para ? Math.max(1, recentHifz.sabaq_para - 1) : 4);
  const currentPara = recentHifz?.sabaq_para || (completedParas + 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 page-enter">
      {/* 4A Hero Header: Kitabkhana Paper & Ink Binding */}
      <div className="border border-[#17161A] bg-[#FAF8F5] p-6 sm:p-8 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#17161A]/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2A44] mb-1 font-ui">
              <span className="w-2 h-2 rounded-[999px] bg-[#93321F]"></span>
              <span>শিক্ষার্থী পোর্টাল</span>
              <span className="text-[#17161A]/30">/</span>
              <span>{student.class_name_bn || 'হিফজুল কুরআন বিভাগ'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17161A] font-bangla-display tracking-tight">
              {student.full_name_bn}
            </h1>
            <p className="text-xs text-[#4A4A52] mt-1 font-ui">
              দাখেলা নম্বর: <span className="text-[#17161A] font-semibold">{student.student_id_number}</span> • রোল: <span className="text-[#17161A] font-semibold">{student.roll_number}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-[#4A4A52] font-ui">হিফজ অগ্রগতি</div>
              <div className="text-base font-bold text-[#1F2A44] font-ui">{completedParas} / ৩০ পারা সম্পন্ন</div>
            </div>
            <div className="w-12 h-12 rounded-[999px] bg-[#1F2A44] text-[#E9E3D5] flex items-center justify-center text-lg font-bold font-bangla-display border border-[#17161A]">
              {student.full_name_bn?.charAt(0) || 'তা'}
            </div>
          </div>
        </div>

        {/* 4A Hero: The 1–30 Para Hifz Journey Route with authentic Rub el Hizb (۞) */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#17161A] font-bangla-display flex items-center gap-2">
                <span>হিফজ সফর: ৩০ পারা মঞ্জিল পথপরিক্রমা</span>
              </h2>
              <p className="text-xs text-[#4A4A52] mt-0.5">
                প্রতিটি মনজিল স্টেশন রুব আল-হিযব (۞) প্রতীকে চিহ্নিত। চলমান সবক ও উত্তীর্ণ পারার নির্ভুল চিত্র।
              </p>
            </div>
            <div className="text-right text-xs font-ui text-[#1F2A44]">
              {Math.round((completedParas / 30) * 100)}% সম্পন্ন
            </div>
          </div>

          {/* 30 Stations Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
            {QURAN_30_PARAS.map((para) => {
              const isCompleted = para.no <= completedParas;
              const isCurrent = para.no === currentPara;
              const isSelected = selectedParaIndex === para.no;

              return (
                <button
                  key={para.no}
                  type="button"
                  onClick={() => setSelectedParaIndex(para.no === selectedParaIndex ? null : para.no)}
                  title={`পারা ${para.no}: ${para.nameBn} (${para.nameAr})`}
                  className={`relative p-2 text-center rounded-[2px] border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#93321F] bg-[#93321F]/10 text-[#93321F] font-bold shadow-[0_0_0_1px_#93321F]'
                      : isCompleted
                      ? 'border-[#1F2A44] bg-[#1F2A44] text-[#E9E3D5]'
                      : 'border-[#17161A]/20 bg-[#FAF8F5] text-[#17161A]/60 hover:border-[#17161A]/50'
                  } ${isSelected ? 'ring-2 ring-[#93321F]' : ''}`}
                >
                  <div className="rub-el-hizb text-base leading-none">۞</div>
                  <div className="text-[11px] font-bold font-ui mt-1">{para.no}</div>
                  <div className="text-[9px] truncate font-ui opacity-90">{para.nameAr}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Para Quick Info */}
          {selectedParaIndex && (
            <div className="mt-3 p-3 bg-[#E9E3D5] border border-[#17161A]/30 rounded-[2px] text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#17161A]">পারা {selectedParaIndex}:</span>{' '}
                <span className="text-[#1F2A44] font-semibold">{QURAN_30_PARAS[selectedParaIndex - 1].nameBn}</span>{' '}
                <span className="font-amiri text-sm">({QURAN_30_PARAS[selectedParaIndex - 1].nameAr})</span>
              </div>
              <div className="text-xs font-semibold">
                {selectedParaIndex <= completedParas ? (
                  <span className="text-[#1F2A44]">✓ ইয়াদ সম্পন্ন</span>
                ) : selectedParaIndex === currentPara ? (
                  <span className="text-[#93321F]">● বর্তমান পাঠ্য সবক</span>
                ) : (
                  <span className="text-[#4A4A52]">অপেক্ষমাণ মনজিল</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Split: Details on Left + Memorable Margin Note (প্রান্তটীকা) Column on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Academic & Administrative Data (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics Table (Function Over Form) */}
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <h3 className="text-sm font-bold text-[#17161A] font-bangla-display pb-3 border-b border-[#17161A]/20">
              দৈনিক পর্যবেক্ষণ ও সামগ্রিক অবস্থান
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="border-l-2 border-[#1F2A44] pl-3">
                <div className="text-xs text-[#4A4A52] font-ui">উপস্থিতি হার</div>
                <div className="text-2xl font-bold text-[#17161A] font-ui mt-0.5">{attRate}%</div>
                <div className="text-[11px] text-[#4A4A52] font-ui">
                  {student.attendanceStats?.presentDays || 0} দিন উপস্থিতি / মোট {student.attendanceStats?.totalDays || 0}
                </div>
              </div>

              <div className="border-l-2 border-[#1F2A44] pl-3">
                <div className="text-xs text-[#4A4A52] font-ui">বর্তমান সবক পারা</div>
                <div className="text-2xl font-bold text-[#17161A] font-ui mt-0.5">পারা {currentPara}</div>
                <div className="text-[11px] text-[#4A4A52] font-ui">
                  {recentHifz?.sabaq_surah ? `সূরা ${recentHifz.sabaq_surah}` : 'চলমান পাঠ'}
                </div>
              </div>

              <div className="border-l-2 border-[#1F2A44] pl-3">
                <div className="text-xs text-[#4A4A52] font-ui">বেতন ও ফি অবস্থা</div>
                <div className="text-2xl font-bold text-[#17161A] font-ui mt-0.5">
                  {recentFee && recentFee.due_amount > 0 ? `৳${recentFee.due_amount}` : 'পরিশোধিত'}
                </div>
                <div className="text-[11px] text-[#4A4A52] font-ui">
                  {recentFee ? `${recentFee.month} ${recentFee.year}` : 'সর্বশেষ হিসাব হালনাগাদ'}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Sabaq & Memorization Session Record */}
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <h3 className="text-sm font-bold text-[#17161A] font-bangla-display pb-3 border-b border-[#17161A]/20 flex items-center justify-between">
              <span>আজকের সবক ও মনজিল পাঠ</span>
              <span className="text-xs text-[#4A4A52] font-ui font-normal">{recentHifz?.date || 'আজ'}</span>
            </h3>

            {recentHifz ? (
              <div className="pt-3 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#E9E3D5]/50 p-3 rounded-[2px] border border-[#17161A]/10">
                  <div>
                    <span className="text-[#4A4A52] block text-[11px]">পারা:</span>
                    <span className="font-bold text-[#17161A]">{recentHifz.sabaq_para}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4A52] block text-[11px]">সূরা:</span>
                    <span className="font-bold text-[#17161A]">{recentHifz.sabaq_surah}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4A52] block text-[11px]">আয়াত পরিধি:</span>
                    <span className="font-bold text-[#17161A]">{recentHifz.sabaq_ayah_range || '১-২০'}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4A52] block text-[11px]">পৃষ্ঠা সংখ্যা:</span>
                    <span className="font-bold text-[#17161A]">{recentHifz.sabaq_pages || 1} পৃষ্ঠা</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 border border-[#17161A]/15 rounded-[2px]">
                    <span className="text-xs font-bold text-[#17161A] block mb-1">সবকী হিসাব</span>
                    <p className="text-[#4A4A52]">ভুল সংখ্যা: {recentHifz.sabqi_mistakes || 0}টি</p>
                  </div>
                  <div className="p-3 border border-[#17161A]/15 rounded-[2px]">
                    <span className="text-xs font-bold text-[#17161A] block mb-1">মনজিল পাঠ</span>
                    <p className="text-[#4A4A52]">আটকানো / ভুল: {recentHifz.manzil_mistakes || 0}টি</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#4A4A52] py-4">আজকের হিফজ সবক এখনো লিপিবদ্ধ করা হয়নি।</p>
            )}
          </div>

          {/* Residential Bed & Guardian Information */}
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <h3 className="text-sm font-bold text-[#17161A] font-bangla-display pb-3 border-b border-[#17161A]/20">
              আবাসন ও অভিভাবক নথিপত্র
            </h3>
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#4A4A52] block text-[11px]">অভিভাবকের নাম:</span>
                <span className="font-semibold text-[#17161A]">{student.guardian_name_bn}</span> ({student.guardian_relation})
              </div>
              <div>
                <span className="text-[#4A4A52] block text-[11px]">জরুরি যোগাযোগ:</span>
                <span className="font-semibold text-[#17161A] font-ui">{student.guardian_phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#4A4A52] block text-[11px]">আবাসন স্থিতি:</span>
                {student.is_residential ? (
                  <span className="font-semibold text-[#1F2A44]">
                    আবাসিক শিক্ষার্থী {student.hostelBed ? `(${student.hostelBed.buildingName}, কক্ষ নং ${student.hostelBed.roomNumber}, বেড নং ${student.hostelBed.bedNumber})` : ''}
                  </span>
                ) : (
                  <span className="text-[#4A4A52]">অনাবাসিক (সাধারণ ডে-কেয়ার)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 4A Memorable Margin Note (প্রান্তটীকা) Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <div className="pb-3 border-b border-[#17161A]/20">
              <span className="text-[11px] font-bold text-[#93321F] uppercase font-ui tracking-wider block">
                حاشية المخطوطة
              </span>
              <h3 className="text-base font-bold text-[#17161A] font-bangla-display mt-0.5">
                প্রান্তটীকা (উস্তাদের পর্যবেক্ষণ ও লক্ষ্য)
              </h3>
            </div>

            <div className="pt-4 space-y-4">
              {/* Teacher's Correction Note in Madder */}
              <div className="margin-note border-l-2 border-[#93321F] pl-3 py-1">
                <div className="text-[11px] font-bold text-[#93321F] font-ui">ভুল ও সংশোধন নির্দেশিকা</div>
                <p className="text-xs text-[#17161A] mt-1">
                  {recentHifz?.sabqi_mistakes && recentHifz.sabqi_mistakes > 0
                    ? `সবকীতে ${recentHifz.sabqi_mistakes}টি জায়গায় হরকত ও মাদ্দের ভুল চিহ্নিত হয়েছে। বিশেষ করে তাশদীদের স্থানে মনোযোগ কাম্য।`
                    : 'সবক নির্ভুল এবং তাশদীদের উচ্চারণ সন্তোষজনক। তাজবীদ অনুযায়ী মাদ্দের টান যথাযথ রয়েছে।'}
                </p>
              </div>

              {/* Tomorrow's Goal */}
              <div className="margin-note border-l-2 border-[#1F2A44] pl-3 py-1">
                <div className="text-[11px] font-bold text-[#1F2A44] font-ui">আগামীকালের লক্ষ্য</div>
                <p className="text-xs text-[#17161A] mt-1">
                  পারা {currentPara}-এর পরবর্তী ১ পৃষ্ঠা সবক ইয়াদ ও পেছনের ৫ পৃষ্ঠা সবকী মজবুতভাবে তিলাওয়াত করা।
                </p>
              </div>

              {/* Ustaz remarks */}
              <div className="margin-note border-l-2 border-[#4A4A52] pl-3 py-1">
                <div className="text-[11px] font-bold text-[#4A4A52] font-ui">উস্তাদের সরাসরি মন্তব্য</div>
                <p className="text-xs text-[#17161A] mt-1 italic">
                  "{recentHifz?.teacher_notes || 'মাশাআল্লাহ, একাগ্রতা ও পড়ার মান ধরে রাখলে দ্রুত হিফজ সম্পন্ন হবে।'}"
                </p>
                <div className="text-[10px] text-[#4A4A52] mt-1 font-ui">
                  — হাফেজ মাওলানা আহমদ উল্লাহ (হিফজ শিক্ষক)
                </div>
              </div>

              {/* Activity Timeline Mini List */}
              {student.timeline && student.timeline.length > 0 && (
                <div className="pt-3 border-t border-[#17161A]/10">
                  <div className="text-[11px] font-bold text-[#17161A] mb-2 font-ui">সাম্প্রতিক কার্যক্রম</div>
                  <div className="space-y-2 text-xs">
                    {student.timeline.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="pb-1 border-b border-[#17161A]/5 last:border-0">
                        <div className="font-semibold text-[#17161A]">{item.title}</div>
                        <div className="text-[10px] text-[#4A4A52] font-ui">{item.date} • {item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
