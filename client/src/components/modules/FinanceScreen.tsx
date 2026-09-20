import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Receipt, DollarSign, PlusCircle, CheckCircle2, ArrowRight, X, AlertCircle, FileText } from 'lucide-react';

export const FinanceScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fee Collection POS Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(2000);
  const [payMethod, setPayMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket'>('bkash');
  const [payTrxId, setPayTrxId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState<any>(null);

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('food_ration');
  const [expAmount, setExpAmount] = useState(5000);
  const [expPayee, setExpPayee] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const sum = await apiCall('/api/v1/finance/summary');
      setSummary(sum);

      let url = '/api/v1/finance/invoices?limit=30';
      if (statusFilter) url += `&status=${statusFilter}`;
      const inv = await apiCall(url);
      setInvoices(inv || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    setIsProcessing(true);
    try {
      const res = await apiCall('/api/v1/finance/payments/collect', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: payAmount,
          paymentMethod: payMethod,
          transactionId: payTrxId || undefined
        })
      });
      setReceiptSuccess(res);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'পেমেন্ট সম্পন্ন হতে ব্যর্থ হয়েছে।');
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

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">মোট বিলকৃত ফি</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{(summary?.totalBilled || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">চলতি সেপ্টেম্বর সেশন</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">আদায়কৃত মোট অর্থ</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ৳{(summary?.totalCollected || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            আজ আদায়: ৳{(summary?.todayCollection || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">মোট বকেয়া ফি (Due)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ৳{(summary?.totalDue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">তাগাদা প্রেরণ প্রয়োজন</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">প্রাতিষ্ঠানিক মোট ব্যয়</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            ৳{(summary?.totalExpenses || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">খাবার, বিদ্যুৎ ও বেতন বাবদ</div>
        </div>
      </div>

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
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                    {inv.invoice_number}
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
                    ৳{inv.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                    ৳{inv.paid_amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-red-600 font-bold">
                    ৳{inv.due_amount.toLocaleString()}
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
              ))}
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
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiptSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-bold text-base text-emerald-950">ফি আদায় সম্পন্ন হয়েছে!</div>
                <div className="text-xs text-slate-600">
                  রসিদ নম্বর: <span className="font-mono font-bold text-slate-900">{receiptSuccess.paymentNumber}</span>
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  আদায়কৃত পরিমাণ: ৳{receiptSuccess.amount.toLocaleString()} (অবশিষ্ট বকেয়া: ৳{receiptSuccess.newDue.toLocaleString()})
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full mt-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  বন্ধ করুন
                </button>
              </div>
            ) : (
              <form onSubmit={handleCollect} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-800">{selectedInvoice.student_name_bn}</div>
                  <div className="text-[11px] text-slate-500">
                    চালান নং: {selectedInvoice.invoice_number} • মোট বকেয়া: ৳{selectedInvoice.due_amount}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">আদায়ের মাধ্যম (Payment Method)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'bkash', label: 'bKash', color: 'bg-pink-50 border-pink-200 text-pink-700' },
                      { id: 'nagad', label: 'Nagad', color: 'bg-orange-50 border-orange-200 text-orange-700' },
                      { id: 'rocket', label: 'Rocket', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                      { id: 'cash', label: 'নগদ ক্যাশ', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPayMethod(m.id as any)}
                        className={`py-2 text-[11px] font-bold rounded-xl border transition ${
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
                    <label className="block text-slate-600 font-semibold mb-1">ট্রানজেকশন আইডি (Txn ID)</label>
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
