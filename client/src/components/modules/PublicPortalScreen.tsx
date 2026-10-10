import React, { useState } from 'react';
import {
  CalendarCheck2,
  Receipt,
  Award,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Search,
  CheckCircle2,
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

interface PublicPortalScreenProps {
  onNavigateTab?: (tab: string) => void;
}

export const PublicPortalScreen: React.FC<PublicPortalScreenProps> = ({ onNavigateTab }) => {
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeStation, setActiveStation] = useState<number>(1);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyQuery.trim()) return;

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/v1/befaq/verify/${encodeURIComponent(verifyQuery.trim())}`);
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ verified: false, message: 'সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি।' });
    } finally {
      setIsVerifying(false);
    }
  };

  const coreModules = [
    {
      title: 'হিফজুল কুরআন ও কিতাব নেসাব',
      desc: '৩০ পারা মঞ্জিল ট্র্যাকিং, সবক-সবকী-আখতার হিসাব এবং কাফিয়া, হেদায়াতুন্নাহু ও দাওরায়ে হাদিস পাঠ অগ্রগতি।',
      tab: 'hifz'
    },
    {
      title: 'হাজিরা ও ছুটির ডিজিটাল খতিয়ান',
      desc: 'শিক্ষার্থী ও আসাতাজায়ে কেরামের দৈনিক হাজিরা, অনুপস্থিতি নজরদারি ও সরাসরি অভিভাবক অবহিতকরণ।',
      tab: 'attendance'
    },
    {
      title: 'বকেয়া ও বেতন হিসাব ব্যবস্থাপনা',
      desc: 'মাসিক ফি নির্ধারণ, রসিদ মুদ্রণ, খাতাভিত্তিক পৃথক লেজার এবং রিয়েল-টাইম দৈনিক ক্যাশ বুক বিবরণ।',
      tab: 'finance'
    },
    {
      title: 'বেফাক বোর্ড ও কেন্দ্রীয় পরীক্ষা',
      desc: 'মারহালাভিত্তিক নিবন্ধন, রোল ও রেজাল্ট শিট প্রস্তুতকরণ এবং ডিজিটাল সনদ যাচাইকরণ।',
      tab: 'befaq'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 page-enter">
      {/* 4A Hero: Manuscript Kitabkhana Canvas */}
      <div className="border border-[#17161A] bg-[#FAF8F5] p-6 sm:p-8 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#17161A]/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F2A44] mb-1 font-ui">
              <span className="w-2.5 h-2.5 rounded-[999px] bg-[#A87A2E] inline-block"></span>
              <span>দারুল উলুম মাদ্রাসা ব্যবস্থাপনা প্ল্যাটফর্ম</span>
              <span className="text-[#17161A]/30">/</span>
              <span>পাবলিক পোর্টাল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17161A] font-bangla-display tracking-tight">
              ইলমে ওহীর ঐতিহ্য ও আধুনিক প্রাতিষ্ঠানিক শৃঙ্খলা
            </h1>
            <p className="text-xs text-[#4A4A52] mt-1 max-w-2xl">
              কওমি ও আলিয়া মাদ্রাসার শিক্ষা কার্যক্রম, আবাসিক ছাত্রাবাস, হিফজ বিভাগ এবং অভ্যন্তরীণ হিসাবরক্ষণের নির্ভরযোগ্য ডিজিটাল সমাধান।
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('admissions')}
                className="px-4 py-2 bg-[#1F2A44] hover:bg-[#17161A] text-[#E9E3D5] text-xs font-bold rounded-[2px] border border-[#17161A] transition-all cursor-pointer font-ui"
              >
                নতুন ভর্তি আবেদন
              </button>
            )}
          </div>
        </div>

        {/* 4A Hero Route: 30 Stations Route marked with the Rub el Hizb (۞) */}
        <div className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="font-reem-kufi text-xs text-[#93321F] font-bold">رحلة حفظ القرآن الكريم</div>
              <h2 className="text-sm font-bold text-[#17161A] font-bangla-display flex items-center gap-2">
                হিফজ সফর: ৩০ পারা পথপরিক্রমা (১–৩০ পারা স্টেশন)
              </h2>
            </div>
            <div className="text-xs text-[#4A4A52] font-ui">
              প্রতিটি স্টেশনে ক্লিক করে পারার নাম ও বিস্তারিত দেখুন
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
            {QURAN_30_PARAS.map((para) => {
              const isSelected = activeStation === para.no;

              return (
                <button
                  key={para.no}
                  type="button"
                  onClick={() => setActiveStation(para.no)}
                  className={`p-2 text-center rounded-[2px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#93321F] bg-[#93321F] text-[#FAF8F5] font-bold shadow-[0_0_0_1px_#93321F]'
                      : 'border-[#17161A]/20 bg-[#FAF8F5] text-[#17161A]/70 hover:border-[#1F2A44] hover:text-[#1F2A44]'
                  }`}
                >
                  <div className="rub-el-hizb text-base leading-none">۞</div>
                  <div className="text-[11px] font-bold font-ui mt-1">{para.no}</div>
                  <div className="text-[9px] truncate font-ui opacity-90">{para.nameAr}</div>
                </button>
              );
            })}
          </div>

          {/* Active Station Detail Box */}
          <div className="mt-4 p-4 bg-[#E9E3D5] border border-[#17161A]/25 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-[#93321F] text-xs font-ui">স্টেশন #{activeStation}:</span>{' '}
              <span className="text-sm font-bold text-[#17161A]">{QURAN_30_PARAS[activeStation - 1].nameBn}</span>{' '}
              <span className="font-amiri text-base text-[#1F2A44] font-bold">({QURAN_30_PARAS[activeStation - 1].nameAr})</span>
              <div className="text-[11px] text-[#4A4A52] mt-0.5">
                হিফজুল কুরআন বিভাগের প্রতিটি শিক্ষার্থীর দৈনিক সবক, সবকী ও মনজিল এই ৩০ পারা সূচিপত্র অনুযায়ী সংরক্ষণ করা হয়।
              </div>
            </div>
            <div className="text-right whitespace-nowrap">
              <span className="px-2.5 py-1 bg-[#1F2A44] text-[#E9E3D5] text-[11px] font-bold rounded-[2px] font-ui">
                পাণ্ডুলিপি মারহালা
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Content (8 cols) + Right Margin Note Column (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Certificate / Befaq Fast Verification */}
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <h3 className="text-sm font-bold text-[#17161A] font-bangla-display pb-3 border-b border-[#17161A]/20 flex items-center justify-between">
              <span>ডিজিটাল সনদ ও ফলাফল যাচাই</span>
              <span className="text-xs text-[#4A4A52] font-ui">বেফাকুল মাদারিসিল আরাবিয়া</span>
            </h3>

            <div className="pt-4">
              <form onSubmit={handleVerify} className="flex gap-2">
                <input
                  type="text"
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  placeholder="সনদপত্র নম্বর বা রোল লিখুন (যেমন: BFQ-2026-001)"
                  className="flex-1 px-3 py-2 text-xs border border-[#17161A]/30 rounded-[2px] bg-white text-[#17161A] font-ui focus:ring-1 focus:ring-[#93321F] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !verifyQuery.trim()}
                  className="px-4 py-2 bg-[#1F2A44] hover:bg-[#17161A] text-[#E9E3D5] text-xs font-bold rounded-[2px] transition-all disabled:opacity-50 font-ui cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isVerifying ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}</span>
                </button>
              </form>

              {verifyResult && (
                <div className={`mt-3 p-3 rounded-[2px] border text-xs ${
                  verifyResult.verified 
                    ? 'bg-[#E9E3D5] border-[#1F2A44] text-[#17161A]' 
                    : 'bg-[#FAF8F5] border-[#93321F] text-[#93321F]'
                }`}>
                  {verifyResult.verified ? (
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-[#1F2A44]">
                        <CheckCircle2 className="w-4 h-4 text-[#1F2A44]" />
                        <span>সনদপত্রটি সত্য ও বৈধ হিসেবে নিশ্চিত হয়েছে</span>
                      </div>
                      <div className="text-[11px] text-[#4A4A52]">
                        শিক্ষার্থী: {verifyResult.data?.student_name_bn} • বিভাগ: {verifyResult.data?.marhala} • সন: {verifyResult.data?.exam_year}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#93321F]" />
                      <span>{verifyResult.message || 'উক্ত নম্বরের কোনো সনদ ডাটাবেজে পাওয়া যায়নি।'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Academic Modules Overview */}
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <h3 className="text-sm font-bold text-[#17161A] font-bangla-display pb-3 border-b border-[#17161A]/20">
              মাদ্রাসা পরিচালনা কাঠামোর প্রধান স্তম্ভসমূহ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {coreModules.map((mod, idx) => (
                <div key={idx} className="p-3.5 border border-[#17161A]/15 rounded-[2px] bg-white/60">
                  <div className="text-xs font-bold text-[#17161A] font-bangla-display mb-1">{mod.title}</div>
                  <p className="text-xs text-[#4A4A52] leading-relaxed">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: 4A Margin Note Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#17161A] bg-[#FAF8F5] p-5 rounded-[2px] shadow-[0_1px_0_rgba(23,22,26,0.08)]">
            <div className="pb-3 border-b border-[#17161A]/20">
              <span className="text-[11px] font-bold text-[#93321F] uppercase font-ui tracking-wider block">
                حاشية المخطوطة
              </span>
              <h3 className="text-base font-bold text-[#17161A] font-bangla-display mt-0.5">
                প্রান্তটীকা (পাঠপরিক্রমা নির্দেশিকা)
              </h3>
            </div>

            <div className="pt-4 space-y-4">
              <div className="margin-note border-l-2 border-[#93321F] pl-3 py-1">
                <div className="text-[11px] font-bold text-[#93321F] font-ui">পাণ্ডুলিপি মানদণ্ড</div>
                <p className="text-xs text-[#17161A] mt-1">
                  মাদ্রাসার সকল পরীক্ষা, হাজিরা ও হিফজের রেকর্ড ঐতিহ্যবাহী হস্তলিখিত পাণ্ডুলিপির নিয়মানুযায়ী মার্জিন ও প্রান্তটীকা দিয়ে সুনির্দিষ্ট করা হয়।
                </p>
              </div>

              <div className="margin-note border-l-2 border-[#1F2A44] pl-3 py-1">
                <div className="text-[11px] font-bold text-[#1F2A44] font-ui">ভর্তি ও দাখেলা বিজ্ঞপ্তি</div>
                <p className="text-xs text-[#17161A] mt-1">
                  নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম চলছে। কওমি কিতাব বিভাগ ও হিফজ শাখায় সীমিত আসনে শিক্ষার্থী বাছাই পরীক্ষা অনুষ্ঠিত হচ্ছে।
                </p>
              </div>

              <div className="margin-note border-l-2 border-[#4A4A52] pl-3 py-1">
                <div className="text-[11px] font-bold text-[#4A4A52] font-ui">কার্যালয় যোগাযোগ</div>
                <p className="text-xs text-[#17161A] mt-1 font-ui">
                  ফোন: ০১৭১১-১১১১১১<br />
                  ঠিকানা: প্লট ১৪, সেকশন ৬, মিরপুর, ঢাকা-১২১৬
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
