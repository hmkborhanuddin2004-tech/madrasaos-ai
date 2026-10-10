import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings, FeeCategory, ClassDefinition, SubjectDefinition } from '../../context/SettingsContext';
import {
  Building2,
  Receipt,
  BookOpen,
  Bell,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  Palette,
  Layers,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

type SettingsTab = 'general' | 'fees' | 'academic' | 'notifications' | 'security' | 'grading-policies';

export const InstitutionSettingsScreen: React.FC = () => {
  const {
    settings,
    feeCategories,
    classDefinitions,
    subjectDefinitions,
    loading,
    updateSettingsPreview,
    saveSettings,
    reloadSettings,
    uploadLogo,
    createFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
    createClassDefinition,
    updateClassDefinition,
    deleteClassDefinition,
    createSubjectDefinition,
    updateSubjectDefinition,
    deleteSubjectDefinition,
    addDepartment,
    deleteDepartment,
    updateDesignationLabels
  } = useSettings();
  const { user, updateCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fee Category Modal State
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFeeCategory, setEditingFeeCategory] = useState<Partial<FeeCategory> | null>(null);

  // Class Definition Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClassDef, setEditingClassDef] = useState<Partial<ClassDefinition> | null>(null);

  // Subject Definition Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectDef, setEditingSubjectDef] = useState<Partial<SubjectDefinition> | null>(null);

  // Department Input State
  const [newDepartmentName, setNewDepartmentName] = useState('');

  // Custom Designation Input State
  const [newDesignationKey, setNewDesignationKey] = useState('');
  const [newDesignationLabel, setNewDesignationLabel] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await saveSettings();
      if (user && (user.role === 'madrasa_admin' || user.role === 'principal') && settings.principalName) {
        updateCurrentUser({ fullNameBn: settings.principalName });
      }
      showToast('✓ মাদ্রাসার সকল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      alert(err.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  // Color Theme Presets
  const colorPresets = [
    { name: 'টিয়া সবুজ (Tiya Green)', hex: '#059669' },
    { name: 'শ্যামল সবুজ (Emerald)', hex: '#10b981' },
    { name: 'গাড় বনসবুজ (Forest)', hex: '#064e3b' },
    { name: 'সাগর নীল (Teal)', hex: '#0d9488' },
    { name: 'আকাশি নীল (Royal Blue)', hex: '#2563eb' },
    { name: 'খয়েরি লাল (Deep Maroon)', hex: '#831843' }
  ];

  // Currency Presets
  const currencyPresets = ['৳', 'BDT', '$', '€', 'SR'];

  // Handle Logo File Upload (uploads to server and updates settings preview)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          const uploadedUrl = await uploadLogo(result, file.name);
          updateSettingsPreview({ logoUrl: uploadedUrl });
          showToast('✓ লোগো সফলভাবে আপলোড হয়েছে!');
        } catch {
          // Fallback to data URI if upload API fails
          updateSettingsPreview({ logoUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-bounce">
          <Check className="w-5 h-5 text-emerald-200" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <Sliders className="w-4 h-4" />
            <span>প্রাতিষ্ঠানিক নিয়ন্ত্রণ প্যানেল (Customization & Settings)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">মাদ্রাসা সেটিংস ও কাস্টমাইজেশন</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            প্রতিটি মাদ্রাসার জন্য নিজস্ব নাম, লোগো, থিম কালার, ফি কাঠামো, জামাত নেসাব ও স্টাফ পদবি লেবেল নিজের মতো সাজিয়ে নিন।
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={reloadSettings}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            title="পুনরায় রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700/60 scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>সাধারণ তথ্য (General Info)</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
            activeTab === 'fees'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>ফি ও বেতন কাঠামো (Fee Structure)</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
            activeTab === 'academic'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>একাডেমিক কাঠামো (Academic Structure)</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>নোটিফিকেশন ও SMS (Notifications)</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>নিরাপত্তা ও অ্যাক্সেস (Security)</span>
        </button>
      
        <button
          onClick={() => setActiveTab('grading-policies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
            activeTab === 'grading-policies'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Grading Policy</span>
        </button>
      </div>

      
      {activeTab === 'grading-policies' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Grading Policies</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage grading policies for the institution.
            </p>
          </div>
          <div><p className="text-sm">Grading policy management coming soon.</p></div>
        </div>
      )}

      {/* ==================== TAB 1: General Info ==================== */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>মাদ্রাসার প্রাথমিক পরিচিতি ও ব্র্যান্ডিং</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              এখানে পরিবর্তিত নাম এবং লোগো উপরের ন্যাভবারে তাৎক্ষণিক লাইভ প্রিভিউ দেখতে পাবেন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                মাদ্রাসার নাম (বাংলায়) *
              </label>
              <input
                type="text"
                value={settings.nameBn}
                onChange={(e) => updateSettingsPreview({ nameBn: e.target.value })}
                placeholder="e.g. জামিয়া ইসলামিয়া দারুল উলূম"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                মাদ্রাসার নাম (ইংরেজিতে) *
              </label>
              <input
                type="text"
                value={settings.nameEn}
                onChange={(e) => updateSettingsPreview({ nameEn: e.target.value })}
                placeholder="e.g. Jamia Islamia Model Madrasa"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                মুহতামিম / প্রধান পরিচালকের নাম *
              </label>
              <input
                type="text"
                value={settings.principalName || ''}
                onChange={(e) => updateSettingsPreview({ principalName: e.target.value })}
                placeholder="e.g. মাওলানা আব্দুল কুদ্দুস"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Logo Upload / URL */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo Preview"
                  className="w-20 h-20 rounded-2xl object-contain border border-slate-300 dark:border-slate-700 bg-white p-1 shadow-md"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {settings.nameBn ? settings.nameBn.trim().slice(0, 1) : 'ম'}
                </div>
              )}
              <span className="text-[10px] font-semibold text-slate-400">লোগো প্রিভিউ</span>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  লোগো আপলোড করুন অথবা ইমেজ লিঙ্ক দিন
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSettingsPreview({ logoUrl: e.target.value })}
                    placeholder="https://.../logo.png"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateSettingsPreview({ logoUrl: '' })}
                      className="px-3 py-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 hover:bg-rose-100"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs font-bold cursor-pointer hover:bg-emerald-100 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                মাদ্রাসার ধরন (Madrasa Type)
              </label>
              <select
                value={settings.madrasaType}
                onChange={(e) => updateSettingsPreview({ madrasaType: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
              >
                <option value="Qawmi">কওমী মাদ্রাসা (Qawmi)</option>
                <option value="Alia">আলিয়া মাদ্রাসা (Alia)</option>
                <option value="Hifz">হিফজুল কুরআন মাদ্রাসা (Hifz)</option>
                <option value="Mixed">সমন্বিত / আধুনিক মডেল (Mixed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                প্রতিষ্ঠার সাল (Established Year)
              </label>
              <input
                type="number"
                value={settings.establishedYear || ''}
                onChange={(e) => updateSettingsPreview({ establishedYear: parseInt(e.target.value) || undefined })}
                placeholder="e.g. 1994"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                যোগাযোগের ফোন নম্বর *
              </label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => updateSettingsPreview({ phone: e.target.value })}
                placeholder="e.g. 01711111111"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                মাদ্রাসার স্লোগান / Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => updateSettingsPreview({ tagline: e.target.value })}
                placeholder="e.g. ইলম, আমল ও খুলুসিয়্যাতের অনন্য দ্বীনি প্রতিষ্ঠান"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                অফিসিয়াল ইমেইল
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => updateSettingsPreview({ email: e.target.value })}
                placeholder="info@madrasa.edu.bd"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              মাদ্রাসার পূর্ণ ঠিকানা
            </label>
            <textarea
              rows={2}
              value={settings.address || ''}
              onChange={(e) => updateSettingsPreview({ address: e.target.value })}
              placeholder="গ্রাম/রোড, ডাকঘর, থানা, জেলা"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Color Theme & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>প্রাইমারি কালার থিম (Primary Color)</span>
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettingsPreview({ primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettingsPreview({ primaryColor: e.target.value })}
                  className="w-28 px-3 py-1.5 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {colorPresets.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => updateSettingsPreview({ primaryColor: c.hex })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                      settings.primaryColor === c.hex
                        ? 'border-slate-900 bg-slate-100 dark:bg-slate-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>মুদ্রা প্রতীক ও শিক্ষাবর্ষ নির্ধারণ</span>
              </label>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => updateSettingsPreview({ currencySymbol: e.target.value })}
                  className="w-20 px-3 py-2 font-bold text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex gap-1">
                  {currencyPresets.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => updateSettingsPreview({ currencySymbol: sym })}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                        settings.currencySymbol === sym
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শিক্ষাবর্ষের ধরন (Academic Year Type)
                </label>
                <select
                  value={settings.academicYearType || 'hijri'}
                  onChange={(e) => updateSettingsPreview({ academicYearType: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="hijri">হিজরী বর্ষ (Hijri Academic Year)</option>
                  <option value="gregorian">ইংরেজি / সৌর বর্ষ (Gregorian Year)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">হিজরী বর্ষ প্রধান হিসাবে প্রদর্শন</div>
                  <div className="text-[11px] text-slate-500">চালান ও রসিদে হিজরী ক্যালেন্ডার তারিখ সক্রিয় থাকবে</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.hijriYearEnabled}
                  onChange={(e) => updateSettingsPreview({ hijriYearEnabled: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সাধারণ তথ্য সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: Fee Structure ==================== */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>ফি ও বেতন কাঠামো কাস্টমাইজেশন</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                মাদ্রাসার নিয়মিত ও অনিয়মিত ফি ক্যাটাগরি এবং বিলম্ব ফি পলিসি কনফিগার করুন।
              </p>
            </div>
            <button
              onClick={() => {
                setEditingFeeCategory({ nameBn: '', nameEn: '', amount: 0, frequency: 'monthly', ledgerType: 'non_residential', description: '' });
                setShowFeeModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ফি ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>

          {/* Late Fee Policy Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <div className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>বিলম্ব ফি পলিসি সেটিংস (Late Fee Settings)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  পরিশোধের গ্রেস পিরিয়ড (দিনের সংখ্যা)
                </label>
                <input
                  type="number"
                  value={settings.lateFeeSettings?.grace_days || 10}
                  onChange={(e) =>
                    updateSettingsPreview({
                      lateFeeSettings: {
                        ...settings.lateFeeSettings,
                        grace_days: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিলম্ব ফি পরিমাণ ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  value={settings.lateFeeSettings?.amount || 50}
                  onChange={(e) =>
                    updateSettingsPreview({
                      lateFeeSettings: {
                        ...settings.lateFeeSettings,
                        amount: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিলম্ব ফি গণনার ধরন
                </label>
                <select
                  value={settings.lateFeeSettings?.type || 'fixed'}
                  onChange={(e) =>
                    updateSettingsPreview({
                      lateFeeSettings: {
                        ...settings.lateFeeSettings,
                        type: e.target.value as any
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="fixed">নির্দিষ্ট ফি (Fixed Amount)</option>
                  <option value="daily">দৈনিক জরিমানা (Daily)</option>
                  <option value="percentage">শতকরা হার (Percentage)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fee Categories Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">ক্যাটাগরি নাম (বাংলা)</th>
                  <th className="p-3">ক্যাটাগরি নাম (ইংরেজি)</th>
                  <th className="p-3">লেজার / ছাত্রের ধরন</th>
                  <th className="p-3">নির্ধারিত টাকা</th>
                  <th className="p-3">আদায়ের ধরন</th>
                  <th className="p-3">বিবরণ</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {feeCategories.map((fc) => (
                  <tr key={fc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{fc.nameBn}</td>
                    <td className="p-3">{fc.nameEn}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fc.ledgerType === 'residential'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border border-teal-200'
                      }`}>
                        {fc.ledgerType === 'residential' ? 'আবাসিক (Hostel)' : 'অনাবাসিক (Academic)'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {settings.currencySymbol} {fc.amount}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 capitalize">
                        {fc.frequency === 'monthly'
                          ? 'মাসিক'
                          : fc.frequency === 'yearly'
                          ? 'বার্ষিক'
                          : fc.frequency === 'per_term'
                          ? 'প্রতি পরীক্ষা'
                          : 'এককালীন'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{fc.description || '—'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingFeeCategory(fc);
                          setShowFeeModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`'${fc.nameBn}' ফি ক্যাটাগরি মুছে ফেলতে চান?`)) {
                            await deleteFeeCategory(fc.id);
                            showToast('ফি ক্যাটাগরি মুছে ফেলা হয়েছে।');
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'ফি সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: Academic Structure ==================== */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Custom Departments */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>মাদ্রাসার বিভাগসমূহ (Department Customization)</span>
              </h2>
              <p className="text-xs text-slate-500">মাদ্রাসায় বিদ্যমান শাখা বা শিক্ষা বিভাগসমূহ কনফিগার করুন।</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.customDepartments.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <span>{dept}</span>
                  <button
                    onClick={async () => {
                      if (confirm(`'${dept}' বিভাগ মুছে ফেলতে চান?`)) {
                        await deleteDepartment(dept);
                        showToast(`'${dept}' বিভাগ মুছে ফেলা হয়েছে।`);
                      }
                    }}
                    className="text-emerald-600 hover:text-rose-600 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                placeholder="নতুন বিভাগের নাম লিখুন..."
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 font-medium"
              />
              <button
                type="button"
                onClick={async () => {
                  if (newDepartmentName.trim()) {
                    await addDepartment(newDepartmentName.trim());
                    setNewDepartmentName('');
                    showToast('নতুন বিভাগ যোগ করা হয়েছে।');
                  }
                }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                যোগ করুন
              </button>
            </div>
          </div>

          {/* Classes / Jamaats */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>ক্লাস ও জামাত তালিকা (Class / Jamaat Definitions)</span>
                </h2>
                <p className="text-xs text-slate-500">জামাতের নাম, ক্রম এবং বিভাগ নির্ধারণ করুন (হার্ডকোড নয়)।</p>
              </div>
              <button
                onClick={() => {
                  setEditingClassDef({ nameBn: '', nameEn: '', orderIndex: classDefinitions.length + 1, department: 'কওমী বিভাগ' });
                  setShowClassModal(true);
                }}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন জামাত যোগ করুন</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3 w-16">ক্রম</th>
                    <th className="p-3">জামাত নাম (বাংলা)</th>
                    <th className="p-3">জামাত নাম (ইংরেজি)</th>
                    <th className="p-3">বিভাগ</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classDefinitions.map((cd) => (
                    <tr key={cd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-slate-400">#{cd.orderIndex}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{cd.nameBn}</td>
                      <td className="p-3">{cd.nameEn}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700">
                          {cd.department || 'কওমী বিভাগ'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingClassDef(cd);
                            setShowClassModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`'${cd.nameBn}' জামাত মুছে ফেলতে চান?`)) {
                              await deleteClassDefinition(cd.id);
                              showToast('জামাত মুছে ফেলা হয়েছে।');
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>পাঠ্য বিষয় তালিকা (Subject Definitions)</span>
                </h2>
                <p className="text-xs text-slate-500">মাদ্রাসার পাঠ্য কিতাব ও বিষয়সমূহ কনফিগার করুন।</p>
              </div>
              <button
                onClick={() => {
                  setEditingSubjectDef({ nameBn: '', nameEn: '', code: '', totalMarks: 100, passMarks: 33 });
                  setShowSubjectModal(true);
                }}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন বিষয় যোগ করুন</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">কোড</th>
                    <th className="p-3">বিষয়ের নাম (বাংলা)</th>
                    <th className="p-3">বিষয়ের নাম (ইংরেজি)</th>
                    <th className="p-3">পূর্ণমান</th>
                    <th className="p-3">পাস নম্বর</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjectDefinitions.map((sd) => (
                    <tr key={sd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-emerald-600">{sd.code || '—'}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{sd.nameBn}</td>
                      <td className="p-3">{sd.nameEn}</td>
                      <td className="p-3 font-mono">{sd.totalMarks}</td>
                      <td className="p-3 font-mono font-bold text-amber-600">{sd.passMarks}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingSubjectDef(sd);
                            setShowSubjectModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`'${sd.nameBn}' বিষয় মুছে ফেলতে চান?`)) {
                              await deleteSubjectDefinition(sd.id);
                              showToast('বিষয় মুছে ফেলা হয়েছে।');
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Designation Labels */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>স্টাফ পদবি ও ডেজিগনেশন লেবেল (Role / Designation Labels)</span>
              </h2>
              <p className="text-xs text-slate-500">
                মুহতামিম, নাযেমে তালীম, ওস্তাদ ইত্যাদি পদবির বাংলা লেবেল আপনার প্রাতিষ্ঠানিক রীতি অনুযায়ী কাস্টমাইজ করুন (হার্ডকোড নয়)।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.designationLabels || {}).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                  <div className="w-32 font-mono text-[11px] text-slate-400 truncate">{key}</div>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) =>
                      updateSettingsPreview({
                        designationLabels: {
                          ...settings.designationLabels,
                          [key]: e.target.value
                        }
                      })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                placeholder="নতুন পদবি কোড (e.g. mudarris_awwal)"
                value={newDesignationKey}
                onChange={(e) => setNewDesignationKey(e.target.value)}
                className="w-48 px-3 py-1.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 font-mono"
              />
              <input
                type="text"
                placeholder="পদবি বাংলা লেবেল (e.g. সদরুল মুদাররিসীন)"
                value={newDesignationLabel}
                onChange={(e) => setNewDesignationLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={async () => {
                  if (newDesignationKey.trim() && newDesignationLabel.trim()) {
                    await updateDesignationLabels({
                      [newDesignationKey.trim()]: newDesignationLabel.trim()
                    });
                    setNewDesignationKey('');
                    setNewDesignationLabel('');
                    showToast('নতুন পদবি লেবেল যোগ করা হয়েছে।');
                  }
                }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
              >
                যোগ করুন
              </button>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পদবি লেবেল সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: Notifications ==================== */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>এসএমএস ও নোটিফিকেশন গেটওয়ে সেটিংস</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Brevo API কী এবং এসএমএস প্রেরক আইডি ডেটাবেসে নিরাপদে সংরক্ষিত থাকবে (হার্ডকোড নয়)।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                SMS Sender ID (প্রেরক আইডি) *
              </label>
              <input
                type="text"
                value={settings.smsSenderId || ''}
                onChange={(e) => updateSettingsPreview({ smsSenderId: e.target.value })}
                placeholder="e.g. MADRASA_OS"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                টেলকো অনুমোদিত আলফানিউমেরিক প্রেরক মাস্কিং নাম।
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Brevo API Key (ব্রেভো লাইভ কী) *
              </label>
              <input
                type="password"
                value={settings.brevoApiKey || ''}
                onChange={(e) => updateSettingsPreview({ brevoApiKey: e.target.value })}
                placeholder="xkeysib-..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ব্রেভোর ৩শটি ফ্রি দৈনিক ট্রানজ্যাকশনাল এসএমএস ও ইমেইলের জন্য কী।
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Google Gemini API Key (গুগল ভয়েস ও এআই সহকারী)
              </label>
              <input
                type="password"
                value={settings.geminiApiKey || ''}
                onChange={(e) => updateSettingsPreview({ geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                গুগল এআই স্টুডিও (aistudio.google.com) থেকে ফ্রি এপিআই কী। এটি যুক্ত করলে সব ব্রাউজারে বাংলা ভয়েস টাইপিং ও এআই সহকারী ১০০% কাজ করবে।
              </p>
            </div>
          </div>

          {/* Channel Toggles */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              মাল্টি-চ্যানেল অটোমেশন সক্রিয়তা (Notification Toggles)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">WhatsApp নোটিফিকেশন</div>
                  <div className="text-[10px] text-slate-500">অনুপস্থিতি ও ফি সতর্কবার্তা</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.whatsappEnabled}
                  onChange={(e) => updateSettingsPreview({ whatsappEnabled: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Messenger নোটিফিকেশন</div>
                  <div className="text-[10px] text-slate-500">ফেসবুক পেজ মেসেঞ্জার অ্যালার্ট</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.messengerEnabled}
                  onChange={(e) => updateSettingsPreview({ messengerEnabled: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Email নোটিফিকেশন</div>
                  <div className="text-[10px] text-slate-500">পিডিএফ ইনভয়েস ও সার্টিফিকেট</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => updateSettingsPreview({ emailEnabled: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'নোটিফিকেশন সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: Security ==================== */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>নিরাপত্তা, ডেটা আইসোলেশন ও অ্যাক্সেস কন্ট্রোল</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              মাল্টি-টেন্যান্ট ডেটাবেস বিচ্ছিন্নতা ও প্রাতিষ্ঠানিক ডেটা সুরক্ষার নিয়মাবলী।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                টেন্যান্ট ডেটা সম্পূর্ণ সুরক্ষিত (Multi-Tenant Isolation Enforced)
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                আপনার প্রতিষ্ঠানের টেন্যান্ট আইডি: <span className="font-mono font-bold">{settings.tenantId}</span>। সকল আর্থিক লেজার ও ছাত্র তথ্য কঠোরভাবে আলাদা।
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white">টু-ফ্যাক্টর অথেনটিকেশন (2FA)</div>
                <div className="text-[11px] text-slate-500">অ্যাডমিন ও হিসাবরক্ষক লগইনে ওটিপি যাচাই</div>
              </div>
              <input
                type="checkbox"
                checked={settings.securitySettings?.two_factor_auth || false}
                onChange={(e) =>
                  updateSettingsPreview({
                    securitySettings: {
                      ...settings.securitySettings,
                      two_factor_auth: e.target.checked
                    }
                  })
                }
                className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white">নিষ্ক্রিয় থাকলে সেশন টাইমআউট</div>
                <div className="text-[11px] text-slate-500">স্বয়ংক্রিয় লগআউট সময় (মিনিট)</div>
              </div>
              <input
                type="number"
                value={settings.securitySettings?.session_timeout_minutes || 60}
                onChange={(e) =>
                  updateSettingsPreview({
                    securitySettings: {
                      ...settings.securitySettings,
                      session_timeout_minutes: parseInt(e.target.value) || 60
                    }
                  })
                }
                className="w-20 px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 font-mono text-center"
              />
            </div>
          </div>

          {/* RBAC: Boring, Explicit Checkbox Grid */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-bangla-display">
                ভূমিকা ও অনুমতি ম্যাট্রিক্স (RBAC Matrix)
              </h3>
              <p className="text-xs text-slate-500">
                প্রতিটি ব্যবহারকারী ভূমিকার জন্য স্পষ্ট ও নির্দিষ্ট অনুমোদন নির্ধারণ করুন।
              </p>
            </div>

            <div className="overflow-x-auto border border-[#17161A]/30 rounded-[2px]">
              <table className="table-kitab text-xs">
                <thead>
                  <tr>
                    <th>ব্যবহারকারী ভূমিকা (Role)</th>
                    <th className="text-center">শিক্ষার্থী তালিকা</th>
                    <th className="text-center">ভর্তি / সম্পাদন</th>
                    <th className="text-center">হাজিরা</th>
                    <th className="text-center">নম্বর এন্ট্রি</th>
                    <th className="text-center">ফলাফল প্রকাশ</th>
                    <th className="text-center">ফি ও রসিদ</th>
                    <th className="text-center">ক্যাশ বুক</th>
                    <th className="text-center">হোস্টেল</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'সুপার এডমিন (Super Admin)', perms: [true, true, true, true, true, true, true, true], locked: true },
                    { role: 'মুহতামিম / এডমিন (Admin)', perms: [true, true, true, true, true, true, true, true], locked: true },
                    { role: 'শিক্ষা সচিব / প্রিন্সিপাল (Principal)', perms: [true, true, true, true, true, false, false, true] },
                    { role: 'কিতাব শিক্ষক (Kitab Teacher)', perms: [true, false, true, true, false, false, false, false] },
                    { role: 'হিফজ শিক্ষক (Hifz Teacher)', perms: [true, false, true, true, false, false, false, false] },
                    { role: 'হিসাবরক্ষক (Accountant)', perms: [true, false, false, false, false, true, true, false] },
                    { role: 'ছাত্রাবাস পরিচালক (Hostel Manager)', perms: [true, false, true, false, false, false, false, true] },
                    { role: 'অভিভাবক (Guardian)', perms: [false, false, false, false, false, false, false, false], locked: true },
                    { role: 'শিক্ষার্থী (Student)', perms: [false, false, false, false, false, false, false, false], locked: true }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {row.role}
                      </td>
                      {row.perms.map((p, pIdx) => (
                        <td key={pIdx} className="text-center p-2">
                          <input
                            type="checkbox"
                            defaultChecked={p}
                            disabled={row.locked}
                            className="w-4 h-4 text-emerald-600 rounded-[2px] cursor-pointer disabled:opacity-50"
                            aria-label={`${row.role} এর অনুমতি`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#1F2A44] hover:bg-[#17161A] text-[#E9E3D5] px-6 py-2.5 rounded-[2px] font-bold text-sm shadow-sm transition font-ui cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'নিরাপত্তা সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== Modal: Add / Edit Fee Category ==================== */}
      {showFeeModal && editingFeeCategory && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editingFeeCategory.id ? 'ফি ক্যাটাগরি সম্পাদনা' : 'নতুন ফি ক্যাটাগরি তৈরি'}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingFeeCategory.id) {
                  await updateFeeCategory(editingFeeCategory.id, editingFeeCategory);
                  showToast('ফি ক্যাটাগরি আপডেট করা হয়েছে।');
                } else {
                  await createFeeCategory(editingFeeCategory);
                  showToast('নতুন ফি ক্যাটাগরি যোগ করা হয়েছে।');
                }
                setShowFeeModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ক্যাটাগরি নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingFeeCategory.nameBn || ''}
                  onChange={(e) => setEditingFeeCategory({ ...editingFeeCategory, nameBn: e.target.value })}
                  placeholder="e.g. মাসিক বেতন"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ক্যাটাগরি নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={editingFeeCategory.nameEn || ''}
                  onChange={(e) => setEditingFeeCategory({ ...editingFeeCategory, nameEn: e.target.value })}
                  placeholder="e.g. Monthly Tuition Fee"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    টাকার পরিমাণ ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingFeeCategory.amount || 0}
                    onChange={(e) => setEditingFeeCategory({ ...editingFeeCategory, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আদায়ের ধরন
                  </label>
                  <select
                    value={editingFeeCategory.frequency || 'monthly'}
                    onChange={(e) => setEditingFeeCategory({ ...editingFeeCategory, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  >
                    <option value="monthly">মাসিক (Monthly)</option>
                    <option value="yearly">বার্ষিক (Yearly)</option>
                    <option value="per_term">প্রতি পরীক্ষা (Per Term)</option>
                    <option value="one_time">এককালীন (One-time)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ছাত্রের ধরন (লেজার টাইপ) *
                </label>
                <select
                  value={editingFeeCategory.ledgerType || 'non_residential'}
                  onChange={(e) => setEditingFeeCategory({ ...editingFeeCategory, ledgerType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="non_residential">অনাবাসিক (Non-Residential / Academic)</option>
                  <option value="residential">আবাসিক (Residential / Hostel & Boarding)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিবরণ
                </label>
                <textarea
                  rows={2}
                  value={editingFeeCategory.description || ''}
                  onChange={(e) => setEditingFeeCategory({ ...editingFeeCategory, description: e.target.value })}
                  placeholder="ফি সংক্রান্ত বিবরণ লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== Modal: Add / Edit Class ==================== */}
      {showClassModal && editingClassDef && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editingClassDef.id ? 'জামাত সম্পাদনা' : 'নতুন জামাত যোগ করুন'}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingClassDef.id) {
                  await updateClassDefinition(editingClassDef.id, editingClassDef);
                  showToast('জামাত আপডেট করা হয়েছে।');
                } else {
                  await createClassDefinition(editingClassDef);
                  showToast('নতুন জামাত যোগ করা হয়েছে।');
                }
                setShowClassModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  জামাত নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingClassDef.nameBn || ''}
                  onChange={(e) => setEditingClassDef({ ...editingClassDef, nameBn: e.target.value })}
                  placeholder="e.g. সানাভিয়্যাহ আম্মাহ"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  জামাত নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={editingClassDef.nameEn || ''}
                  onChange={(e) => setEditingClassDef({ ...editingClassDef, nameEn: e.target.value })}
                  placeholder="e.g. Sanaviyyah Ammah"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ক্রম নম্বর (Order Index)
                  </label>
                  <input
                    type="number"
                    value={editingClassDef.orderIndex || 1}
                    onChange={(e) => setEditingClassDef({ ...editingClassDef, orderIndex: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিভাগ (Department)
                  </label>
                  <input
                    type="text"
                    value={editingClassDef.department || ''}
                    onChange={(e) => setEditingClassDef({ ...editingClassDef, department: e.target.value })}
                    placeholder="e.g. কিতাব বিভাগ"
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== Modal: Add / Edit Subject ==================== */}
      {showSubjectModal && editingSubjectDef && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editingSubjectDef.id ? 'বিষয় সম্পাদনা' : 'নতুন বিষয় যোগ করুন'}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingSubjectDef.id) {
                  await updateSubjectDefinition(editingSubjectDef.id, editingSubjectDef);
                  showToast('বিষয় আপডেট করা হয়েছে।');
                } else {
                  await createSubjectDefinition(editingSubjectDef);
                  showToast('নতুন বিষয় যোগ করা হয়েছে।');
                }
                setShowSubjectModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিষয়ের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingSubjectDef.nameBn || ''}
                  onChange={(e) => setEditingSubjectDef({ ...editingSubjectDef, nameBn: e.target.value })}
                  placeholder="e.g. কাফিয়া (নাহব শাস্ত্র)"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিষয়ের নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={editingSubjectDef.nameEn || ''}
                  onChange={(e) => setEditingSubjectDef({ ...editingSubjectDef, nameEn: e.target.value })}
                  placeholder="e.g. Al-Kafiya (Syntax)"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কোড
                  </label>
                  <input
                    type="text"
                    value={editingSubjectDef.code || ''}
                    onChange={(e) => setEditingSubjectDef({ ...editingSubjectDef, code: e.target.value })}
                    placeholder="e.g. ARB-201"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোট নম্বর
                  </label>
                  <input
                    type="number"
                    value={editingSubjectDef.totalMarks || 100}
                    onChange={(e) => setEditingSubjectDef({ ...editingSubjectDef, totalMarks: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাস নম্বর
                  </label>
                  <input
                    type="number"
                    value={editingSubjectDef.passMarks || 33}
                    onChange={(e) => setEditingSubjectDef({ ...editingSubjectDef, passMarks: parseInt(e.target.value) || 33 })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InstitutionSettingsScreen;
