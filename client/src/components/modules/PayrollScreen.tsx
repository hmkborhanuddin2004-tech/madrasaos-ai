import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DocumentCapture } from '../common/DocumentCapture';
import { PhotoGallery } from '../common/PhotoGallery';
import {
  Banknote,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  X,
  PlusCircle,
  ShieldCheck,
  QrCode,
  Calendar,
  Building,
  CreditCard,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const defaultDesignationLabels: Record<string, string> = {
  muhtamim: 'মুহতামিম (প্রধান পরিচালক)',
  shaykhul_hadith: 'শায়খুল হাদীস',
  senior_muhaddis: 'সিনিয়র মুহাদ্দিস',
  kitab_teacher: 'কিতাব শিক্ষক (ওস্তাদ)',
  hifz_teacher: 'হিফজ শিক্ষক (হাফেজ)',
  nazir_office: 'নাজের / অফিস সহকারী',
  cook_hostel: 'বাবুর্চি / ছাত্রাবাস স্টাফ',
  security: 'নিরাপত্তা কর্মী'
};

const statusBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: {
    label: 'খসড়া',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700'
  },
  accountant_verified: {
    label: 'হিসাবরক্ষক কর্তৃক যাচাইকৃত',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700'
  },
  muhtamim_approved: {
    label: 'মুহতামিম কর্তৃক অনুমোদিত',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700'
  },
  disbursed: {
    label: 'পরিশোধিত',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700'
  }
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'নগদ ক্যাশ',
  bank: 'ব্যাংক স্থানান্তর',
  bkash: 'বিকাশ (MFS)',
  nagad: 'নগদ (MFS)'
};

