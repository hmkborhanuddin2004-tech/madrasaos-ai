import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExportButton } from '../common/ExportButton';
import { PhotoGallery } from '../common/PhotoGallery';
import { DocumentCapture } from '../common/DocumentCapture';
import { QrCodeDisplay } from '../common/QrCodeDisplay';
import { QrScanner } from '../common/QrScanner';
import {
  Receipt,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  X,
  AlertCircle,
  FileText,
  Shield,
  BookOpen,
  Building,
  Printer,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Download
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const FinanceScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const { settings, feeCategories } = useSettings();
  const currencySymbol = settings?.currencySymbol || '৳';
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'residential' | 'non_residential'>('all');
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fee Collection POS Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(2000);
  const [payMethod, setPayMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [payTrxId, setPayTrxId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('food_ration');
  const [expAmount, setExpAmount] = useState(5000);
  const [expPayee, setExpPayee] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Create Invoice Modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [newInvoiceStudentId, setNewInvoiceStudentId] = useState('');
  const [newInvoiceLedgerType, setNewInvoiceLedgerType] = useState<'residential' | 'non_residential'>('residential');
  const [newInvoiceTitle, setNewInvoiceTitle] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState<number>(2500);
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const sum = await apiCall('/api/v1/finance/summary');
      setSummary(sum);

      let url = '/api/v1/finance/invoices?limit=50';
      if (activeLedgerTab !== 'all') {
        url += `&type=${activeLedgerTab}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const inv = await apiCall(url);
      setInvoices(inv || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiCall('/api/v1/students?limit=100');
      const list = res.students || res || [];
      setStudentsList(list);
      if (list.length > 0 && !newInvoiceStudentId) {
        setNewInvoiceStudentId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeLedgerTab, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenCreateInvoice = (ledgerType: 'residential' | 'non_residential', presetTitle?: string, presetAmount?: number) => {
    setNewInvoiceLedgerType(ledgerType);
    if (presetTitle) setNewInvoiceTitle(presetTitle);
    else setNewInvoiceTitle(ledgerType === 'residential' ? 'আবাসিক ডাইনিং ও সিট ভাড়া' : 'মাসিক শিক্ষা ও টিউশন ফি');
    if (presetAmount) setNewInvoiceAmount(presetAmount);
    else setNewInvoiceAmount(ledgerType === 'residential' ? 2500 : 1200);
    setShowCreateInvoiceModal(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceStudentId || newInvoiceAmount <= 0) return;

    setIsCreatingInvoice(true);
    const invoiceTitle = newInvoiceTitle || (newInvoiceLedgerType === 'residential' ? 'আবাসিক ফি' : 'অনাবাসিক ফি');
    const invoiceItemObj = {
      feeTypeId: newInvoiceLedgerType === 'residential' ? 'fee_dining' : 'fee_tuition',
      title: invoiceTitle,
      name: invoiceTitle,
      amount: newInvoiceAmount
    };

    try {
      await apiCall('/api/v1/finance/invoices', {
        method: 'POST',
        body: JSON.stringify({
          studentId: newInvoiceStudentId,
          ledgerType: newInvoiceLedgerType,
          title: invoiceTitle,
          feeItems: [invoiceItemObj],
          items: [invoiceItemObj],
          dueDate: newInvoiceDueDate
        })
      });

      setShowCreateInvoiceModal(false);
      fetchData();
      alert('নতুন চালান সফলভাবে প্রস্তুত হয়েছে!');
    } catch (err: any) {
      alert(err.message || 'চালান প্রস্তুত করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    setIsProcessing(true);
    setPaymentError(null);
    try {
      const res = await apiCall('/api/v1/finance/payments/collect', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: payAmount,
          paymentMethod: payMethod,
          transactionId: payTrxId ? payTrxId.trim() : undefined
        })
      });
      setReceiptSuccess(res);
      fetchData();
    } catch (err: any) {
      console.error('Payment error:', err);
      const msg = err.message || '';
      if (
        msg.includes('Transaction ID') ||
        msg.includes('DUPLICATE_TRANSACTION') ||
        msg.includes('409') ||
        msg.includes('already been recorded')
      ) {
        setPaymentError(
          `সতর্কতা: ট্রানজেকশন আইডি "${payTrxId}" ইতিমধ্যে পূর্বে ব্যবহার করা হয়েছে! ডুপ্লিকেট পেমেন্ট গ্রহণ সম্পূর্ণ নিষিদ্ধ।`
        );
      } else {
        setPaymentError(msg || 'পেমেন্ট সম্পন্ন হতে ব্যর্থ হয়েছে।');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/api/v1/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: expCategory,
          amount: expAmount,
          payee: expPayee || 'সরবরাহকারী',
          description: expDesc || 'মাদ্রাসার নিয়মিত ব্যয়'
        })
      });
      setShowExpenseModal(false);
      fetchData();
      alert('খরচ ভাউচার সফলভাবে লিপিবদ্ধ হয়েছে।');
    } catch (err) {
      alert('ব্যয় ভাউচার সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Filtered invoices for current view
  const currentInvoices = invoices.filter((inv) => {
    if (activeLedgerTab === 'all') return true;
    const lType = inv.ledger_type || inv.ledgerType;
    return lType === activeLedgerTab;
  });

  // Calculate segregated mini KPIs
  const resInvoices = invoices.filter((inv) => (inv.ledger_type || inv.ledgerType) === 'residential');
  const nonResInvoices = invoices.filter((inv) => (inv.ledger_type || inv.ledgerType) === 'non_residential');

  const resBilled = resInvoices.reduce((acc, i) => acc + (i.total_amount || 0), 0);
  const resCollected = resInvoices.reduce((acc, i) => acc + (i.paid_amount || 0), 0);
  const resDue = resInvoices.reduce((acc, i) => acc + (i.due_amount || 0), 0);

  const nonResBilled = nonResInvoices.reduce((acc, i) => acc + (i.total_amount || 0), 0);
  const nonResCollected = nonResInvoices.reduce((acc, i) => acc + (i.paid_amount || 0), 0);
  const nonResDue = nonResInvoices.reduce((acc, i) => acc + (i.due_amount || 0), 0);

  return (
    <div className="space-y-6">
      <QrScanner isOpen={showQrScanner} onClose={() => setShowQrScanner(false)} />
      {/* 3 Segregated Ledger Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2">
        <button
          onClick={() => setActiveLedgerTab('all')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition flex items-center gap-2 ${
            activeLedgerTab === 'all'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>সকল চালান ও সার্বিক সারসংক্ষেপ</span>
        </button>

        <button
          onClick={() => setActiveLedgerTab('residential')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition flex items-center gap-2 ${
            activeLedgerTab === 'residential'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building className="w-4 h-4 text-indigo-600" />
          <span>আবাসিক লেজার [আবাসিক]</span>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            হোস্টেল ও খানা
          </span>
        </button>

        <button
          onClick={() => setActiveLedgerTab('non_residential')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition flex items-center gap-2 ${
            activeLedgerTab === 'non_residential'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>অনাবাসিক লেজার [অনাবাসিক]</span>
          <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            শিক্ষা ও টিউশন
          </span>
        </button>
      </div>

      {/* Tab 1: Global Overview Cards */}
      {activeLedgerTab === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">মোট বিলকৃত ফি (সর্বমোট)</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {currencySymbol}{(summary?.totalBilled || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">আবাসিক ও অনাবাসিক মিলিত হিসাব</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">আদায়কৃত মোট অর্থ</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {currencySymbol}{(summary?.totalCollected || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              আজ আদায়: {currencySymbol}{(summary?.todayCollection || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">মোট বকেয়া ফি (Due)</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {currencySymbol}{(summary?.totalDue || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">তাগাদা প্রেরণ প্রয়োজন</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">প্রাতিষ্ঠানিক মোট ব্যয়</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {currencySymbol}{(summary?.totalExpenses || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">খাবার, বিদ্যুৎ ও বেতন বাবদ</div>
          </div>
        </div>
      )}

      {/* Tab 2: Residential Ledgers Banner & Controls */}
      {activeLedgerTab === 'residential' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-indigo-950">
                  আবাসিক ও বোর্ডিং তহবিল লেজার (Hostel & Boarding Fund)
                </h2>
                <p className="text-xs text-indigo-800 mt-0.5 max-w-2xl">
                  <strong>আবাসিক তহবিল সুরক্ষা নীতি:</strong> সকল আবাসিক ও খানা ফি কঠোরভাবে সংরক্ষিত থাকে এবং শুধুমাত্র
                  খাবার, বাবুর্চি, ডাইনিং এবং ছাত্রাবাস ব্যবস্থাপনায় ব্যবহারযোগ্য।
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenCreateInvoice('residential')}
              className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition shadow-md flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন আবাসিক চালান তৈরি</span>
            </button>
          </div>

          {/* Residential Mini KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-xs text-indigo-700 font-bold">আবাসিক বিলকৃত ফি</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {currencySymbol}{resBilled.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-xs text-emerald-700 font-bold">আবাসিক আদায়কৃত ফি</div>
              <div className="text-xl font-black text-emerald-600 mt-1 font-mono">
                {currencySymbol}{resCollected.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-xs text-amber-700 font-bold">আবাসিক বকেয়া ফি</div>
              <div className="text-xl font-black text-amber-600 mt-1 font-mono">
                {currencySymbol}{resDue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Category Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-500">দ্রুত প্রিসেট চালান:</span>
            {feeCategories.filter(c => c.ledgerType === 'residential').length > 0 ? (
              feeCategories.filter(c => c.ledgerType === 'residential').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleOpenCreateInvoice('residential', cat.nameBn, cat.amount || 0)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition"
                >
                  {cat.nameBn} ({currencySymbol}{(cat.amount || 0).toLocaleString()})
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => handleOpenCreateInvoice('residential', 'খাবার ও ডাইনিং ফি', 2500)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition"
                >
                  খাবার ও ডাইনিং ফি ({currencySymbol}২,৫০০)
                </button>
                <button
                  onClick={() => handleOpenCreateInvoice('residential', 'আবাসিক সিট ভাড়া', 800)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition"
                >
                  আবাসিক সিট ভাড়া ({currencySymbol}৮০০)
                </button>
                <button
                  onClick={() => handleOpenCreateInvoice('residential', 'লন্ড্রি ও হোস্টেল চার্জ', 300)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition"
                >
                  লন্ড্রি ও হোস্টেল চার্জ ({currencySymbol}৩০০)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Non-Residential Ledgers Banner & Controls */}
      {activeLedgerTab === 'non_residential' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-600 text-white rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-teal-950">
                  অনাবাসিক ও শিক্ষা কার্যক্রম লেজার (Academic & Tuition Fund)
                </h2>
                <p className="text-xs text-teal-800 mt-0.5 max-w-2xl">
                  <strong>শিক্ষা তহবিল নীতি:</strong> মাসিক বেতন, টিউশন ও পরীক্ষা ফি সরাসরি শিক্ষকমণ্ডলীর বেতন,
                  কিতাব ও ক্লাসরুম ব্যবস্থাপনায় ব্যয় হয়।
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenCreateInvoice('non_residential')}
              className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition shadow-md flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন একাডেমিক চালান তৈরি</span>
            </button>
          </div>

          {/* Academic Mini KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-100 shadow-sm">
              <div className="text-xs text-teal-700 font-bold">একাডেমিক বিলকৃত ফি</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {currencySymbol}{nonResBilled.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-100 shadow-sm">
              <div className="text-xs text-emerald-700 font-bold">একাডেমিক আদায়কৃত ফি</div>
              <div className="text-xl font-black text-emerald-600 mt-1 font-mono">
                {currencySymbol}{nonResCollected.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-100 shadow-sm">
              <div className="text-xs text-amber-700 font-bold">একাডেমিক বকেয়া ফি</div>
              <div className="text-xl font-black text-amber-600 mt-1 font-mono">
                {currencySymbol}{nonResDue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Academic Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-500">দ্রুত প্রিসেট চালান:</span>
            {feeCategories.filter(c => c.ledgerType === 'non_residential').length > 0 ? (
              feeCategories.filter(c => c.ledgerType === 'non_residential').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleOpenCreateInvoice('non_residential', cat.nameBn, cat.amount || 0)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition"
                >
                  {cat.nameBn} ({currencySymbol}{(cat.amount || 0).toLocaleString()})
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => handleOpenCreateInvoice('non_residential', 'মাসিক টিউশন ফি', 1200)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition"
                >
                  মাসিক টিউশন ফি ({currencySymbol}১,২০০)
                </button>
                <button
                  onClick={() => handleOpenCreateInvoice('non_residential', 'ত্রৈমাসিক পরীক্ষা ফি', 500)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition"
                >
                  পরীক্ষা ফি ({currencySymbol}৫০০)
                </button>
                <button
                  onClick={() => handleOpenCreateInvoice('non_residential', 'ভর্তি ও সেশন চার্জ', 2000)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition"
                >
                  ভর্তি ও সেশন চার্জ ({currencySymbol}২,০০০)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === '' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            সকল চালান
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'overdue' ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            বকেয়া তালিকা
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'paid' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            পরিশোধিত
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrScanner(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm"
          >
            <span>QR স্ক্যান</span>
          </button>
          <ExportButton type="csv" url="/api/v1/export/fee-dues.csv" />
          {activeLedgerTab === 'all' && (
            <button
              onClick={() => handleOpenCreateInvoice('residential')}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>চালান তৈরি করুন</span>
            </button>
          )}

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition"
          >
            <PlusCircle className="w-4 h-4 text-red-600" />
            <span>খরচের ভাউচার এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">চালান নং</th>
                <th className="py-3 px-4">লেজার শাখা</th>
                <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                <th className="py-3 px-4">শ্রেণি ও অভিভাবক ফোন</th>
                <th className="py-3 px-4 text-right">মোট পরিমাণ</th>
                <th className="py-3 px-4 text-right">পরিশোধিত</th>
                <th className="py-3 px-4 text-right">বকেয়া</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {currentInvoices.map((inv) => {
                const isRes = (inv.ledger_type || inv.ledgerType) === 'residential';
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      {isRes ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          <Building className="w-3 h-3" />
                          <span>[আবাসিক]</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          <BookOpen className="w-3 h-3" />
                          <span>[অনাবাসিক]</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{inv.student_name_bn}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.student_id_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{inv.class_name_bn}</div>
                      <div className="text-[10px] text-emerald-600 font-mono">{inv.guardian_phone}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {currencySymbol}{inv.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      {currencySymbol}{inv.paid_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-bold">
                      {currencySymbol}{inv.due_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'overdue' ? 'বকেয়া' : 'আংশিক'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.status !== 'paid' ? (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPayAmount(inv.due_amount);
                            setReceiptSuccess(null);
                            setPaymentError(null);
                            setPayTrxId('');
                          }}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg transition text-[11px] shadow-sm"
                        >
                          ফি আদায় করুন
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">নিশ্চিত</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {currentInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-slate-400">
                    কোনো চালান পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS Fee Collection Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>ফি সংগ্রহ ও ডিজিটাল রসিদ প্রদান</span>
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiptSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-bold text-base text-emerald-950">ফি আদায় সম্পন্ন হয়েছে!</div>
                
                {/* Printable Money Receipt Voucher */}
                <div className="bg-white p-4 rounded-xl border border-emerald-100 text-left space-y-2 text-xs shadow-sm">
                  <div className="text-center pb-2 border-b border-dashed border-slate-200">
                    <div className="font-bold text-slate-900">মাদ্রাসাতুল হুদা আল-ইসলামিয়া</div>
                    <div className="text-[10px] text-slate-500">অফিসিয়াল মানি রসিদ (অফিস ও অভিভাবক কপি)</div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">রসিদ নম্বর:</span>
                    <span className="font-mono font-bold text-slate-900">{receiptSuccess.paymentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                    <span className="font-bold text-slate-900">{selectedInvoice.student_name_bn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">চালান নম্বর:</span>
                    <span className="font-mono text-slate-700">{selectedInvoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পরিশোধের মাধ্যম:</span>
                    <span className="font-mono uppercase font-bold text-slate-800">{payMethod}</span>
                  </div>
                  {payTrxId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">ট্রানজেকশন আইডি:</span>
                      <span className="font-mono font-bold text-emerald-800">{payTrxId}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="font-bold text-slate-800">আদায়কৃত পরিমাণ:</span>
                    <span className="font-bold font-mono text-emerald-700">{currencySymbol}{receiptSuccess.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">অবশিষ্ট বকেয়া:</span>
                    <span className="font-mono text-red-600 font-bold">{currencySymbol}{receiptSuccess.newDue.toLocaleString()}</span>
                  </div>
                  <QrCodeDisplay type="payment" id={receiptSuccess.id || receiptSuccess.paymentId || selectedInvoice.id} />
                  
                  <PhotoGallery 
                    type="payment_receipt" 
                    refId={receiptSuccess.id || receiptSuccess.paymentId || selectedInvoice.id} 
                    buttonLabel="ফি রশিদের ছবি তুলুন"
                  />
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/api/v1/pdf/fee-receipt/${selectedInvoice.id}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF ডাউনলোড</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCollect} className="space-y-3 text-xs">
                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 flex items-start gap-2 text-[11px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-800">{selectedInvoice.student_name_bn}</div>
                  <div className="text-[11px] text-slate-500">
                    চালান নং: {selectedInvoice.invoice_number} • মোট বকেয়া: {currencySymbol}{selectedInvoice.due_amount}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">আদায়ের মাধ্যম (Payment Method)</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'bkash', label: 'bKash' },
                      { id: 'nagad', label: 'Nagad' },
                      { id: 'rocket', label: 'Rocket' },
                      { id: 'bank', label: 'Bank' },
                      { id: 'cash', label: 'Cash' }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPayMethod(m.id as any)}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                          payMethod === m.id
                            ? 'ring-2 ring-emerald-600 bg-emerald-700 text-white'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">গ্রহণের পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    max={selectedInvoice.due_amount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-sm"
                  />
                </div>

                {payMethod !== 'cash' && (
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      ট্রানজেকশন আইডি (Txn ID) <span className="text-slate-400 font-normal">- ডুপ্লিকেট প্রতিরোধ সক্রিয়</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9J28DA10K"
                      value={payTrxId}
                      onChange={(e) => setPayTrxId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? 'প্রসেস হচ্ছে...' : 'জমা নিশ্চিত করুন'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>নতুন ফি চালান প্রস্তুতকরণ</span>
              </h3>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">লেজার বিভাগ (Ledger Type) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewInvoiceLedgerType('residential')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      newInvoiceLedgerType === 'residential'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>আবাসিক [হোস্টেল/খানা]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInvoiceLedgerType('non_residential')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      newInvoiceLedgerType === 'non_residential'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>অনাবাসিক [শিক্ষা/টিউশন]</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
                <select
                  required
                  value={newInvoiceStudentId}
                  onChange={(e) => setNewInvoiceStudentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name_bn || st.fullNameBn} ({st.student_id_number || st.id})
                    </option>
                  ))}
                </select>
              </div>

              {feeCategories.length > 0 && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ফি ক্যাটাগরি (কাস্টমাইজড)</label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const cat = feeCategories.find(c => c.id === e.target.value);
                      if (cat) {
                        setNewInvoiceTitle(cat.nameBn);
                        if ((cat.amount || 0) > 0) {
                          setNewInvoiceAmount(cat.amount || 0);
                        }
                        if (cat.ledgerType) {
                          setNewInvoiceLedgerType(cat.ledgerType);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs"
                  >
                    <option value="">-- ক্যাটাগরি থেকে দ্রুত নির্বাচন করুন --</option>
                    {feeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameBn} ({currencySymbol}{(cat.amount || 0).toLocaleString()}) - {cat.ledgerType === 'residential' ? 'আবাসিক' : 'অনাবাসিক'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-semibold mb-1">চালানের বিবরণ / ফি নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. সেপ্টেম্বর মাসের খানা ফি"
                  value={newInvoiceTitle}
                  onChange={(e) => setNewInvoiceTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">মোট টাকার পরিমাণ ({currencySymbol}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newInvoiceAmount || ''}
                  onChange={(e) => setNewInvoiceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">পরিশোধের শেষ তারিখ *</label>
                <input
                  type="date"
                  required
                  value={newInvoiceDueDate}
                  onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreatingInvoice}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isCreatingInvoice ? 'তৈরি হচ্ছে...' : 'চালান নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <span>প্রাতিষ্ঠানিক ব্যয়ের ভাউচার সংরক্ষণ</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">ব্যয়ের খাত</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="food_ration">আবাসিক খানা ও মুদি সামগ্রী</option>
                  <option value="utility">বিদ্যুৎ, গ্যাস ও পানির বিল</option>
                  <option value="teacher_salary">উস্তাদ ও স্টাফ ভাতা</option>
                  <option value="maintenance">ভবন ও অজুখখানা মেরামত</option>
                  <option value="books">কিতাব ও শিক্ষা সামগ্রী</option>
                  <option value="other">বিবিধ প্রাতিষ্ঠানিক ব্যয়</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">টাকার পরিমাণ *</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">প্রাপক / সরবরাহকারী</label>
                <input
                  type="text"
                  placeholder="দোকান বা ব্যক্তির নাম"
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="ব্যয়ের কারণ ও ভাউচার বিবরণী..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
                >
                  ভাউচার সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
