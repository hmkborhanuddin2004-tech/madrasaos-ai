import React, { useState } from 'react';
import { Building2, Phone, Mail, MapPin, User, Lock, Gift, Check, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, Clock, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegistrationScreenProps {
  onNavigateToLogin: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();

  // Form State
  const [madrasaName, setMadrasaName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [adminName, setAdminName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const [studentCapacity, setStudentCapacity] = useState('১০০ পর্যন্ত');
  const [staffCapacity, setStaffCapacity] = useState('৩০+');
  const [planType, setPlanType] = useState<'trial' | 'paid'>('trial');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Slug Verification
  const handleCheckSlug = async () => {
    if (!slug.trim()) return;
    setSlugStatus('checking');
    try {
      const res = await fetch(`/api/v1/auth/check-slug?slug=${encodeURIComponent(slug.trim())}`);
      const data = await res.json();
      if (data.available) {
        setSlugStatus('available');
      } else {
        setSlugStatus('taken');
      }
    } catch {
      setSlugStatus('available');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!madrasaName.trim()) {
      setErrorMsg('মাদ্রাসার পূর্ণ নাম আবশ্যক।');
      return;
    }
    if (!adminName.trim()) {
      setErrorMsg('অ্যাডমিনের নাম আবশ্যক।');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('লগইন ইউজারনেম আবশ্যক।');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('শক্তিশালী পাসওয়ার্ড দিন।');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('দয়া করে সার্ভিস শর্তাবলী এবং প্রাইভেসি পলিসি মেনে নিন।');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        madrasaName: madrasaName.trim(),
        slug: slug.trim() || username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        adminName: adminName.trim(),
        username: username.trim(),
        password: password.trim(),
        referralCode: referralCode.trim(),
        studentCapacity,
        staffCapacity,
        planType
      });
      setSuccessMsg('মাদ্রাসা সফলভাবে নিবন্ধিত হয়েছে! স্বাগতম...');
    } catch (err: any) {
      setErrorMsg(err.message || 'নিবন্ধনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 flex flex-col items-center justify-center font-sans antialiased text-slate-800">
      {/* Top Header */}
      <div className="text-center mb-8 max-w-xl">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          মাদ্রাসা রেজিস্ট্রেশন
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          আপনার মাদ্রাসার ডিজিটাল যাত্রার আনন্দময় শুরু হোক। সহজ ও আধুনিক ব্যবস্থাপনায় ফিরে আসুন।
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* CARD 1: মাদ্রাসার মৌলিক তথ্য */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-slate-900">মাদ্রাসার মৌলিক তথ্য</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* মাদ্রাসার পূর্ণ নাম */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  মাদ্রাসার পূর্ণ নাম <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আল-ফারুক মাদ্রাসা"
                    value={madrasaName}
                    onChange={(e) => {
                      setMadrasaName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').slice(0, 20));
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* মাদ্রাসার ইউনিক ইউআরএল স্ল্যাগ (Slug) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  মাদ্রাসার ইউনিক ইউআরএল স্ল্যাগ (Slug) <span className="text-emerald-700">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-emerald-600 transition">
                    <span className="text-slate-400 pl-3 pr-1 text-[11px] font-mono select-none">/portal/</span>
                    <input
                      type="text"
                      placeholder="যেমন: al-farooq"
                      value={slug}
                      onChange={(e) => { setSlug(e.target.value); setSlugStatus('idle'); }}
                      className="w-full py-2.5 pr-2 bg-transparent focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckSlug}
                    disabled={slugStatus === 'checking'}
                    className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center ${
                      slugStatus === 'available'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : slugStatus === 'taken'
                        ? 'bg-red-50 border-red-400 text-red-600'
                        : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {slugStatus === 'checking' ? '...' : slugStatus === 'available' ? '✓ উন্মুক্ত' : slugStatus === 'taken' ? 'ব্যবহৃত' : 'যাচাই'}
                  </button>
                </div>
              </div>

              {/* অফিসিয়াল ফোন নম্বর */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  অফিসিয়াল ফোন নম্বর <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* ইমেইল অ্যাড্রেস */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ইমেইল অ্যাড্রেস <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="info@madrasa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* মাদ্রাসার পূর্ণ ঠিকানা */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  মাদ্রাসার পূর্ণ ঠিকানা <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="মাদ্রাসার পূর্ণ ঠিকানা লিখুন"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: অ্যাডমিন অ্যাকাউন্ট সেটিংস */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-slate-900">অ্যাডমিন অ্যাকাউন্ট সেটিংস</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* অ্যাডমিনের নাম */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  অ্যাডমিনের নাম <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোঃ আবদুল্লাহ"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* লগইন ইউজারনেম */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  লগইন ইউজারনেম <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: admin123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* সিকিউর পাসওয়ার্ড */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  সিকিউর পাসওয়ার্ড <span className="text-emerald-700">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="শক্তিশালী পাসওয়ার্ড দিন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 border-l border-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* রেফারেল কোড (ঐচ্ছিক) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  রেফারেল কোড (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="যেমন: RMM11XY"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: মাদ্রাসার ধরন ও পরিসর */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-slate-900">মাদ্রাসার ধরন ও পরিসর</h2>
            </div>

            {/* ১. আপনার মাদ্রাসায় মোট ছাত্র সংখ্যা কত? */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">
                ১. আপনার মাদ্রাসায় মোট ছাত্র সংখ্যা কত?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['১০০ পর্যন্ত', '৩০০ পর্যন্ত', '১০০০ পর্যন্ত', '১০০০+'].map((cap) => {
                  const isSelected = studentCapacity === cap;
                  return (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setStudentCapacity(cap)}
                      className={`py-2 px-1 text-center font-bold text-[11px] rounded-xl border transition ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cap}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ২. আপনার মাদ্রাসায় মোট শিক্ষক ও স্টাফ সংখ্যা কত? */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">
                ২. আপনার মাদ্রাসায় মোট শিক্ষক ও স্টাফ সংখ্যা কত?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['১০ পর্যন্ত', '২০ পর্যন্ত', '৩০ পর্যন্ত', '৩০+'].map((staff) => {
                  const isSelected = staffCapacity === staff;
                  return (
                    <button
                      key={staff}
                      type="button"
                      onClick={() => setStaffCapacity(staff)}
                      className={`py-2 px-1 text-center font-bold text-[11px] rounded-xl border transition ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {staff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ৩. আপনি কোনটি ব্যবহার করতে চান? */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">
                ৩. আপনি কোনটি ব্যবহার করতে চান?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Free Trial */}
                <div
                  onClick={() => setPlanType('trial')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    planType === 'trial'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">ফ্রি ট্রায়াল</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">বিনামূল্যে পরখ করে দেখুন</div>
                  </div>
                </div>

                {/* Paid Subscription */}
                <div
                  onClick={() => setPlanType('paid')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    planType === 'paid'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">পেইড সাবস্ক্রিপশন</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">সব ফিচারের পূর্ণাঙ্গ সুবিধা</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 justify-center">
            <input
              type="checkbox"
              id="termsCheck"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="termsCheck" className="cursor-pointer select-none">
              আমি <span className="text-emerald-700 font-bold underline">সার্ভিস শর্তাবলী</span> এবং <span className="text-emerald-700 font-bold underline">প্রাইভেসি পলিসি</span> মেনে নিচ্ছি
            </label>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span>নিবন্ধন সম্পন্ন হচ্ছে...</span>
            ) : (
              <>
                <span>ফ্রি নিবন্ধন সম্পন্ন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Login Link */}
        <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
          ইতিমধ্যেই অ্যাকাউন্ট আছে?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-emerald-700 font-bold hover:underline"
          >
            এখানে লগইন করুন
          </button>
        </div>
      </div>
    </div>
  );
};
