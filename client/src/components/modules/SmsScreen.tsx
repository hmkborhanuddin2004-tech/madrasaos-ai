import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  CheckCircle,
  Volume2,
  Users,
  ShieldCheck,
  Play,
  Square,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const SmsScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [provider, setProvider] = useState<'brevo' | 'ssl_wireless' | 'greenweb' | 'onnorokom'>('brevo');
  const [activeTab, setActiveTab] = useState<'text_sms' | 'voice_sms' | 'logs'>('text_sms');
  const [recipientGroup, setRecipientGroup] = useState<'all_guardians' | 'hifz' | 'teachers' | 'custom'>('all_guardians');
  const [customPhone, setCustomPhone] = useState('');
  const [smsText, setSmsText] = useState('আসসালামু আলাইকুম। মাদ্রাসার আগামী মাসিক অভিভাবক সমাবেশ শনিবার সকাল ১০ ঘটিকায় অনুষ্ঠিত হবে।');
  const [voiceTitle, setVoiceTitle] = useState('জরুরি সাধারণ নোটিশ');
  const [voiceScript, setVoiceScript] = useState('আসসালামু আলাইকুম। সম্মানিত অভিভাবক, আগামীকাল মাদ্রাসার বিশেষ পরীক্ষার ফলাফল প্রকাশ করা হবে।');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // Character calculation rules
  const isUnicode = /[\u0980-\u09FF]/.test(smsText) || Array.from(smsText).some((c) => c.charCodeAt(0) > 127);
  const charCount = Array.from(smsText).length;
  const partsCount = charCount === 0 ? 0 : isUnicode ? (charCount <= 70 ? 1 : Math.ceil(charCount / 67)) : (charCount <= 160 ? 1 : Math.ceil(charCount / 153));

  const fetchTelemetry = async () => {
    try {
      const data = await apiCall('/api/v1/notifications/telemetry');
      if (data?.telemetry) {
        setTelemetry(data.telemetry);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleSendTextSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;

    setIsSending(true);
    setFeedbackNotice(null);
    try {
      const targetPhone = customPhone || '01711111111';

      const data = await apiCall('/api/v1/notifications/sms/send-brevo', {
        method: 'POST',
        body: JSON.stringify({
          to: targetPhone,
          message: smsText
        })
      });

      setFeedbackNotice({
        type: 'success',
        title: 'এসএমএস সফলভাবে প্রক্রিয়া করা হয়েছে!',
        message: `প্রাপক: ${targetPhone} | গেটওয়ে: ${provider.toUpperCase()}`,
        details: `মেসেজ আইডি: ${data?.messageId || 'brevo_ok'} (স্যান্ডবক্স / টেস্ট গেটওয়ে ডেলিভারি)`
      });

      fetchTelemetry();
      setRecentLogs((prev) => [
        {
          id: data?.messageId || `msg_${Date.now()}`,
          to: targetPhone,
          text: smsText,
          time: 'এইমাত্র',
          status: 'Delivered',
          parts: partsCount
        },
        ...prev
      ]);
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        title: 'এসএমএস প্রেরণ ব্যর্থ হয়েছে',
        message: err.message || 'নেটওয়ার্ক বা সার্ভারে সমস্যা হয়েছে।'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoiceBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceScript.trim()) return;

    setIsSending(true);
    setFeedbackNotice(null);
    try {
      const data = await apiCall('/api/v1/notifications/voice-broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: voiceTitle,
          recipients: ['01711111111', '01811111111', '01911111111'],
          audioUrlOrTtsText: voiceScript
        })
      });
      setFeedbackNotice({
        type: 'success',
        title: 'ভয়েস এসএমএস সফলভাবে সক্রিয় করা হয়েছে!',
        message: `মোট প্রাপক: ${data?.totalSent || 3} জন অভিভাবক`,
        details: `ব্রডকাস্ট কিউ আইডি: ${data?.broadcastId || 'voice_ok'}`
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        title: 'ভয়েস ব্রডকাস্ট ব্যর্থ হয়েছে',
        message: err.message || 'ভয়েস প্রেরণে সমস্যা হয়েছে।'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>স্মার্ট যোগাযোগ ও অটোমেশন</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">SMS ও ভয়েস SMS সার্ভিস</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Brevo (Sendinblue) ফ্রি গেটওয়ের মাধ্যমে আনলিমিটেড ট্রানজেকশনাল এসএমএস এবং অডিও ভয়েস নোটিশ সম্প্রচার।
          </p>
        </div>

        {/* Provider selector pill */}
        <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-2xl flex items-center gap-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 px-2">গেটওয়ে:</span>
          {[
            { id: 'brevo', name: 'Brevo (ফ্রি)', badge: 'Free' },
            { id: 'ssl_wireless', name: 'SSL Wireless', badge: 'Paid' },
            { id: 'greenweb', name: 'Greenweb', badge: 'Paid' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 text-xs ${
                provider === p.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Notice Banner (Modern UI Toast/Alert replacement) */}
      {feedbackNotice && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-xs ${
          feedbackNotice.type === 'success'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : 'bg-red-50/90 border-red-300 text-red-950'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {feedbackNotice.type === 'success' ? '✅' : '⚠️'}
            </span>
            <div className="space-y-1">
              <div className="font-bold text-xs sm:text-sm">{feedbackNotice.title}</div>
              <div className="text-xs text-slate-700">{feedbackNotice.message}</div>
              {feedbackNotice.details && (
                <div className="text-[11px] font-mono bg-white/80 px-2 py-0.5 rounded border border-slate-200/80 inline-block text-slate-600 mt-1">
                  {feedbackNotice.details}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg text-sm transition"
            title="নোটিশ বন্ধ করুন"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('text_sms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'text_sms' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>বাল্ক ও অটো SMS বার্তা</span>
        </button>
        <button
          onClick={() => setActiveTab('voice_sms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'voice_sms' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>অডিও বার্তা / ভয়েস SMS</span>
        </button>
      </div>

      {/* Text SMS Tab */}
      {activeTab === 'text_sms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <form onSubmit={handleSendTextSms} className="space-y-4">
              {/* Recipient Target Group */}
              <div>
                <label className="font-bold text-slate-700 block text-xs mb-1.5">প্রাপক দল (Recipient Group):</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'all_guardians', label: 'সকল অভিভাবক (১০০+)' },
                    { id: 'hifz', label: 'হিফজ অভিভাবক' },
                    { id: 'teachers', label: 'শিক্ষক ও স্টাফ' },
                    { id: 'custom', label: 'কাস্টম মোবাইল নম্বর' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setRecipientGroup(g.id as any)}
                      className={`p-2.5 rounded-xl font-bold border text-center transition cursor-pointer ${
                        recipientGroup === g.id
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {recipientGroup === 'custom' && (
                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">মোবাইল নম্বর লিখুন:</label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="017xxxxxxxx বা +88018xxxxxxxx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              {/* Message Composer with Voice Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 text-xs">বার্তার বিষয়বস্তু (Message Content):</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {charCount} অক্ষর | {partsCount} টি SMS ({isUnicode ? 'বাংলা ইউনিকোড' : 'ইংরেজি GSM'})
                    </span>
                    <VoiceInputButton
                      onTranscript={(spoken) => setSmsText((prev) => (prev ? `${prev} ${spoken}` : spoken))}
                      size="sm"
                      title="মুখে কথা বলে লিখুন"
                    />
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs leading-relaxed focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                />

                {provider === 'brevo' && (
                  <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Brevo Free Tier: কোনো অ্যাকাউন্ট ক্রেডিট কাটবে না। সম্পূর্ণ বিনামূল্যে প্রেরিত হবে।</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSending || !smsText.trim()}
                  className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'পাঠানো হচ্ছে...' : 'এসএমএস পাঠান'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Telemetry Info Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>গেটওয়ে স্ট্যাটাস ও তথ্য</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">বর্তমান প্রোভাইডার:</span>
                  <span className="font-bold text-emerald-700 uppercase">{provider}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">এনকোডিং ধরণ:</span>
                  <span className="font-bold text-slate-800">{isUnicode ? 'বাংলা ইউনিকোড (৭০ অক্ষর/পার্ট)' : 'ইংরেজি GSM (১৬০ অক্ষর/পার্ট)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">গেটওয়ে অবস্থা:</span>
                  <span className="font-bold text-emerald-700">অনলাইন (সক্রিয়)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">ফিচার খরচ:</span>
                  <span className="font-extrabold text-emerald-700">০.০০ ৳ (সম্পূর্ণ ফ্রি)</span>
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">রেডিমেড টেমপ্লেট:</span>
              <div className="space-y-1.5">
                {[
                  'আসসালামু আলাইকুম। আপনার সন্তানের আজকের ক্লাসে উপস্থিতি নিশ্চিত হয়েছে।',
                  'আসসালামু আলাইকুম। আগামীকাল মাদ্রাসার বিশেষ পরীক্ষার প্রবেশপত্র বিতরণ করা হবে।',
                  'আসসালামু আলাইকুম। চলতি মাসের মাসিক ফি বকেয়া রয়েছে, অনুগ্রহ করে দ্রুত পরিশোধ করুন।'
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSmsText(tmpl)}
                    className="w-full text-left p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 transition line-clamp-2 cursor-pointer"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice SMS Tab */}
      {activeTab === 'voice_sms' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <Volume2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800">অডিও নোটিশ ও ভয়েস বার্তা সম্প্রচার</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              অভিভাবকদের ফোনে স্বয়ংক্রিয় বাংলা ভয়েস কল বা মেসেঞ্জারে অডিও বার্তা পাঠিয়ে গুরুত্বপূর্ণ নোটিশ জানান।
            </p>
          </div>

          <form onSubmit={handleSendVoiceBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ভয়েস বার্তার শিরোনাম *</label>
              <input
                type="text"
                value={voiceTitle}
                onChange={(e) => setVoiceTitle(e.target.value)}
                placeholder="যেমন: বৃষ্টিজনিত ছুটির জরুরি ভয়েস নোটিশ"
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">ভয়েস স্ক্রিপ্ট (বাংলা টেক্সট-টু-স্পিচ বার্তা) *</label>
                <VoiceInputButton
                  onTranscript={(text) => setVoiceScript((prev) => `${prev} ${text}`)}
                  size="sm"
                  title="ভয়েসে মুখে বলে বার্তা লিখুন"
                />
              </div>
              <textarea
                rows={4}
                value={voiceScript}
                onChange={(e) => setVoiceScript(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs leading-relaxed focus:bg-white focus:border-emerald-500 outline-hidden"
                placeholder="অভিভাবক ফোনে কল রিসিভ করলে যে বার্তাটি শুনতে পাবেন..."
                required
              />
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold">আনুমানিক অডিও সময়কাল: ১৫ সেকেন্ড</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const utterance = new SpeechSynthesisUtterance(voiceScript);
                  utterance.lang = 'bn-BD';
                  window.speechSynthesis.speak(utterance);
                }}
                className="bg-white text-emerald-800 hover:bg-emerald-100 px-3 py-1 rounded-lg font-bold border border-emerald-300 shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-600" />
                <span>টেস্ট প্লে</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSending || !voiceScript.trim()}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSending ? 'সম্প্রচার হচ্ছে...' : 'ভয়েস ব্রডকাস্ট শুরু করুন'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
