import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Printer, RefreshCw, Eye } from 'lucide-react';

export interface Student {
  id?: string;
  name: string;
  name_en?: string;
  code: string;
  roll: string;
  class_name: string;
  session_year?: string;
  department?: string;
  avatar_url?: string;
  photo_url?: string;
  is_residential?: boolean;
}

export interface Guardian {
  name: string;
  phone: string;
  relation?: string;
}

export interface InstitutionSettings {
  name_bn: string;
  name_en: string;
  name_ar?: string;
  address: string;
  phone?: string;
  logo_url?: string;
  principal_name?: string;
}

export interface StudentIdCardProps {
  student?: Partial<Student>;
  guardian?: Partial<Guardian> | null;
  institution?: Partial<InstitutionSettings>;
  studentName?: string;
  rollNumber?: string | number;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
  bloodGroup?: string;
  institutionName?: string;
  qrUrl?: string;
  qrDataUrl?: string;
  showBackDefault?: boolean;
  onEditPhoto?: () => void;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({
  student = {},
  guardian = null,
  institution = {},
  studentName,
  rollNumber,
  className,
  guardianName,
  guardianPhone,
  bloodGroup,
  institutionName,
  qrUrl,
  qrDataUrl,
  showBackDefault = false,
  onEditPhoto
}) => {
  const [viewMode, setViewMode] = React.useState<'side_by_side' | 'front' | 'back'>(
    showBackDefault ? 'back' : 'side_by_side'
  );
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Student Photo source
  const studentPhoto = student.avatar_url || student.photo_url || '';
  const studentDisplayName =
    studentName ||
    student.name_en ||
    student.name ||
    (student as any).full_name_bn ||
    (student as any).full_name_en ||
    'মুহাম্মদ শিক্ষার্থী';
  const fatherName =
    guardianName ||
    guardian?.name ||
    (student as any).guardian_name_bn ||
    'জনাব অভিভাবক';
  const studentClassName =
    className ||
    student.class_name ||
    (student as any).class_name_bn ||
    'হিফজ বিভাগ';
  const rollFormatted = String(
    rollNumber !== undefined && rollNumber !== null ? rollNumber :
    (student.roll || (student as any).roll_number || '01')
  ).padStart(2, '0');
  const sessionYear = student.session_year || '২০২৬';
  const contactPhone =
    guardianPhone ||
    guardian?.phone ||
    (student as any).guardian_phone ||
    '০১৭১২-৩৪৫৬৭৮';

  const instTitle =
    institutionName ||
    institution.name_bn ||
    institution.name_en ||
    'জামিয়া ইসলামিয়া মডেল মাদ্রাসা';
  const instAddress = institution.address || 'মিরপুর, ঢাকা, বাংলাদেশ';
  const instArabic = institution.name_ar || 'مَدْرَسَةُ دَارِ الْعُلُومِ الإِسْلَامِيَّةِ';
  const instPhone = institution.phone || '01711-000000, 01811-000000';

  const studentCode = student.code || student.id || (student as any).student_id_number || 'STD-001';
  const qrSrc = qrDataUrl || qrUrl || `/api/v1/qr/student/${studentCode}?format=image`;

  // Download Front or Back as PNG
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const target = viewMode === 'back' ? backCardRef.current : frontCardRef.current;
      if (!target) return;
      const canvas = await html2canvas(target, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `ID-Card-${student.code || 'card'}-${viewMode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-6 select-none font-sans text-slate-800">
      
      {/* Top View Toggle Controls (Hidden during print) */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-2xl px-2 print:hidden gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('side_by_side')}
            className={`px-3 py-1.5 rounded-xl transition ${
              viewMode === 'side_by_side'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            উভয় পিঠ পাশাপাশি
          </button>
          <button
            type="button"
            onClick={() => setViewMode('front')}
            className={`px-3 py-1.5 rounded-xl transition ${
              viewMode === 'front'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            সামনের পিঠ (Front)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('back')}
            className={`px-3 py-1.5 rounded-xl transition ${
              viewMode === 'back'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            পেছনের পিঠ (Back)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onEditPhoto && (
            <button
              type="button"
              onClick={onEditPhoto}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ছবি পরিবর্তন</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'প্রসেস হচ্ছে...' : 'PNG ডাউনলোড'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Cards Area (Supports Side-by-Side and Individual Views) */}
      <div className="flex flex-wrap items-center justify-center gap-8 py-2 print:gap-4 print:py-0">
        
        {/* ======================================================== */}
        {/* FRONT SIDE OF ID CARD (Matching media_1790073156096.png) */}
        {/* ======================================================== */}
        {(viewMode === 'side_by_side' || viewMode === 'front') && (
          <div className="relative group flex flex-col items-center">
            {/* Realistic Lanyard Badge Holder Pouch Outer Shell */}
            <div className="p-3 bg-gradient-to-b from-slate-200/90 via-slate-100/70 to-slate-200/90 rounded-[28px] border-2 border-slate-300 shadow-2xl relative">
              {/* Top Hanging Tab with Punch Holes and Metal Clip Slot */}
              <div className="w-44 h-10 mx-auto bg-gradient-to-b from-slate-200 to-slate-300/80 border border-slate-300 rounded-t-2xl flex items-center justify-center gap-6 relative -mt-1 mb-1 shadow-inner">
                {/* Left Hole */}
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-400/80 shadow-inner"></div>
                {/* Center Capsule Hole with Metallic Clip */}
                <div className="w-14 h-3.5 rounded-full bg-slate-100 border border-slate-400/80 shadow-inner flex items-center justify-center relative">
                  <div className="w-5 h-2 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-xs border border-slate-400 shadow-xs"></div>
                </div>
                {/* Right Hole */}
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-400/80 shadow-inner"></div>
              </div>

              {/* Physical Card (308px x 480px, standard CR-80 54mm x 85.6mm aspect) */}
              <div
                ref={frontCardRef}
                id="student-id-card-front"
                className="w-[308px] h-[480px] bg-white rounded-xl shadow-lg overflow-hidden relative border border-slate-200/80 flex flex-col z-10 print:shadow-none print:border-slate-300"
                style={{ backgroundColor: '#ffffff' }}
              >
                {/* Top Vector Graphics Background matching user's front badge */}
                <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden pointer-events-none z-0">
                  <svg viewBox="0 0 308 190" className="w-full h-full" preserveAspectRatio="none">
                    {/* Deep forest green angled header polygon */}
                    <polygon points="0,0 308,0 308,125 0,78" fill="#005c29" />
                    {/* Dark green continuation behind photo */}
                    <polygon points="0,78 308,125 308,145 150,180 0,78" fill="#005c29" />
                    {/* Lime-green diagonal wedge on right */}
                    <polygon points="175,130 308,85 308,190 220,190" fill="#80c340" />
                  </svg>
                </div>

                {/* Right Side Lime Accent Wedge (Extending down the right) */}
                <div
                  className="absolute right-0 top-32 w-24 h-40 pointer-events-none z-0"
                  style={{
                    clipPath: 'polygon(100% 0, 0 45%, 100% 90%)',
                    backgroundColor: '#80c340'
                  }}
                ></div>

                {/* Header Text (Darul Ulom & Madrasah Name) */}
                <div className="relative z-10 pt-3 px-2 text-center space-y-0.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#ffd700]">
                    DARUL ULOM
                  </div>
                  <div className="text-[15px] font-black uppercase tracking-tight text-white leading-tight drop-shadow-xs font-sans">
                    {instTitle}
                  </div>
                  <div className="text-[8.5px] font-bold text-[#ffd700] leading-tight px-1">
                    {instAddress}
                  </div>
                </div>

                {/* Student Photo Section (Circular with Lime & Dark Green Crescent) */}
                <div className="relative z-10 flex justify-center mt-3">
                  <div className="relative w-[116px] h-[116px]">
                    {/* Lime-green crescent orbit rim on right */}
                    <div
                      className="absolute -inset-1 rounded-full pointer-events-none"
                      style={{
                        border: '6px solid #80c340',
                        clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
                      }}
                    ></div>

                    {/* Dark green photo frame ring */}
                    <div className="w-full h-full rounded-full border-4 border-[#005c29] bg-white overflow-hidden shadow-md flex items-center justify-center relative">
                      <img
                        src={studentPhoto || '/assets/id_card/taieaba_photo.png'}
                        alt={studentDisplayName}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          // Fallback to extracted authentic photo
                          (e.target as HTMLImageElement).src = '/assets/id_card/taieaba_photo.png';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Student Name */}
                <div className="relative z-10 text-center mt-2.5 px-2">
                  <h3 className="text-[20px] font-bold tracking-tight text-black font-serif">
                    {studentDisplayName}
                  </h3>
                </div>

                {/* Student Details Table (Clean Columnar Alignment with colons) */}
                <div className="relative z-10 px-6 mt-2 space-y-1 text-[13px] text-black font-serif">
                  <div className="flex items-center">
                    <span className="w-18 font-normal text-black">Father</span>
                    <span className="font-normal mr-2.5">:</span>
                    <span className="font-normal text-black truncate">{fatherName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-18 font-normal text-black">Class</span>
                    <span className="font-normal mr-2.5">:</span>
                    <span className="font-normal text-black">{studentClassName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-18 font-normal text-black">Roll No</span>
                    <span className="font-normal mr-2.5">:</span>
                    <span className="font-normal text-black">{rollFormatted}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-18 font-normal text-black">Session</span>
                    <span className="font-normal mr-2.5">:</span>
                    <span className="font-normal text-black">{sessionYear}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-18 font-normal text-black">Mobile</span>
                    <span className="font-normal mr-2.5">:</span>
                    <span className="font-normal text-black">{contactPhone}</span>
                  </div>
                  {studentBloodGroup && (
                    <div className="flex items-center">
                      <span className="w-18 font-normal text-black">Blood</span>
                      <span className="font-normal mr-2.5">:</span>
                      <span className="font-bold text-rose-700 text-xs font-sans">{studentBloodGroup}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Decorative Lime Wave & Principal Signature */}
                <div className="mt-auto relative w-full h-16 flex items-end justify-between px-5 pb-3">
                  {/* Bottom-left lime-green curved organic petal */}
                  <div
                    className="absolute left-0 bottom-0 w-20 h-20 pointer-events-none z-0"
                    style={{
                      backgroundColor: '#80c340',
                      borderTopRightRadius: '100%'
                    }}
                  ></div>

                  {/* Left spacing balance */}
                  <div className="w-14"></div>

                  {/* Bottom-right Principal Signature graphic */}
                  <div className="relative z-10 flex flex-col items-center text-right">
                    <img
                      src="/assets/id_card/principal_signature.png"
                      alt="Principal Signature"
                      className="w-20 h-9 object-contain -mb-1"
                    />
                    <div className="text-[10px] font-normal text-black font-serif tracking-tight">
                      Principal Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center text-[11px] font-bold text-slate-500 mt-2 print:hidden">
              সামনের পিঠ (Front Side)
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* BACK SIDE OF ID CARD (Matching media_1790073156093.png) */}
        {/* ======================================================= */}
        {(viewMode === 'side_by_side' || viewMode === 'back') && (
          <div className="relative group flex flex-col items-center">
            {/* Realistic Lanyard Badge Holder Pouch Outer Shell */}
            <div className="p-3 bg-gradient-to-b from-slate-200/90 via-slate-100/70 to-slate-200/90 rounded-[28px] border-2 border-slate-300 shadow-2xl relative">
              {/* Top Hanging Tab with Punch Holes and Metal Clip Slot */}
              <div className="w-44 h-10 mx-auto bg-gradient-to-b from-slate-200 to-slate-300/80 border border-slate-300 rounded-t-2xl flex items-center justify-center gap-6 relative -mt-1 mb-1 shadow-inner">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-400/80 shadow-inner"></div>
                <div className="w-14 h-3.5 rounded-full bg-slate-100 border border-slate-400/80 shadow-inner flex items-center justify-center relative">
                  <div className="w-5 h-2 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-xs border border-slate-400 shadow-xs"></div>
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-400/80 shadow-inner"></div>
              </div>

              {/* Physical Card (308px x 480px) */}
              <div
                ref={backCardRef}
                id="student-id-card-back"
                className="w-[308px] h-[480px] bg-white rounded-xl shadow-lg overflow-hidden relative border border-slate-200/80 flex flex-col z-10 print:shadow-none print:border-slate-300"
                style={{ backgroundColor: '#ffffff' }}
              >
                {/* Top Angled Canopy matching media_1790073156093.png */}
                <div className="relative w-full h-32 overflow-hidden z-0">
                  <svg viewBox="0 0 308 130" className="w-full h-full" preserveAspectRatio="none">
                    {/* White triangle cutout on top-left corner */}
                    <polygon points="0,0 25,0 0,35" fill="#ffffff" />
                    {/* Dark forest green header canopy */}
                    <polygon points="25,0 308,0 308,70 180,120 0,35" fill="#005c29" />
                    {/* Lime-green accent wedge on right */}
                    <polygon points="180,120 308,70 308,130" fill="#80c340" />
                  </svg>

                  {/* Circular Canopy Notch & Madrasa Logo Emblem */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[76px] h-[76px] rounded-full bg-white p-1 shadow-md flex items-center justify-center z-10 border-2 border-emerald-600">
                    <img
                      src="/assets/id_card/madrasa_logo.png"
                      alt="Madrasa Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>

                {/* Institutional Return Notice Section */}
                <div className="relative z-10 px-3 text-center space-y-0.5 mt-1">
                  <div className="text-[13px] font-normal text-black font-serif underline underline-offset-3">
                    If found Please Return to:
                  </div>

                  {/* Authentic Arabic Calligraphy Banner */}
                  <div className="flex justify-center py-1">
                    <img
                      src="/assets/id_card/arabic_calligraphy.png"
                      alt={instArabic}
                      className="h-7 object-contain"
                    />
                  </div>

                  <div className="text-[9px] font-bold uppercase tracking-wider text-black font-sans">
                    DARUL ULOM
                  </div>

                  <div className="text-[13.5px] font-black uppercase tracking-tight text-[#005c29] leading-tight font-sans">
                    {instTitle}
                  </div>

                  <div className="text-[9px] font-semibold text-black px-2 leading-tight font-sans">
                    {instAddress}
                  </div>

                  <div className="text-[8.5px] font-bold text-black font-sans tracking-tight pt-0.5">
                    Mobile: {instPhone}
                  </div>
                </div>

                {/* Centered QR Code with Cyan/Sky-Blue Border Box */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1">
                  <div className="p-1 bg-white border-[1.5px] border-[#00b4d8] rounded-xs shadow-xs flex items-center justify-center">
                    <img
                      src={qrSrc}
                      alt="Student Verification QR"
                      className="w-[108px] h-[108px] object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                {/* Bottom Lime Wave (Matching Front Side) */}
                <div className="relative w-full h-14 mt-auto">
                  <div
                    className="absolute left-0 bottom-0 w-20 h-20 pointer-events-none z-0"
                    style={{
                      backgroundColor: '#80c340',
                      borderTopRightRadius: '100%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-center text-[11px] font-bold text-slate-500 mt-2 print:hidden">
              পেছনের পিঠ (Back Side)
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