export const PayrollScreen: React.FC = () => {
  const { user, apiCall } = useAuth();
  const { settings } = useSettings();
  const designationLabels: Record<string, string> = {
    ...defaultDesignationLabels,
    ...(settings.designationLabels || {})
  };
  const isTeacherOrStaff = ['teacher', 'hifz_teacher', 'staff', 'student', 'guardian'].includes(user.role);

  const [activeTab, setActiveTab] = useState<'vouchers' | 'profiles' | 'my_payslips'>(
    isTeacherOrStaff ? 'my_payslips' : 'vouchers'
  );

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('সেপ্টেম্বর');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genMonth, setGenMonth] = useState('সেপ্টেম্বর');
  const [genYear, setGenYear] = useState(2026);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [newProfile, setNewProfile] = useState({
    staff_name: '',
    designation: 'kitab_teacher',
    base_salary: 18000,
    housing_allowance: 4000,
    food_allowance: 2000,
    bonus_allowance: 1000,
    advance_loan_deduction: 0,
    payment_method: 'bank',
    account_details: ''
  });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const [disbursingVoucher, setDisbursingVoucher] = useState<any>(null);
  const [disburseMethod, setDisburseMethod] = useState<'cash' | 'bank' | 'bkash' | 'nagad'>('cash');
  const [disburseRef, setDisburseRef] = useState('');
  const [isDisbursing, setIsDisbursing] = useState(false);

  const [selectedPayslipData, setSelectedPayslipData] = useState<any>(null);
  const [isLoadingPayslip, setIsLoadingPayslip] = useState(false);

  const fetchVouchers = async () => {
    if (isTeacherOrStaff) return;
    setIsLoading(true);
    try {
      let url = `/api/v1/payroll/vouchers?year=${selectedYear}`;
      if (selectedMonth && selectedMonth !== 'all') url += `&month=${encodeURIComponent(selectedMonth)}`;
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
      const res = await apiCall(url);
      setVouchers(res?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch vouchers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    if (isTeacherOrStaff) return;
    try {
      const res = await apiCall('/api/v1/payroll/profiles');
      setProfiles(res?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  const fetchMyPayslips = async () => {
    try {
      const res = await apiCall('/api/v1/payroll/my-payslips');
      setMyPayslips(res?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch my payslips:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'vouchers' && !isTeacherOrStaff) {
      fetchVouchers();
    } else if (activeTab === 'profiles' && !isTeacherOrStaff) {
      fetchProfiles();
    } else if (activeTab === 'my_payslips') {
      fetchMyPayslips();
    }
  }, [activeTab, selectedMonth, selectedYear, statusFilter]);

  const handleGenerateVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage(null);
    try {
      const res = await apiCall('/api/v1/payroll/vouchers/generate-monthly', {
        method: 'POST',
        body: JSON.stringify({ month: genMonth, year: genYear })
      });
      setMessage({
        type: 'success',
        text: `সফলভাবে ${res.count || res.data?.length || 0} টি মাসিক বেতন ভাউচার ড্রাফট তৈরি করা হয়েছে।`
      });
      setShowGenerateModal(false);
      fetchVouchers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ভাউচার তৈরিতে ত্রুটি দেখা দিয়েছে।' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProfile(true);
    setMessage(null);
    try {
      await apiCall('/api/v1/payroll/profiles', {
        method: 'POST',
        body: JSON.stringify(newProfile)
      });
      setMessage({ type: 'success', text: 'নতুন বেতন কাঠামো সফলভাবে সংরক্ষিত হয়েছে।' });
      setShowCreateProfileModal(false);
      fetchProfiles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'প্রোফাইল তৈরিতে ত্রুটি দেখা দিয়েছে।' });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleVerify = async (voucherId: string) => {
    try {
      await apiCall(`/api/v1/payroll/vouchers/${voucherId}/verify`, { method: 'POST' });
      setMessage({ type: 'success', text: 'ভাউচারটি সফলভাবে হিসাবরক্ষক কর্তৃক যাচাই করা হয়েছে।' });
      fetchVouchers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'যাচাইকরণে ত্রুটি দেখা দিয়েছে।' });
    }
  };

  const handleApprove = async (voucherId: string) => {
    try {
      await apiCall(`/api/v1/payroll/vouchers/${voucherId}/approve`, { method: 'POST' });
      setMessage({ type: 'success', text: 'ভাউচারটি মুহতামিম কর্তৃক সফলভাবে অনুমোদিত হয়েছে।' });
      fetchVouchers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'অনুমোদনে ত্রুটি দেখা দিয়েছে।' });
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingVoucher) return;
    setIsDisbursing(true);
    try {
      await apiCall(`/api/v1/payroll/vouchers/${disbursingVoucher.id}/disburse`, {
        method: 'POST',
        body: JSON.stringify({
          disbursement_method: disburseMethod,
          transaction_reference: disburseRef || `REF_SAL_${Date.now()}`
        })
      });
      setMessage({ type: 'success', text: 'বেতন সফলভাবে পরিশোধ করা হয়েছে এবং ক্যাশ বইতে লিপিবদ্ধ হয়েছে।' });
      setDisbursingVoucher(null);
      fetchVouchers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'পরিশোধে ত্রুটি দেখা দিয়েছে।' });
    } finally {
      setIsDisbursing(false);
    }
  };

  const handleViewPayslip = async (voucherId: string) => {
    setIsLoadingPayslip(true);
    try {
      const res = await apiCall(`/api/v1/payroll/vouchers/${voucherId}/payslip`);
      setSelectedPayslipData(res.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'বেতন রসিদ লোড করা যায়নি।' });
    } finally {
      setIsLoadingPayslip(false);
    }
  };

  // Calculation summaries
  const totalNetBudget = vouchers.reduce((acc, v) => acc + (v.net_payable || 0), 0);
  const totalDisbursed = vouchers
    .filter((v) => v.status === 'disbursed')
    .reduce((acc, v) => acc + (v.net_payable || 0), 0);
  const pendingApprovalCount = vouchers.filter(
    (v) => v.status === 'accountant_verified' || v.status === 'draft'
  ).length;

  const filteredVouchers = vouchers.filter((v) => {
    if (!searchQuery) return true;
    return (
      v.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.voucher_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                ওস্তাদ ও কর্মচারীদের মাসিক বেতন ও ভাতা (Payroll)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                পদবীভিত্তিক বেতন কাঠামো, বহুস্তরীয় অনুমোদন চক্র (যাচাইকরণ → অনুমোদন → পরিশোধ) ও কিউআর রসিদ
              </p>
            </div>
          </div>

          {!isTeacherOrStaff && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
              >
                <RefreshCw className="w-4 h-4" />
                মাসিক ভাউচার তৈরি
              </button>
              <button
                onClick={() => setShowCreateProfileModal(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
              >
                <PlusCircle className="w-4 h-4" />
                নতুন বেতন কাঠামো
              </button>
            </div>
          )}
        </div>

        {/* Global Alert Notification */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Financial Metrics Cards (Visible to Admin & Accountants) */}
        {!isTeacherOrStaff && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500">মোট বেতন বাজেট ({selectedMonth})</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                ৳{totalNetBudget.toLocaleString('bn-BD')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">মোট প্রস্তুতকৃত ভাউচার: {vouchers.length} টি</div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">পরিশোধিত বেতন</div>
              <div className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                ৳{totalDisbursed.toLocaleString('bn-BD')}
              </div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">ক্যাশ ও ব্যাংক ডিসবার্সমেন্ট</div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40">
              <div className="text-[11px] font-medium text-amber-800 dark:text-amber-400">অনুমোদনের অপেক্ষায়</div>
              <div className="text-lg font-bold text-amber-800 dark:text-amber-300 mt-1">
                {pendingApprovalCount} টি ভাউচার
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">হিসাবরক্ষক / মুহতামিম যাচাই সাপেক্ষে</div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/40">
              <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400">মোট সক্রিয় স্টাফ প্রোফাইল</div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-300 mt-1">
                {profiles.length > 0 ? profiles.length : 8} জন ওস্তাদ ও কর্মচারী
              </div>
              <div className="text-[10px] text-blue-600/80 mt-0.5">৮টি নির্ধারিত পদবী তালিকাভুক্ত</div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mt-6 pt-2">
          {!isTeacherOrStaff && (
            <>
              <button
                onClick={() => setActiveTab('vouchers')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'vouchers'
                    ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                মাসিক ভাউচার ও অনুমোদন চক্র
              </button>
              <button
                onClick={() => setActiveTab('profiles')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'profiles'
                    ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                ওস্তাদ ও কর্মচারী বেতন কাঠামো ({profiles.length})
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('my_payslips')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'my_payslips'
                ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isTeacherOrStaff ? 'আমার মাসিক বেতন রসিদ (My Payslips)' : 'ব্যক্তিগত বেতন রসিদ'}
          </button>
        </div>
      </div>

      {/* TAB 1: MONTHLY VOUCHERS TABLE */}
      {activeTab === 'vouchers' && !isTeacherOrStaff && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="সব মাস">সব মাস</option>
                  <option value="জুলাই">জুলাই</option>
                  <option value="আগস্ট">আগস্ট</option>
                  <option value="সেপ্টেম্বর">সেপ্টেম্বর</option>
                  <option value="অক্টোবর">অক্টোবর</option>
                  <option value="নভেম্বর">নভেম্বর</option>
                  <option value="ডিসেম্বর">ডিসেম্বর</option>
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="2026">২০২৬</option>
                  <option value="2025">২০২৫</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500">অবস্থা:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">সকল অবস্থা</option>
                  <option value="draft">খসড়া (Draft)</option>
                  <option value="accountant_verified">যাচাইকৃত (Verified)</option>
                  <option value="muhtamim_approved">অনুমোদিত (Approved)</option>
                  <option value="disbursed">পরিশোধিত (Disbursed)</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="নাম বা ভাউচার নং দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none w-56 text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">ভাউচার নম্বর</th>
                  <th className="py-3.5 px-4">স্টাফের নাম ও পদবী</th>
                  <th className="py-3.5 px-4">মাস ও সন</th>
                  <th className="py-3.5 px-4 text-right">মূল বেতন</th>
                  <th className="py-3.5 px-4 text-right">ভাতা মোট</th>
                  <th className="py-3.5 px-4 text-right">কর্তন</th>
                  <th className="py-3.5 px-4 text-right">সর্বমোট প্রদেয়</th>
                  <th className="py-3.5 px-4 text-center">অবস্থা</th>
                  <th className="py-3.5 px-4 text-center">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      ভাউচার তালিকা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      কোন বেতন ভাউচার পাওয়া যায়নি। "মাসিক ভাউচার তৈরি" বাটনে ক্লিক করে খসড়া তৈরি করুন।
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => {
                    const badge = statusBadges[v.status] || statusBadges.draft;
                    const totalAllowances =
                      (v.housing_allowance || 0) + (v.food_allowance || 0) + (v.bonus_allowance || 0);
                    const totalDeductions =
                      (v.advance_loan_deduction || 0) + (v.absent_deduction || 0);

                    // Workflow action permissions
                    const canVerify =
                      v.status === 'draft' &&
                      ['accountant', 'madrasa_admin', 'super_admin'].includes(user.role);

                    const canApprove =
                      v.status === 'accountant_verified' &&
                      ['principal', 'madrasa_admin', 'super_admin'].includes(user.role);

                    const canDisburse =
                      v.status === 'muhtamim_approved' &&
                      ['accountant', 'madrasa_admin', 'super_admin'].includes(user.role);

                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                          {v.voucher_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{v.staff_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {designationLabels[v.designation] || v.designation}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {v.month} {v.year}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ৳{v.base_salary.toLocaleString('bn-BD')}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                          +৳{totalAllowances.toLocaleString('bn-BD')}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-medium">
                          {totalDeductions > 0 ? `-৳${totalDeductions.toLocaleString('bn-BD')}` : '৳০'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          ৳{v.net_payable.toLocaleString('bn-BD')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                          {/* Step 1: Verify */}
                          {canVerify && (
                            <button
                              onClick={() => handleVerify(v.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] shadow-sm transition"
                            >
                              যাচাই করুন
                            </button>
                          )}

                          {/* Step 2: Approve */}
                          {canApprove && (
                            <button
                              onClick={() => handleApprove(v.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] shadow-sm transition"
                            >
                              অনুমোদন করুন
                            </button>
                          )}

                          {/* Step 3: Disburse */}
                          {canDisburse && (
                            <button
                              onClick={() => {
                                setDisbursingVoucher(v);
                                setDisburseRef(`TRX_${v.voucher_number.replace(/-/g, '_')}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] shadow-sm transition"
                            >
                              পরিশোধ করুন
                            </button>
                          )}

                          {/* Payslip View */}
                          <button
                            onClick={() => handleViewPayslip(v.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            রসিদ
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILES OVERVIEW */}
      {activeTab === 'profiles' && !isTeacherOrStaff && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profiles.map((p) => {
              const totalGross =
                (p.base_salary || 0) +
                (p.housing_allowance || 0) +
                (p.food_allowance || 0) +
                (p.bonus_allowance || 0);
              const net = totalGross - (p.advance_loan_deduction || 0);

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{p.staff_name}</h3>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {designationLabels[p.designation] || p.designation}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                        {paymentMethodLabels[p.payment_method] || p.payment_method}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span>মূল বেতন:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          ৳{p.base_salary.toLocaleString('bn-BD')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>বাড়ি ভাড়া ভাতা:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          ৳{p.housing_allowance.toLocaleString('bn-BD')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>খোরাকি ভাতা:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          ৳{p.food_allowance.toLocaleString('bn-BD')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>বোনাস / বিশেষ:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          ৳{p.bonus_allowance.toLocaleString('bn-BD')}
                        </span>
                      </div>
                      {p.advance_loan_deduction > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>ঋণ কর্তন:</span>
                          <span className="font-semibold">-৳{p.advance_loan_deduction.toLocaleString('bn-BD')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">নিট প্রদেয় বেতন</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      ৳{net.toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY PAYSLIPS (Self-Service) */}
      {activeTab === 'my_payslips' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              আপনার ব্যক্তিগত বেতন ও ভাউচার রসিদ তালিকা
            </h2>
            <button
              onClick={fetchMyPayslips}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              রিলোড
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ভাউচার নম্বর</th>
                  <th className="py-3 px-4">মাস ও সন</th>
                  <th className="py-3 px-4 text-right">মূল বেতন</th>
                  <th className="py-3 px-4 text-right">মোট ভাতা</th>
                  <th className="py-3 px-4 text-right">কর্তন</th>
                  <th className="py-3 px-4 text-right">সর্বমোট প্রদেয়</th>
                  <th className="py-3 px-4 text-center">অবস্থা</th>
                  <th className="py-3 px-4 text-center">রসিদ ও প্রিন্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {myPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      কোন বেতন রসিদ রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  myPayslips.map((v) => {
                    const badge = statusBadges[v.status] || statusBadges.draft;
                    const totalAllowances =
                      (v.housing_allowance || 0) + (v.food_allowance || 0) + (v.bonus_allowance || 0);
                    const totalDeductions =
                      (v.advance_loan_deduction || 0) + (v.absent_deduction || 0);

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                          {v.voucher_number}
                        </td>
                        <td className="py-3 px-4">
                          {v.month} {v.year}
                        </td>
                        <td className="py-3 px-4 text-right">৳{v.base_salary.toLocaleString('bn-BD')}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">
                          +৳{totalAllowances.toLocaleString('bn-BD')}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600">
                          {totalDeductions > 0 ? `-৳${totalDeductions.toLocaleString('bn-BD')}` : '৳০'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          ৳{v.net_payable.toLocaleString('bn-BD')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleViewPayslip(v.id)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            রসিদ প্রিন্ট
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE MONTHLY VOUCHERS */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                মাসিক বেতন ভাউচার ড্রাফট তৈরি
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateVouchers} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                সকল সক্রিয় ওস্তাদ ও কর্মচারীদের নির্ধারিত বেতন কাঠামো অনুযায়ী স্বয়ংক্রিয়ভাবে নতুন ভাউচার ড্রাফট তৈরি হবে।
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">মাসের নাম</label>
                <select
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="জুলাই">জুলাই</option>
                  <option value="আগস্ট">আগস্ট</option>
                  <option value="সেপ্টেম্বর">সেপ্টেম্বর</option>
                  <option value="অক্টোবর">অক্টোবর</option>
                  <option value="নভেম্বর">নভেম্বর</option>
                  <option value="ডিসেম্বর">ডিসেম্বর</option>
                  <option value="জানুয়ারি">জানুয়ারি</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">বছর</label>
                <input
                  type="number"
                  value={genYear}
                  onChange={(e) => setGenYear(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition disabled:opacity-50"
                >
                  {isGenerating ? 'ড্রাফট তৈরি হচ্ছে...' : 'ভাউচার তৈরি নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE STAFF PROFILE */}
      {showCreateProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                নতুন ওস্তাদ/স্টাফ বেতন কাঠামো তৈরি
              </h3>
              <button
                onClick={() => setShowCreateProfileModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">স্টাফের পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাওলানা আব্দুর রহমান"
                  value={newProfile.staff_name}
                  onChange={(e) => setNewProfile({ ...newProfile, staff_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">পদবী</label>
                  <select
                    value={newProfile.designation}
                    onChange={(e) => setNewProfile({ ...newProfile, designation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {Object.entries(designationLabels).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">মূল বেতন (৳)</label>
                  <input
                    type="number"
                    required
                    value={newProfile.base_salary}
                    onChange={(e) => setNewProfile({ ...newProfile, base_salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">বাড়ি ভাড়া ভাতা (৳)</label>
                  <input
                    type="number"
                    value={newProfile.housing_allowance}
                    onChange={(e) => setNewProfile({ ...newProfile, housing_allowance: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">খোরাকি ভাতা (৳)</label>
                  <input
                    type="number"
                    value={newProfile.food_allowance}
                    onChange={(e) => setNewProfile({ ...newProfile, food_allowance: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">বোনাস/বিশেষ (৳)</label>
                  <input
                    type="number"
                    value={newProfile.bonus_allowance}
                    onChange={(e) => setNewProfile({ ...newProfile, bonus_allowance: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    অগ্রিম/ঋণ মাসিক কর্তন (৳)
                  </label>
                  <input
                    type="number"
                    value={newProfile.advance_loan_deduction}
                    onChange={(e) => setNewProfile({ ...newProfile, advance_loan_deduction: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">পরিশোধের মাধ্যম</label>
                  <select
                    value={newProfile.payment_method}
                    onChange={(e) => setNewProfile({ ...newProfile, payment_method: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="bank">ব্যাংক একাউন্ট</option>
                    <option value="cash">নগদ ক্যাশ</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  একাউন্ট / মোবাইল নম্বর বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: IBBL-205011... অথবা 01711..."
                  value={newProfile.account_details}
                  onChange={(e) => setNewProfile({ ...newProfile, account_details: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProfile}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition disabled:opacity-50"
                >
                  {isCreatingProfile ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISBURSE SALARY MODAL */}
      {disbursingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                বেতন পরিশোধ নিশ্চিতকরণ
              </h3>
              <button onClick={() => setDisbursingVoucher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="mt-4 space-y-4 text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">প্রাপকের বিবরণ:</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {disbursingVoucher.staff_name} ({designationLabels[disbursingVoucher.designation] || disbursingVoucher.designation})
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-1 flex justify-between">
                  <span>ভাউচার: {disbursingVoucher.voucher_number}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    প্রদেয়: ৳{disbursingVoucher.net_payable.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">পরিশোধের মাধ্যম</label>
                <select
                  value={disburseMethod}
                  onChange={(e: any) => setDisburseMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="cash">নগদ ক্যাশ (দৈনিক ক্যাশ বই থেকে খরচ)</option>
                  <option value="bank">ব্যাংক স্থানান্তর (ব্যাংক লেজার)</option>
                  <option value="bkash">বিকাশ (MFS)</option>
                  <option value="nagad">নগদ (MFS)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  ট্রানজেকশন / চেক রেফারেন্স নম্বর
                </label>
                <input
                  type="text"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  placeholder="যেমন: TRX_SAL_12345"
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDisbursingVoucher(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isDisbursing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition disabled:opacity-50"
                >
                  {isDisbursing ? 'পরিশোধ প্রক্রিয়া চলছে...' : 'পরিশোধ সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: OFFICIAL BENGALI PAYSLIP VOUCHER WITH QR CODE */}
      {selectedPayslipData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ডিজিটাল কিউআর যাচাইকৃত অফিশিয়াল বেতন রসিদ
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট করুন
                </button>
                <button
                  onClick={() => setSelectedPayslipData(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div className="border-2 border-emerald-900/40 rounded-2xl p-6 bg-amber-50/20 dark:bg-slate-850 relative">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-emerald-800/30 pb-4">
                <div className="text-[11px] text-emerald-800 font-semibold tracking-wide">
                  {selectedPayslipData.organizationName}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedPayslipData.institutionNameBn}
                </h2>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {settings.address || 'মিরপুর-৬, ঢাকা-১২১৬'}{settings.phone ? ` | ফোন: ${settings.phone}` : ''}
                </div>
                <div className="inline-block mt-2 bg-emerald-800 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  ওস্তাদ ও কর্মচারী মাসিক বেতন ও ভাতা পরিশোধ ভাউচার
                </div>
              </div>

              {/* Voucher Meta Info */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <div>
                    <span className="font-semibold text-slate-500">ভাউচার নম্বর:</span>{' '}
                    <span className="font-mono font-bold">{selectedPayslipData.voucher.voucher_number}</span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-slate-500">প্রাপকের নাম:</span>{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedPayslipData.voucher.staff_name}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-slate-500">পদবী:</span>{' '}
                    <span>
                      {designationLabels[selectedPayslipData.voucher.designation] ||
                        selectedPayslipData.voucher.designation}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div>
                    <span className="font-semibold text-slate-500">মাস ও সন:</span>{' '}
                    <span className="font-bold">
                      {selectedPayslipData.voucher.month} {selectedPayslipData.voucher.year}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-slate-500">ভাউচারের অবস্থা:</span>{' '}
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {statusBadges[selectedPayslipData.voucher.status]?.label || selectedPayslipData.voucher.status}
                    </span>
                  </div>
                  {selectedPayslipData.voucher.disbursed_at && (
                    <div className="mt-1">
                      <span className="font-semibold text-slate-500">পরিশোধের তারিখ:</span>{' '}
                      <span>{selectedPayslipData.voucher.disbursed_at.split('T')[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Two-Column Salary Breakdown Table */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left: Earnings */}
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5">
                    মূল বেতন ও ভাতাসমূহ (Earnings)
                  </div>
                  <div className="p-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>মূল বেতন (Base Salary):</span>
                      <span className="font-medium">
                        ৳{selectedPayslipData.voucher.base_salary.toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>বাড়ি ভাড়া ভাতা (Housing):</span>
                      <span className="font-medium">
                        ৳{selectedPayslipData.voucher.housing_allowance.toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>খোরাকি ভাতা (Food/Mess):</span>
                      <span className="font-medium">
                        ৳{selectedPayslipData.voucher.food_allowance.toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>বোনাস / বিশেষ ভাতা:</span>
                      <span className="font-medium">
                        ৳{selectedPayslipData.voucher.bonus_allowance.toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <span>মোট উপার্জিত:</span>
                      <span>
                        ৳
                        {(
                          selectedPayslipData.voucher.base_salary +
                          selectedPayslipData.voucher.housing_allowance +
                          selectedPayslipData.voucher.food_allowance +
                          selectedPayslipData.voucher.bonus_allowance
                        ).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Deductions */}
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-rose-800 text-white text-[11px] font-bold px-3 py-1.5">
                    কর্তনসমূহ (Deductions)
                  </div>
                  <div className="p-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>অগ্রিম / ঋণ কর্তন (Loan):</span>
                      <span className="font-medium text-rose-600">
                        ৳{selectedPayslipData.voucher.advance_loan_deduction.toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>অনুপস্থিতি কর্তন (Absence):</span>
                      <span className="font-medium text-rose-600">
                        ৳{selectedPayslipData.voucher.absent_deduction.toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold text-rose-700 dark:text-rose-400">
                      <span>মোট কর্তন:</span>
                      <span>
                        ৳
                        {(
                          selectedPayslipData.voucher.advance_loan_deduction +
                          selectedPayslipData.voucher.absent_deduction
                        ).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="mt-4 bg-emerald-100/60 dark:bg-emerald-950/40 border-2 border-emerald-600 rounded-xl p-3 flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                <span className="font-bold text-sm">সর্বমোট নিট প্রদেয় বেতন (Net Payable):</span>
                <span className="text-xl font-extrabold font-mono">
                  ৳{selectedPayslipData.voucher.net_payable.toLocaleString('bn-BD')}
                </span>
              </div>

              {/* Payment Details */}
              {selectedPayslipData.voucher.disbursement_method && (
                <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-2 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-semibold">পরিশোধ মাধ্যম:</span>{' '}
                    {paymentMethodLabels[selectedPayslipData.voucher.disbursement_method] ||
                      selectedPayslipData.voucher.disbursement_method}
                  </div>
                  <div>
                    <span className="font-semibold">লেনদেন আইডি:</span>{' '}
                    <span className="font-mono">{selectedPayslipData.voucher.transaction_reference}</span>
                  </div>
                </div>
              )}

              {/* QR Verification & Signatures */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* QR Code Graphic Proof */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-20 h-20 bg-white border rounded-lg flex items-center justify-center p-1">
                    <img src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1'}/qr/payslip/${selectedPayslipData.voucher.id}`} className="w-full h-full object-contain" alt="QR Code" />
                  </div>
                  <div className="text-[10px] space-y-0.5">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      HMAC SHA-256 ভ্যালিডেশন
                    </div>
                    <div className="font-mono text-[9px] text-slate-500 truncate max-w-[180px]">
                      {selectedPayslipData.qrCodeToken}
                    </div>
                    <div className="text-[8px] text-slate-400">ডিজিটাল স্ক্যানে সত্যতা যাচাইযোগ্য</div>
                  </div>
                </div>

                {/* Signature Blocks */}
                <div className="grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600 dark:text-slate-400 mt-4 sm:mt-0">
                  <div>
                    <div className="w-20 border-b border-slate-400 mx-auto mb-1"></div>
                    <div>হিসাবরক্ষক</div>
                  </div>
                  <div>
                    <div className="w-20 border-b border-slate-400 mx-auto mb-1"></div>
                    <div>মুহতামিম</div>
                  </div>
                  <div>
                    <div className="w-20 border-b border-slate-400 mx-auto mb-1"></div>
                    <div>গ্রহীতার স্বাক্ষর</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 print:hidden">
                <PhotoGallery 
                  type="payslip" 
                  refId={selectedPayslipData.voucher.id} 
                  buttonLabel="বেতন স্লিপের ছবি তুলুন"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
