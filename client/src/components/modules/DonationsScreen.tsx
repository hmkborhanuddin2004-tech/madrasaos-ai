import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  HeartHandshake,
  Shield,
  Building2,
  Landmark,
  PlusCircle,
  Search,
  Printer,
  X,
  CheckCircle2,
  UserPlus,
  Phone,
  MessageSquare,
  AlertTriangle,
  Receipt
} from 'lucide-react';

export const DonationsScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const { settings } = useSettings();

  const [fundsSummary, setFundsSummary] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New Donation Modal
  const [showDonationModal, setShowDonationModal] = useState<boolean>(false);
  const [selectedDonorId, setSelectedDonorId] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<'lillah_orphan' | 'general' | 'waqf_construction'>('lillah_orphan');
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [donationNotes, setDonationNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdReceipt, setCreatedReceipt] = useState<any>(null);

  // Register Donor Modal
  const [showDonorModal, setShowDonorModal] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>('');
  const [donorOrg, setDonorOrg] = useState<string>('');
  const [donorCategory, setDonorCategory] = useState<string>('permanent');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [donorWhatsapp, setDonorWhatsapp] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorCommitment, setDonorCommitment] = useState<string>('monthly');

  // Print voucher modal
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const summary = await apiCall('/api/v1/finance/donations/funds/summary');
      setFundsSummary(summary);

      const donorList = await apiCall('/api/v1/finance/donations/donors');
      setDonors(donorList || []);

      const receiptList = await apiCall('/api/v1/finance/donations/receipts');
      setReceipts(receiptList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorId || donationAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        donor_id: selectedDonorId,
        fund_type: selectedFund,
        amount: donationAmount,
        payment_method: paymentMethod,
        payment_reference: paymentRef || undefined,
        notes: donationNotes || undefined
      };
      const res = await apiCall('/api/v1/finance/donations/receipts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCreatedReceipt(res);
      setPrintReceiptData(res);
      loadData();
    } catch (err: any) {
      alert(err.message || 'অনুদান সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: donorName,
        org_name: donorOrg || undefined,
        category: donorCategory,
        contact_phone: donorPhone || undefined,
        whatsapp: donorWhatsapp || undefined,
        email: donorEmail || undefined,
        commitment_frequency: donorCommitment
      };
      const res = await apiCall('/api/v1/finance/donations/donors', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowDonorModal(false);
      // Reset form
      setDonorName('');
      setDonorOrg('');
      setDonorPhone('');
      setDonorWhatsapp('');
      setDonorEmail('');
      loadData();
      alert(`দাতা "${res.name}" সফলভাবে নিবন্ধিত হয়েছেন।`);
    } catch (err: any) {
      alert(err.message || 'দাতা নিবন্ধন ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.org_name && d.org_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.contact_phone && d.contact_phone.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Numbers to Bengali Words converter helper
  const amountToBanglaWords = (num: number): string => {
    if (!num) return 'শূন্য টাকা মাত্র';
    return `${num.toLocaleString('bn-BD')} টাকা মাত্র`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <HeartHandshake className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              দান, অনুদান ও ওয়াকফ তহবিল ব্যবস্থাপনা
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            মাদ্রাসার লিল্লাহ বোর্ডিং ও এতিম তহবিল, সাধারণ তহবিল এবং ওয়াকফ ও ভবন নির্মাণ তহবিলের কঠোর পৃথক সংরক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDonorModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-700" />
            <span>নতুন দাতা নিবন্ধন</span>
          </button>
          <button
            onClick={() => {
              setSelectedDonorId(donors[0]?.id || '');
              setCreatedReceipt(null);
              setShowDonationModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-emerald-700/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন অনুদান গ্রহণ (POS)</span>
          </button>
        </div>
      </div>

      {/* 3 Ring-Fenced Fund Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Lillah & Orphan Fund */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Shield className="w-28 h-28 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-700" />
                <span>কঠোরভাবে সংরক্ষিত (Ring-Fenced)</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {fundsSummary?.funds?.lillah_orphan?.count || 0} টি রসিদ
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              লিল্লাহ বোর্ডিং ও এতিম তহবিল
            </h3>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              যাকাত, ফিতরা, চামড়া ও ছদকা
            </div>
            <p className="text-[11px] text-slate-500 mt-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/60 leading-relaxed">
              ⚠️ শরীয়াহ বিধান অনুযায়ী এই তহবিলের অর্থ কেবলমাত্র দরিদ্র ও এতিম আবাসিক ছাত্রদের খাদ্য ও জরুরি প্রয়োজনে ব্যয়যোগ্য।
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">মোট সংগৃহীত তহবিল</div>
              <div className="text-2xl font-bold text-emerald-700 mt-0.5">
                ৳{(fundsSummary?.funds?.lillah_orphan?.total_amount || 0).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFund('lillah_orphan');
                setSelectedDonorId(donors[0]?.id || '');
                setShowDonationModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              দান গ্রহণ
            </button>
          </div>
        </div>

        {/* Card 2: General Operational Fund */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-blue-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Building2 className="w-28 h-28 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-700" />
                <span>সাধারণ প্রাতিষ্ঠানিক পরিচালনা</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {fundsSummary?.funds?.general?.count || 0} টি রসিদ
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              সাধারণ মাদ্রাসা তহবিল
            </h3>
            <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
              বিদ্যুৎ, গ্যাস, সাধারণ মেরামত ও অফিস
            </div>
            <p className="text-[11px] text-slate-500 mt-2 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100/60 leading-relaxed">
              মাদ্রাসার নিয়মিত পরিচালন ব্যয়, বিদ্যুৎ বিল, ওয়াটার পাম্প মেরামত ও সাধারণ প্রশাসনিক ওভারহেড।
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">মোট সংগৃহীত তহবিল</div>
              <div className="text-2xl font-bold text-blue-700 mt-0.5">
                ৳{(fundsSummary?.funds?.general?.total_amount || 0).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFund('general');
                setSelectedDonorId(donors[0]?.id || '');
                setShowDonationModal(true);
              }}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              দান গ্রহণ
            </button>
          </div>
        </div>

        {/* Card 3: Construction & Waqf Fund */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-purple-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Landmark className="w-28 h-28 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Landmark className="w-3 h-3 text-purple-700" />
                <span>স্থায়ী ওয়াকফ ও ভবন নির্মাণ</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {fundsSummary?.funds?.waqf_construction?.count || 0} টি রসিদ
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ভবন নির্মাণ ও ওয়াকফ তহবিল
            </h3>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              বহুতল ছাত্রাবাস, মসজিদ ও স্থায়ী জমি
            </div>
            <p className="text-[11px] text-slate-500 mt-2 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100/60 leading-relaxed">
              মাদ্রাসার স্থায়ী জমি ক্রয়, বহুতল আবাসিক ছাত্রাবাস ও কেন্দ্রীয় জামে মসজিদ নির্মাণে নিয়োজিত।
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">মোট সংগৃহীত তহবিল</div>
              <div className="text-2xl font-bold text-purple-700 mt-0.5">
                ৳{(fundsSummary?.funds?.waqf_construction?.total_amount || 0).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFund('waqf_construction');
                setSelectedDonorId(donors[0]?.id || '');
                setShowDonationModal(true);
              }}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              দান গ্রহণ
            </button>
          </div>
        </div>
      </div>

      {/* Donor Registry & Recent Receipts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Donor Registry (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">সম্মানিত দাতা তালিকা (Donor Registry)</h2>
              <p className="text-xs text-slate-500">মাদ্রাসার আজীবন, বার্ষিক ও নিয়মিত দানশীল শুভাকাঙ্ক্ষীবৃন্দ</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="দাতার নাম বা মোবাইল..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'সকল দাতা' },
              { id: 'permanent', label: 'আজীবন দাতা' },
              { id: 'annual', label: 'বার্ষিক দাতা' },
              { id: 'one_time', label: 'এককালীন' },
              { id: 'anonymous', label: 'বেনামী' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  categoryFilter === tab.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Donors Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">দাতার নাম ও প্রতিষ্ঠান</th>
                  <th className="py-2.5 px-3">শ্রেণি</th>
                  <th className="py-2.5 px-3">মোবাইল ও যোগাযোগ</th>
                  <th className="py-2.5 px-3">অঙ্গীকার</th>
                  <th className="py-2.5 px-3 text-center">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      {d.org_name && <div className="text-[10px] text-slate-500">{d.org_name}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.category === 'permanent'
                            ? 'bg-purple-100 text-purple-800'
                            : d.category === 'annual'
                            ? 'bg-teal-100 text-teal-800'
                            : d.category === 'anonymous'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {d.category === 'permanent'
                          ? 'আজীবন দাতা'
                          : d.category === 'annual'
                          ? 'বার্ষিক দাতা'
                          : d.category === 'anonymous'
                          ? 'বেনামী'
                          : 'এককালীন'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-700">{d.contact_phone || '—'}</div>
                      {d.whatsapp && (
                        <a
                          href={`https://wa.me/88${d.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:underline mt-0.5"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-600 capitalize">
                        {d.commitment_frequency === 'monthly'
                          ? 'প্রতি মাসে'
                          : d.commitment_frequency === 'annual'
                          ? 'প্রতি বছর'
                          : 'প্রযোজ্য নয়'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedDonorId(d.id);
                          setCreatedReceipt(null);
                          setShowDonationModal(true);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-3 py-1 rounded-xl text-[11px] transition shadow-xs"
                      >
                        অনুদান গ্রহণ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Donation Receipts (1 col) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">সাম্প্রতিক রসিদ সমূহ</h2>
              <p className="text-xs text-slate-500">সর্বশেষ প্রদত্ত অফিসিয়াল মানি রিসিট</p>
            </div>
            <Receipt className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-3">
            {receipts.slice(0, 6).map((rcp) => (
              <div
                key={rcp.id}
                className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition"
              >
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-800">{rcp.receipt_no}</div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">{rcp.donor_name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        rcp.fund_type === 'lillah_orphan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rcp.fund_type === 'waqf_construction'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rcp.fund_type === 'lillah_orphan'
                        ? 'লিল্লাহ ও এতিম'
                        : rcp.fund_type === 'waqf_construction'
                        ? 'ওয়াকফ ও নির্মাণ'
                        : 'সাধারণ'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{rcp.payment_method}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-emerald-700">৳{rcp.amount.toLocaleString()}</div>
                  <button
                    onClick={() => setPrintReceiptData(rcp)}
                    className="mt-1 flex items-center gap-1 text-[11px] text-slate-600 hover:text-emerald-700 transition"
                  >
                    <Printer className="w-3 h-3" />
                    <span>প্রিন্ট</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <span>নতুন দান ও অনুদান গ্রহণ (POS)</span>
              </h3>
              <button
                onClick={() => {
                  setShowDonationModal(false);
                  setCreatedReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdReceipt ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <div className="font-bold text-base text-emerald-950">অনুদান সফলভাবে গৃহীত হয়েছে!</div>
                <div className="text-xs text-slate-600">
                  অফিসিয়াল রসিদ নম্বর: <span className="font-mono font-bold text-slate-900">{createdReceipt.receipt_no}</span>
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  পরিমাণ: ৳{createdReceipt.amount.toLocaleString()} ({createdReceipt.fund_type === 'lillah_orphan' ? 'লিল্লাহ ও এতিম তহবিল' : createdReceipt.fund_type === 'waqf_construction' ? 'ভবন নির্মাণ ও ওয়াকফ' : 'সাধারণ প্রাতিষ্ঠানিক তহবিল'})
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setPrintReceiptData(createdReceipt);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>মানি রিসিট প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDonationModal(false);
                      setCreatedReceipt(null);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateDonation} className="space-y-4 text-xs">
                {/* Donor Selection */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">দাতা নির্বাচন করুন *</label>
                  <select
                    required
                    value={selectedDonorId}
                    onChange={(e) => setSelectedDonorId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  >
                    <option value="">-- দাতা নির্বাচন করুন --</option>
                    {donors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.org_name ? `(${d.org_name})` : ''} - {d.contact_phone || 'ফোন নেই'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Fund Radio Cards */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1.5">টার্গেট তহবিল নির্ধারণ করুন *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFund('lillah_orphan')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedFund === 'lillah_orphan'
                          ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🛡️ লিল্লাহ ও এতিম</div>
                      <div className="text-[10px] text-emerald-700 mt-1">যাকাত ও ফিতরা</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFund('general')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedFund === 'general'
                          ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50 text-blue-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🏢 সাধারণ তহবিল</div>
                      <div className="text-[10px] text-blue-700 mt-1">বিদ্যুৎ ও মেরামত</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFund('waqf_construction')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedFund === 'waqf_construction'
                          ? 'border-purple-600 ring-2 ring-purple-600 bg-purple-50 text-purple-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🕌 ওয়াকফ ও ভবন</div>
                      <div className="text-[10px] text-purple-700 mt-1">মসজিদ ও ছাত্রাবাস</div>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">অনুদানের পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-sm"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    কথায়: {amountToBanglaWords(donationAmount)}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">আদায়ের মাধ্যম *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'cash', label: 'নগদ ক্যাশ' },
                      { id: 'bkash', label: 'bKash' },
                      { id: 'nagad', label: 'Nagad' },
                      { id: 'bank', label: 'ব্যাংক জমা' }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`py-2 text-center text-xs font-bold rounded-xl border transition ${
                          paymentMethod === m.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction / Slip Reference */}
                {paymentMethod !== 'cash' && (
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">লেনদেন / ব্যাংক স্লিপ নম্বর</label>
                    <input
                      type="text"
                      placeholder="e.g. TRX-9021-X বা ব্যাংক জমা স্লিপ নং"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                    />
                  </div>
                )}

                {/* Notes / Dua */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">দোয়া ও মন্তব্য (রসিদে মুদ্রিত হবে)</label>
                  <input
                    type="text"
                    placeholder="যেমন: মরহুম পিতা-মাতার মাগফিরাত কামনায়..."
                    value={donationNotes}
                    onChange={(e) => setDonationNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowDonationModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'প্রসেস হচ্ছে...' : 'রসিদ ইস্যু করুন'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Register Donor Modal */}
      {showDonorModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>নতুন দাতা নিবন্ধন</span>
              </h3>
              <button onClick={() => setShowDonorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDonor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">দাতার পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আলহাজ্ব মুহাম্মদ সামসুল আলম"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">প্রতিষ্ঠানের নাম (যদি থাকে)</label>
                <input
                  type="text"
                  placeholder="যেমন: আলম টেক্সটাইল লিমিটেড"
                  value={donorOrg}
                  onChange={(e) => setDonorOrg(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">দাতার শ্রেণি *</label>
                <select
                  value={donorCategory}
                  onChange={(e) => setDonorCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="permanent">আজীবন দাতা (Permanent Donor)</option>
                  <option value="annual">বার্ষিক দাতা (Annual Donor)</option>
                  <option value="one_time">এককালীন দাতা (One-time)</option>
                  <option value="anonymous">বেনামী শুভাকাঙ্ক্ষী (Anonymous)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="017..."
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">হোয়াটসঅ্যাপ</label>
                  <input
                    type="text"
                    placeholder="017..."
                    value={donorWhatsapp}
                    onChange={(e) => setDonorWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  placeholder="donor@example.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">নিয়মিত অঙ্গীকার ফ্রিকোয়েন্সি</label>
                <select
                  value={donorCommitment}
                  onChange={(e) => setDonorCommitment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="none">কোনো নিয়মিত অঙ্গীকার নেই</option>
                  <option value="monthly">মাসিক অঙ্গীকার (Monthly)</option>
                  <option value="annual">বার্ষিক অঙ্গীকার (Annual)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDonorModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'দাতা নিবন্ধন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Money Receipt Modal */}
      {printReceiptData && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl p-8 shadow-2xl border border-slate-300 space-y-6 my-8 print:m-0 print:p-0 print:border-none">
            {/* Header with Bismillah */}
            <div className="text-center space-y-1 border-b-2 border-emerald-700 pb-4">
              <div className="text-sm font-arabic font-bold text-emerald-800">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {settings.nameBn || 'মাদ্রাসা ও এতিমখানা'}
              </h2>
              <div className="text-xs text-slate-600">
                {settings.address || 'ঢাকা'} • ফোন: {settings.phone || '০১৭১১১১১১১১'} • স্থাপিত: {settings.establishedYear || '১৯৯৮'} ইং
              </div>
              <div className="inline-block mt-2 px-3 py-1 bg-emerald-700 text-white font-bold text-xs rounded-full">
                অফিসিয়াল দান ও অনুদান জমা রসিদ (Money Receipt)
              </div>
            </div>

            {/* Receipt Info Grid */}
            <div className="grid grid-cols-2 text-xs gap-3">
              <div>
                <span className="text-slate-500">রসিদ নম্বর: </span>
                <span className="font-mono font-bold text-slate-900">{printReceiptData.receipt_no}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">তারিখ: </span>
                <span className="font-bold text-slate-900">
                  {printReceiptData.created_at ? new Date(printReceiptData.created_at).toLocaleDateString('bn-BD') : '২০ সেপ্টেম্বর ২০২৬ ইং'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">দাতার নাম: </span>
                <span className="font-bold text-slate-900">{printReceiptData.donor_name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">তহবিলের নাম: </span>
                <span className="font-bold text-emerald-800">
                  {printReceiptData.fund_type === 'lillah_orphan'
                    ? 'লিল্লাহ বোর্ডিং ও এতিম তহবিল'
                    : printReceiptData.fund_type === 'waqf_construction'
                    ? 'ভবন নির্মাণ ও ওয়াকফ তহবিল'
                    : 'সাধারণ প্রাতিষ্ঠানিক তহবিল'}
                </span>
              </div>
            </div>

            {/* Amount Box */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-600">গৃহীত অর্থের পরিমাণ</div>
                <div className="text-2xl font-bold text-emerald-800 font-mono">
                  ৳{printReceiptData.amount.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-600">কথায়:</div>
                <div className="font-bold text-slate-900">{amountToBanglaWords(printReceiptData.amount)}</div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="font-semibold text-slate-700">আদায়ের মাধ্যম: </span>
                <span className="capitalize">{printReceiptData.payment_method}</span>
                {printReceiptData.payment_reference && (
                  <span> (স্লিপ/TrxID: <span className="font-mono">{printReceiptData.payment_reference}</span>)</span>
                )}
              </div>
              {printReceiptData.notes && (
                <div>
                  <span className="font-semibold text-slate-700">দোয়া ও মন্তব্য: </span>
                  <span>{printReceiptData.notes}</span>
                </div>
              )}
            </div>

            {/* Signature Slots */}
            <div className="grid grid-cols-2 pt-12 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 w-36 mx-auto pt-1 font-semibold text-slate-700">
                  আদায়কারীর স্বাক্ষর
                </div>
                <div className="text-[10px] text-slate-500">মুহাম্মদ ফারুক হোসেন (হিসাবরক্ষক)</div>
              </div>
              <div>
                <div className="border-t border-slate-400 w-36 mx-auto pt-1 font-semibold text-slate-700">
                  মুহতামিম / সভাপতি
                </div>
                <div className="text-[10px] text-slate-500">{settings.principalName || 'মুহতামিম সাহেব'}</div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t print:hidden">
              <button
                onClick={() => setPrintReceiptData(null)}
                className="px-4 py-2 border rounded-xl text-slate-600 text-xs hover:bg-slate-50"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
