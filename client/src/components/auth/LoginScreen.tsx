import React, { useState } from 'react';
import { Shield, GraduationCap, Users, User, Lock, ArrowRight, Eye, EyeOff, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export type RoleCategory = 'admin' | 'teacher' | 'guardian';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login, switchRole } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<RoleCategory>('admin');
  const [identifier, setIdentifier] = useState('muhtamim');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Category Click & set convenient demo defaults
  const handleCategoryChange = (cat: RoleCategory) => {
    setSelectedCategory(cat);
    setErrorMsg('');
    if (cat === 'admin') {
      setIdentifier('muhtamim');
      setPassword('admin123');
    } else if (cat === 'teacher') {
      setIdentifier('teacher_rashid');
      setPassword('teacher123');
    } else if (cat === 'guardian') {
      setIdentifier('01811111111');
      setPassword('parent123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setIsLoading(true);
    try {
      await login(identifier.trim(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'ব্যবহারকারীর নাম বা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await switchRole(role);
    } catch (err: any) {
      setErrorMsg(err.message || 'ডেমো লগইনে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 flex flex-col items-center justify-center font-sans antialiased text-slate-800">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-bold rounded-full mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>MadrasaOS AI • ডিজিটাল মাদ্রাসা ম্যানেজমেন্ট</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          অ্যাকাউন্টে প্রবেশ করুন
        </h1>
        <p className="text-xs text-slate-500 mt-1.5">
          আপনার ভূমিকা (Role) নির্বাচন করে সিস্টেমে লগইন করুন
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* 3 Role Categories Selector */}
        <div>
          <label className="block text-slate-700 font-bold text-xs mb-2.5">
            আপনি কি হিসেবে প্রবেশ করতে চাচ্ছেন?
          </label>
          <div className="grid grid-cols-3 gap-2">
            
            {/* Category 1: Admin */}
            <button
              type="button"
              onClick={() => handleCategoryChange('admin')}
              className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 ${
                selectedCategory === 'admin'
                  ? 'border-emerald-700 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedCategory === 'admin' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Shield className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-slate-900">অ্যাডমিন</div>
              <div className="text-[10px] text-slate-500 line-clamp-1">মুহতামিম / অধ্যক্ষ</div>
            </button>

            {/* Category 2: Teacher / Ustad */}
            <button
              type="button"
              onClick={() => handleCategoryChange('teacher')}
              className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 ${
                selectedCategory === 'teacher'
                  ? 'border-emerald-700 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedCategory === 'teacher' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-slate-900">ওস্তাদ / শিক্ষক</div>
              <div className="text-[10px] text-slate-500 line-clamp-1">হাজিরা ও সবক</div>
            </button>

            {/* Category 3: Guardian */}
            <button
              type="button"
              onClick={() => handleCategoryChange('guardian')}
              className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 ${
                selectedCategory === 'guardian'
                  ? 'border-emerald-700 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedCategory === 'guardian' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-slate-900">অভিভাবক</div>
              <div className="text-[10px] text-slate-500 line-clamp-1">সন্তানের তথ্য ও ফি</div>
            </button>

          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          
          {/* Identifier Input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {selectedCategory === 'guardian' ? 'অভিভাবকের মোবাইল নম্বর' : 'ইউজারনেম / ইমেইল / মোবাইল'} <span className="text-emerald-700">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={selectedCategory === 'guardian' ? 'যেমন: 018xxxxxxxx' : 'যেমন: muhtamim'}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                পাসওয়ার্ড <span className="text-emerald-700">*</span>
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড দিন"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none transition font-mono"
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

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>প্রবেশ করা হচ্ছে...</span>
            ) : (
              <>
                <span>লগইন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Buttons */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 mb-2 text-center">
            বা দ্রুত টেস্ট করার জন্য যেকোনো রোলে ক্লিক করুন:
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('madrasa_admin')}
              className="py-1.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-[10px] font-bold transition truncate"
            >
              👑 ডেমো অ্যাডমিন
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('teacher')}
              className="py-1.5 px-2 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-xl text-[10px] font-bold transition truncate"
            >
              🎓 ডেমো ওস্তাদ
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('guardian')}
              className="py-1.5 px-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-[10px] font-bold transition truncate"
            >
              👨‍👩‍👧 ডেমো অভিভাবক
            </button>
          </div>
        </div>

        {/* Footer: Register New Madrasa Link */}
        <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
          নতুন মাদ্রাসা নিবন্ধন করতে চান?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-emerald-700 font-bold hover:underline"
          >
            এখানে ফ্রি রেজিস্ট্রেশন করুন
          </button>
        </div>

      </div>
    </div>
  );
};
