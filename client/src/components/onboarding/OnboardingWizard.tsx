import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, ArrowRight, Sparkles, Building, BookOpen, Bed, GraduationCap, X } from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { apiCall } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedModels, setSelectedModels] = useState<string[]>(['qawmi', 'hifz', 'boarding']);
  const [selectedJamaats, setSelectedJamaats] = useState<string[]>([
    'নাহবেমীর', 'হেদায়াতুন্নাহু', 'কাফিয়া', 'মিশকাতুল মাসাবীহ', 'দাওরায়ে হাদীস'
  ]);
  const [hifzMethod, setHifzMethod] = useState<'sabaq_sabqi_manzil' | 'daily_sabaq_only'>('sabaq_sabqi_manzil');
  const [hostelCapacity, setHostelCapacity] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleModel = (id: string) => {
    if (selectedModels.includes(id)) {
      setSelectedModels(selectedModels.filter((m) => m !== id));
    } else {
      setSelectedModels([...selectedModels, id]);
    }
  };

  const toggleJamaat = (name: string) => {
    if (selectedJamaats.includes(name)) {
      setSelectedJamaats(selectedJamaats.filter((j) => j !== name));
    } else {
      setSelectedJamaats([...selectedJamaats, name]);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      await apiCall('/api/v1/onboarding/step', {
        method: 'POST',
        body: JSON.stringify({
          step: 2,
          answers: {
            models: selectedModels,
            qawmiJamaats: selectedJamaats,
            hifzTrackingMethod: hifzMethod,
            hostelCapacity
          }
        })
      });

      await apiCall('/api/v1/onboarding/finalize', {
        method: 'POST'
      });

      onComplete();
      onClose();
    } catch (err) {
      console.error('Failed to finalize onboarding:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = step === 1 ? 35 : step === 2 ? 75 : 100;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary-900 via-emerald-900 to-primary-950 text-white flex items-center justify-between border-b border-primary-800">
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span>স্মার্ট প্রতিষ্ঠান কনফিগারেশন উইজার্ড</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
              আপনার মাদ্রাসার সিস্টেম সেটআপ করুন
            </h2>
          </div>
          <button onClick={onClose} className="text-emerald-300/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
          <div
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs text-primary-900 leading-relaxed flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  AI
                </div>
                <div>
                  <div className="font-bold mb-1">আসসালামু আলাইকুম!</div>
                  মাদ্রাসাOS এআই আপনার প্রতিষ্ঠানের শিক্ষা ব্যবস্থা অনুযায়ী নিজে কনফিগার হয়ে যাবে। আপনার প্রতিষ্ঠানে কোন কোন বিভাগ চালু রয়েছে নির্বাচন করুন:
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'qawmi', title: 'কওমী মাদ্রাসা শিক্ষা', desc: 'নাহবেমীর, কাফিয়া, মিশকাত, দাওরায়ে হাদীস', icon: BookOpen },
                  { id: 'hifz', title: 'হিফজুল কুরআন বিভাগ', desc: 'সবক, সবকী, মঞ্জিল ও প্যারা ট্র্যাকিং', icon: GraduationCap },
                  { id: 'boarding', title: 'আবাসিক ছাত্রাবাস', desc: 'হোস্টেল রুম, বেড বরাদ্দ ও খানা হিসাব', icon: Bed },
                  { id: 'alia', title: 'আলিয়া মাদ্রাসা কারিকুলাম', desc: 'দাখিল, আলিম ও বোর্ড সম্পর্কিত শ্রেণি', icon: Building }
                ].map((item) => {
                  const isChecked = selectedModels.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleModel(item.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {selectedModels.includes('qawmi') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    কওমী বিভাগের শ্রেণি (জামাত) সমূহ নির্বাচন করুন:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['নাহবেমীর', 'হেদায়াতুন্নাহু', 'কাফিয়া', 'শরহে জামী', 'মিশকাতুল মাসাবীহ', 'দাওরায়ে হাদীস'].map((j) => {
                      const isSel = selectedJamaats.includes(j);
                      return (
                        <button
                          key={j}
                          onClick={() => toggleJamaat(j)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            isSel
                              ? 'bg-emerald-700 text-white border-emerald-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isSel ? '✓ ' : '+ '}
                          {j}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedModels.includes('hifz') && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    হিফজ মূল্যায়ন পদ্ধতি:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setHifzMethod('sabaq_sabqi_manzil')}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        hifzMethod === 'sabaq_sabqi_manzil'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>সবক + সবকী + মঞ্জিল (প্রস্তাবিত)</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-1">পূর্ণাঙ্গ প্যারাহ ও ভুল ট্র্যাকিং</div>
                    </button>
                    <button
                      onClick={() => setHifzMethod('daily_sabaq_only')}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        hifzMethod === 'daily_sabaq_only'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>শুধু দৈনিক সবক</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-1">সহজ দৈনিক পৃষ্ঠা হিসাব</div>
                    </button>
                  </div>
                </div>
              )}

              {selectedModels.includes('boarding') && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    ছাত্রাবাসের প্রাথমিক ধারণক্ষমতা (সিট সংখ্যা):
                  </label>
                  <input
                    type="number"
                    value={hostelCapacity}
                    onChange={(e) => setHostelCapacity(parseInt(e.target.value) || 10)}
                    className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-900 text-white rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm mb-2">
                  <Sparkles className="w-4 h-4 text-accent-gold" />
                  <span>এআই কনফিগারেশন সারসংক্ষেপ</span>
                </div>
                <p className="text-emerald-100 leading-relaxed">
                  আপনার নির্বাচিত মডেল অনুযায়ী মাদ্রাসাOS এআই প্রস্তুত করা হয়েছে:
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-emerald-800/80 p-2 rounded-lg">
                    <span className="text-emerald-300 font-bold">সক্রিয় বিভাগ:</span>{' '}
                    {selectedModels.join(', ')}
                  </div>
                  <div className="bg-emerald-800/80 p-2 rounded-lg">
                    <span className="text-emerald-300 font-bold">মোট শ্রেণি (জামাত):</span>{' '}
                    {selectedJamaats.length}টি
                  </div>
                  <div className="bg-emerald-800/80 p-2 rounded-lg">
                    <span className="text-emerald-300 font-bold">হিফজ পদ্ধতি:</span> সবক+সবকী+মঞ্জিল
                  </div>
                  <div className="bg-emerald-800/80 p-2 rounded-lg">
                    <span className="text-emerald-300 font-bold">স্বয়ংক্রিয় অটোমেশন:</span> ২০টি রেডিমেড ওয়ার্কফ্লো
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                "চূড়ান্ত করুন" বাটনে ক্লিক করলে সিস্টেম স্বয়ংক্রিয়ভাবে ক্লাস, ডেটাবেজ ও উস্তাদদের রোলসমূহ সক্রিয় করে দেবে।
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              পূর্ববর্তী ধাপ
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>পরবর্তী ধাপ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-primary-700 hover:from-emerald-500 hover:to-primary-600 text-white px-6 py-2 rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'প্রস্তুত হচ্ছে...' : 'সিস্টেম সক্রিয় ও চূড়ান্ত করুন'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
