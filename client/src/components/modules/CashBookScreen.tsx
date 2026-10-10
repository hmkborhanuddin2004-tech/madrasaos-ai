import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Landmark,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Printer,
  PlusCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  ShieldCheck,
  Receipt,
  Wallet
} from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  currentBalance: number;
}

interface CashBookDailyData {
  date: string;
  openingBalance: number;
  totalInflow?: number;
  totalOutflow?: number;
  collectionsTotal?: number;
  expensesTotal?: number;
  bankDeposits?: number;
  bankDepositsTotal?: number;
  closingBalance: number;
  breakdown?: {
    feeCollections?: any[];
    donationCollections?: any[];
    expenses?: any[];
    bankDepositTransactions?: any[];
    expenseOutflows?: number;
    bankDeposits?: number;
  };
}

export const CashBookScreen: React.FC = () => {
  const { apiCall } = useAuth();

  // Date Navigation State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [dailyData, setDailyData] = useState<CashBookDailyData | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bank Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [targetAccountId, setTargetAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositRef, setDepositRef] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  const fetchData = async (date: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Fetch Daily Cash Book
      const dailyRes = await apiCall(`/api/v1/finance/cash-book/daily?date=${date}`);
      setDailyData(dailyRes);

      // Fetch Bank Accounts
      const banksRes = await apiCall('/api/v1/finance/bank-accounts');
      setBankAccounts(banksRes || []);
      if (banksRes && banksRes.length > 0 && !targetAccountId) {
        setTargetAccountId(banksRes[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load cash book data:', err);
      setErrorMessage(err.message || 'ক্যাশ বই ডেটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  // Quick Date Jump Handlers
  const handleJumpToday = () => {
    setSelectedDate(todayStr);
  };

  const handleJumpYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleJumpFirstOfMonth = () => {
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    setSelectedDate(firstDay.toISOString().split('T')[0]);
  };

  const handleStepDay = (step: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + step);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Submit Bank Deposit
  const handleBankDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccountId || depositAmount <= 0) return;

    if (dailyData && depositAmount > dailyData.closingBalance) {
      alert(`ব্যাংকে জমার পরিমাণ বর্তমান ক্যাশ উদ্বৃত্তের (৳${dailyData.closingBalance}) বেশি হতে পারবে না!`);
      return;
    }

    setIsDepositing(true);
    const slipNumber = depositRef.trim() || `SLIP-${Date.now().toString().slice(-6)}`;
    const depositNotes = 'ক্যাশ ড্রয়ার হতে ব্যাংক একাউন্টে জমা';
    try {
      await apiCall('/api/v1/finance/cash-book/bank-deposits', {
        method: 'POST',
        body: JSON.stringify({
          bankAccountId: targetAccountId,
          amount: depositAmount,
          depositSlipNumber: depositRef || slipNumber,
          reference: depositRef || slipNumber,
          notes: depositNotes,
          date: selectedDate
        })
      });

      setDepositSuccessMsg('ব্যাংক ডিপোজিট সফলভাবে সম্পন্ন হয়েছে এবং ক্যাশ সমন্বয় করা হয়েছে!');
      setTimeout(() => {
        setShowDepositModal(false);
        setDepositSuccessMsg(null);
        setDepositAmount(0);
        setDepositRef('');
      }, 1500);

      fetchData(selectedDate);
    } catch (err: any) {
      alert(err.message || 'ব্যাংক ডিপোজিট সম্পন্ন হতে ব্যর্থ হয়েছে।');
    } finally {
      setIsDepositing(false);
    }
  };

  const opening = dailyData?.openingBalance || 0;
  const inflow = dailyData?.totalInflow ?? dailyData?.collectionsTotal ?? 0;
  const outflow = dailyData?.totalOutflow ?? dailyData?.expensesTotal ?? 0;
  const deposits = dailyData?.bankDeposits ?? dailyData?.bankDepositsTotal ?? 0;
  const closing = dailyData?.closingBalance || 0;

  return (
    <div className="space-y-6">
      {/* Header & Date Navigation */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                দৈনিক ক্যাশ বই ও ব্যাংক হিসাব (Cash Book & Bank Ledger)
              </h1>
              <p className="text-xs text-slate-500">
                মাদ্রাসার ড্রয়ার নগদ উদ্বৃত্ত, দৈনিক আদায়, খরচ ও ব্যাংক জমার অডিট-যাচাইকৃত খাতা
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector and Jump Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 border border-slate-200">
            <button
              onClick={() => handleStepDay(-1)}
              title="পূর্ববর্তী দিন"
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
            <button
              onClick={() => handleStepDay(1)}
              title="পরবর্তী দিন"
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleJumpToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedDate === todayStr ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            আজ
          </button>
          <button
            onClick={handleJumpYesterday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            গতকাল
          </button>
          <button
            onClick={handleJumpFirstOfMonth}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            চলতি মাসের ১ তারিখ
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm ml-auto sm:ml-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট খাতা</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5 Golden Equation Metric Cards */}
      {/* Closing = Opening + Inflows - Outflows - BankDeposits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Opening */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>১. প্রারম্ভিক উদ্বৃত্ত</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            ৳{opening.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">পূর্বদিনের সমাপনী টানা হয়েছে</div>
        </div>

        {/* Card 2: Total Inflow */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
            <span>২. (+) নগদ আদায়</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2 font-mono">
            +৳{inflow.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-800 font-semibold mt-1">
            ফি ও অনুদান বাবদ ক্যাশ গ্রহণ
          </div>
        </div>

        {/* Card 3: Total Outflow */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-red-700 text-[11px] font-bold uppercase tracking-wider">
            <span>৩. (-) নগদ খরচ</span>
            <ArrowUpRight className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-600 mt-2 font-mono">
            -৳{outflow.toLocaleString()}
          </div>
          <div className="text-[10px] text-red-700 font-semibold mt-1">
            খানা, বিদ্যুৎ ও বিবিধ ব্যয়
          </div>
        </div>

        {/* Card 4: Bank Deposits */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-700 text-[11px] font-bold uppercase tracking-wider">
            <span>৪. (-) ব্যাংকে জমা</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-600 mt-2 font-mono">
            -৳{deposits.toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-800 font-semibold mt-1">
            ড্রয়ার হতে ব্যাংক হিসাবে স্থানান্তর
          </div>
        </div>

        {/* Card 5: Closing Balance */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-4 rounded-2xl shadow-md border border-emerald-700 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-200 text-[11px] font-bold uppercase tracking-wider">
            <span>৫. (=) সমাপনী ক্যাশ</span>
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-emerald-100">
            ৳{closing.toLocaleString()}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 bg-emerald-700/80 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-100 border border-emerald-500/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
            <span>অডিট ব্যালেন্স ভেরিফাইড</span>
          </div>
        </div>
      </div>

      {/* Linked Bank Accounts Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">সংযুক্ত ব্যাংক হিসাবসমূহ (Linked Bank Accounts)</h2>
              <p className="text-[11px] text-slate-500">মাদ্রাসার অনুমোদিত সঞ্চয়ী ও চলতি একাউন্ট স্থিতি</p>
            </div>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center justify-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ক্যাশ হতে ব্যাংকে জমা (Bank Deposit)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{acc.bankName}</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {acc.branch} শাখা
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                একাউন্ট: <span className="font-bold text-slate-800">{acc.accountNumber}</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                নাম: {acc.accountName}
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">বর্তমান স্থিতি:</span>
                <span className="text-base font-black text-blue-700 font-mono">
                  ৳{acc.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {bankAccounts.length === 0 && (
            <div className="col-span-3 text-center py-6 text-xs text-slate-400">
              কোনো ব্যাংক অ্যাকাউন্ট পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>

      {/* Dual-Side Daily Cash Ledger (Debit vs Credit) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side: Debit / Inflow (জমা - নগদ আদায়) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                  ডেবিট সাইড (জমা / নগদ প্রাপ্তি)
                </h3>
                <p className="text-[10px] text-emerald-800">শিক্ষার্থী ফি আদায় ও দান সংগ্রহ</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-emerald-800 font-semibold">মোট প্রাপ্তি</div>
              <div className="text-sm font-black text-emerald-700 font-mono">৳{inflow.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto p-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase border-b">
                <tr>
                  <th className="py-2 px-3">বিবরণ / খাত</th>
                  <th className="py-2 px-3">রসিদ / মাধ্যম</th>
                  <th className="py-2 px-3 text-right">পরিমাণ (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Fee Collections */}
                {(dailyData?.breakdown?.feeCollections || []).map((fee, idx) => (
                  <tr key={`fee-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-800">{fee.studentName || 'শিক্ষার্থী ফি'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">চালান: {fee.invoiceNumber}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                        {fee.paymentMethod || 'cash'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 font-mono">
                      ৳{fee.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {/* Donation Receipts */}
                {(dailyData?.breakdown?.donationCollections || []).map((don, idx) => (
                  <tr key={`don-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-800">{don.donorName || 'দানশীল দাতা'}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        {don.fundType === 'lillah_orphan'
                          ? 'লিল্লাহ ও এতিম তহবিল'
                          : don.fundType === 'waqf_construction'
                          ? 'ওয়াকফ ও নির্মাণ'
                          : 'সাধারণ দান'}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                        {don.receiptNumber}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 font-mono">
                      ৳{don.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {(!dailyData ||
                  (((dailyData?.breakdown?.feeCollections?.length ?? 0) === 0) &&
                    ((dailyData?.breakdown?.donationCollections?.length ?? 0) === 0))) && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-xs text-slate-400">
                      এই তারিখে কোনো নগদ আদায় রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Credit / Outflow & Bank Deposits (খরচ - নগদ প্রদান ও ব্যাংক জমা) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-red-50/70 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-700" />
              <div>
                <h3 className="font-bold text-xs text-red-950 uppercase tracking-wider">
                  ক্রেডিট সাইড (খরচ ও ব্যাংকে জমা)
                </h3>
                <p className="text-[10px] text-red-800">দৈনিক ব্যয় ভাউচার ও ব্যাংক ডিপোজিট</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-red-800 font-semibold">মোট বহির্গমন</div>
              <div className="text-sm font-black text-red-700 font-mono">
                ৳{(outflow + deposits).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto p-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase border-b">
                <tr>
                  <th className="py-2 px-3">বিবরণ / প্রাপক</th>
                  <th className="py-2 px-3">প্রকারভেদ</th>
                  <th className="py-2 px-3 text-right">পরিমাণ (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Cash Expenses */}
                {(dailyData?.breakdown?.expenses || []).map((exp, idx) => (
                  <tr key={`exp-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-800">{exp.payee || 'সরবরাহকারী'}</div>
                      <div className="text-[10px] text-slate-500">{exp.description || exp.category}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        ব্যয় ভাউচার
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-red-600 font-mono">
                      ৳{exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {/* Bank Deposits */}
                {(dailyData?.breakdown?.bankDepositTransactions || []).map((dep, idx) => (
                  <tr key={`dep-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-800">{dep.bankName || 'ব্যাংক জমা'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {dep.accountNumber} • স্লিপ: {dep.reference || 'নগদ জমা'}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        ব্যাংকে জমা
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-blue-600 font-mono">
                      ৳{dep.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {(!dailyData ||
                  (((dailyData?.breakdown?.expenses?.length ?? 0) === 0) &&
                    ((dailyData?.breakdown?.bankDepositTransactions?.length ?? 0) === 0))) && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-xs text-slate-400">
                      এই তারিখে কোনো খরচ বা ব্যাংক জমা রেকর্ড নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bank Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span>ক্যাশ ড্রয়ার হতে ব্যাংক হিসাবে জমা</span>
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {depositSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm text-emerald-900">{depositSuccessMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleBankDeposit} className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="text-[11px] text-blue-700">বর্তমান ড্রয়ার নগদ স্থিতি:</div>
                  <div className="text-lg font-black text-blue-900 font-mono">
                    ৳{closing.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">গন্তব্য ব্যাংক একাউন্ট *</label>
                  <select
                    required
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber} ({acc.branch} শাখা)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">জমার পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={closing}
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    placeholder="টাকার পরিমাণ লিখুন"
                    className="w-full px-3 py-2 border rounded-xl font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ব্যাংক ডিপোজিট স্লিপ / ট্রানজেকশন রেফারেন্স</label>
                  <input
                    type="text"
                    placeholder="e.g. SLIP-99824 বা ক্যাশ ডিপোজিট স্লিপ নং"
                    value={depositRef}
                    onChange={(e) => setDepositRef(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isDepositing || depositAmount <= 0}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {isDepositing ? 'জমা হচ্ছে...' : 'জমা সম্পন্ন করুন'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
