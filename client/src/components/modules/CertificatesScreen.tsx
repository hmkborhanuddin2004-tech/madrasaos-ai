import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Award, Printer, CheckCircle2, QrCode, FileText } from 'lucide-react';

export const CertificatesScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const { settings, getDesignationLabel } = useSettings();
  const [studentId, setStudentId] = useState('std_001');
  const [certType, setCertType] = useState<'student_certificate' | 'transfer_certificate' | 'hifz_sanad'>('student_certificate');
  const [certificateData, setCertificateData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await apiCall('/api/v1/certificates/generate', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          certificateType: certType
        })
      });
      setCertificateData(data);
    } catch (err) {
      alert('প্রত্যয়নপত্র প্রস্তুত করতে সমস্যা হয়েছে।');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <span>অফিসিয়াল প্রশংসাপত্র ও হিফজ সনদপত্র জেনারেটর</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            কিউআর কোড ভেরিফিকেশনসহ স্বয়ংক্রিয় প্রত্যয়নপত্র, ছাড়পত্র ও হিফজ সমাপনী সনদ প্রস্তুত করুন
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">শিক্ষার্থী নির্বাচন</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-semibold"
            >
              <option value="std_001">আব্দুল্লাহ আল-মামুন (কাফিয়া জামাত)</option>
              <option value="std_002">মুহাম্মদ ফারুক (নাহবেমীর জামাত)</option>
              <option value="std_003">আবু বকর সিদ্দিক (হেদায়াতুন্নাহু জামাত)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">সনদের ধরন</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-semibold"
            >
              <option value="student_certificate">অধ্যয়নরত প্রশংসাপত্র (Student Certificate)</option>
              <option value="transfer_certificate">ছাড়পত্র (Transfer Certificate)</option>
              <option value="hifz_sanad">হিফজ সমাপনী সনদপত্র (Hifz Sanad)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isGenerating ? 'প্রস্তুত হচ্ছে...' : 'সনদ প্রস্তুত করুন'}
            </button>
          </div>
        </div>
      </div>

      {/* Official Certificate Layout Preview */}
      {certificateData && (
        <div className="bg-white rounded-3xl border-2 border-emerald-900/60 p-8 shadow-xl max-w-3xl mx-auto space-y-6 relative overflow-hidden">
          {/* Subtle Islamic Border Accent */}
          <div className="absolute inset-2 border-2 border-dashed border-emerald-600/30 rounded-2xl pointer-events-none"></div>

          {/* Header */}
          <div className="text-center space-y-1 relative">
            <div className="font-arabic text-emerald-800 text-sm">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <h1 className="text-xl font-bold text-primary-950 font-bangla">
              {settings.nameBn || certificateData?.metadata?.institutionNameBn || 'মাদ্রাসা'}
            </h1>
            <div className="text-xs text-slate-600">
              {settings.address || 'ঢাকা'} • ফোন: {settings.phone || '০১৭১১১১১১১১'}
            </div>
            <div className="inline-block bg-emerald-100 text-emerald-900 text-xs font-bold px-4 py-1 rounded-full mt-2 border border-emerald-300">
              {certType === 'hifz_sanad'
                ? 'হিফজুল কুরআন সমাপনী সনদপত্র'
                : certType === 'transfer_certificate'
                ? 'মাদ্রাসা ছাড়পত্র (Transfer Certificate)'
                : 'অধ্যয়নরত প্রশংসাপত্র'}
            </div>
          </div>

          {/* Certificate Body Text */}
          <div className="text-xs text-slate-800 leading-relaxed space-y-3 px-4 text-justify">
            <p>
              এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, জনাব <strong>{certificateData.metadata.guardianNameBn}</strong>-এর সুপুত্র{' '}
              <strong>{certificateData.metadata.studentNameBn}</strong> (ছাত্র আইডি নং: {certificateData.metadata.studentIdNumber}) এই মাদ্রাসার{' '}
              <strong>{certificateData.metadata.classNameBn}</strong>-এর একজন নিয়মিত ও চরিত্রবান শিক্ষার্থী।
            </p>
            <p>
              মাদ্রাসায় অধ্যয়নকালীন সময়ে তাহার চাল-চলন, আচার-ব্যবহার, শিক্ষকদের প্রতি ভক্তি ও পড়াশোনার অগ্রগতি অত্যন্ত সন্তোষজনক ছিল। তাহার বিরুদ্ধে কোনো প্রকার বিশৃঙ্খলা বা শৃঙ্খলাভঙ্গের অভিযোগ পরিলক্ষিত হয় নাই।
            </p>
            {certType === 'hifz_sanad' && (
              <p className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 font-medium">
                আলহামদুলিল্লাহ, শিক্ষার্থী অত্র মাদ্রাসার হিফজুল কুরআন বিভাগ হইতে ৩০ পারা পবিত্র কুরআনুল কারীম তাজবীদসহকারে সহীহ শুদ্ধরূপে হিফজ সমাপ্ত করিয়া অত্র সম্মাননা সনদপত্র অর্জনের গৌরব লাভ করিয়াছে।
              </p>
            )}
            <p>আমরা তাহার ইহকাল ও পরকালের সর্বাঙ্গীন কল্যাণ ও উত্তরোত্তর সফলতা কামনা করি।</p>
          </div>

          {/* Verification & Signatures */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between px-4">
            {/* QR Verification Box */}
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="text-[10px] space-y-0.5">
                <div className="font-bold text-slate-800">ডিজিটাল ভেরিফিকেশন</div>
                <div className="font-mono text-emerald-700 font-bold">{certificateData.certificateNumber}</div>
                <div className="text-slate-500">স্ক্যান করে সতত্যা যাচাই করুন</div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="text-center space-y-1">
              <div className="w-36 border-b border-slate-700 mx-auto"></div>
              <div className="font-bold text-xs text-slate-900">{getDesignationLabel('muhtamim') || 'মুহতামিম / অধ্যক্ষ'}</div>
              <div className="text-[10px] text-slate-500">{settings.nameBn || 'মাদ্রাসা'}</div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>মুদ্রণ / ডাউনলোড করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
