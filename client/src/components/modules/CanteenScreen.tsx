import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  Users,
  DollarSign,
  Search,
  X,
  CheckCircle,
  Clock,
  Package,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const CanteenScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mealLogs, setMealLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'meals' | 'transactions'>('inventory');

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [txnQty, setTxnQty] = useState<number>(1);
  const [txnCost, setTxnCost] = useState<number>(0);
  const [supplierName, setSupplierName] = useState('');
  const [txnNotes, setTxnNotes] = useState('');

  // Meal states
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [menuDesc, setMenuDesc] = useState('');
  const [studentHeadcount, setStudentHeadcount] = useState<number>(145);
  const [staffHeadcount, setStaffHeadcount] = useState<number>(12);
  const [mealCost, setMealCost] = useState<number>(6500);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, txData, mealsData, sumData] = await Promise.all([
        apiCall('/api/v1/canteen/inventory'),
        apiCall('/api/v1/canteen/transactions'),
        apiCall('/api/v1/canteen/meals'),
        apiCall('/api/v1/canteen/summary')
      ]);

      setInventory(invData || []);
      setTransactions(txData || []);
      setMealLogs(mealsData || []);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load canteen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('পণ্য নির্বাচন করুন');
      return;
    }

    try {
      await apiCall('/api/v1/canteen/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'purchase_inflow',
          item_id: selectedItemId,
          quantity: txnQty,
          total_cost: txnCost,
          supplier_name: supplierName,
          notes: txnNotes
        })
      });
      alert('ক্রয়কৃত পণ্য ইনভেন্টরিতে যুক্ত হয়েছে!');
      setIsPurchaseModalOpen(false);
      setSupplierName('');
      setTxnNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'লেনদেন ব্যর্থ হয়েছে');
    }
  };

  const handleConsumptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('পণ্য নির্বাচন করুন');
      return;
    }

    try {
      await apiCall('/api/v1/canteen/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'consumption_outflow',
          item_id: selectedItemId,
          quantity: txnQty,
          notes: txnNotes
        })
      });
      alert('খাবারে পণ্যের ব্যবহার সফলভাবে রেকর্ড হয়েছে!');
      setIsConsumptionModalOpen(false);
      setTxnNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'মজুদ অপর্যাপ্ত');
    }
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuDesc) {
      alert('মেন্যু বিবরণ প্রদান আবশ্যক');
      return;
    }

    try {
      await apiCall('/api/v1/canteen/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_type: mealType,
          menu_description: menuDesc,
          headcount_students: studentHeadcount,
          headcount_staff: staffHeadcount,
          total_cost: mealCost
        })
      });
      alert('আজকের খাবারের তথ্য সফলভাবে লিপিবদ্ধ হয়েছে!');
      setIsMealModalOpen(false);
      setMenuDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'সার্ভার এরর');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>ক্যান্টিন ও হোস্টেল মেস ম্যানেজমেন্ট</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">খাবার সামগ্রী ইনভেন্টরি ও মেস খরচ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            চাউল, ডাল, তেল ও দৈনন্দিন খাদ্যপণ্যের স্টক, ক্রয়-বিক্রয় ও মিল গণনা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-2xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>পণ্য ক্রয় এন্ট্রি</span>
          </button>
          <button
            onClick={() => setIsConsumptionModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-2 rounded-2xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>রান্নায় ব্যবহার</span>
          </button>
          <button
            onClick={() => setIsMealModalOpen(true)}
            className="bg-slate-850 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-2xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>দৈনিক মিল লগ</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block">ইনভেন্টরি আইটেম</span>
            <span className="text-xl font-black text-slate-800 font-mono">{summary.totalItems} টি</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block">কম মজুদের সতর্কতা</span>
            <span className={`text-xl font-black font-mono ${summary.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {summary.lowStockCount} টি
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block">আজকের খাবার উপস্থিতি</span>
            <span className="text-xl font-black text-slate-800 font-mono">{summary.totalHeadcount} জন</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block">আজকের মোট খাবার খরচ</span>
            <span className="text-xl font-black text-emerald-700 font-mono">৳{summary.todayMealCost?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'inventory' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          মজুদ তালিকা (Inventory)
        </button>
        <button
          onClick={() => setActiveTab('meals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'meals' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          দৈনিক মিল তালিকা (Meal Logs)
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'transactions' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          লেনদেন খতিয়ান (In / Out)
        </button>
      </div>

      {/* Tab: Inventory Stock Grid */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-10 text-slate-400">লোড হচ্ছে...</div>
          ) : inventory.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between ${
                item.isLowStock ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{item.item_name_bn}</h3>
                  {item.isLowStock && (
                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] border border-rose-300 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>মজুদ কম!</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 mb-4">ক্যাটাগরি: <span className="font-semibold text-slate-700">{item.category}</span></div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">বর্তমান মজুদ:</span>
                  <span className="font-mono font-black text-base text-slate-900">
                    {item.current_stock} {item.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">একক মূল্য:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ৳{item.unit_price} /{item.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Daily Meal Logs */}
      {activeTab === 'meals' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3.5">তারিখ ও বেলা</th>
                <th className="px-5 py-3.5">মেন্যু বিবরণ</th>
                <th className="px-5 py-3.5 text-center">শিক্ষার্থী</th>
                <th className="px-5 py-3.5 text-center">স্টাফ</th>
                <th className="px-5 py-3.5">বাবুর্চি / প্রস্তুতকারক</th>
                <th className="px-5 py-3.5 text-right">মোট খরচ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mealLogs.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-800 block">{m.date}</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {m.meal_type === 'breakfast' ? 'সকালের নাস্তা' : m.meal_type === 'lunch' ? 'দুপুরের খাবার' : 'রাতের খাবার'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{m.menu_description}</td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold">{m.headcount_students} জন</td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold">{m.headcount_staff} জন</td>
                  <td className="px-5 py-3.5 text-slate-600">{m.prepared_by}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-black text-emerald-700">৳{m.total_cost?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Transaction Ledger */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3.5">তারিখ ও ভাউচার</th>
                <th className="px-5 py-3.5">ধরণ</th>
                <th className="px-5 py-3.5">পণ্য</th>
                <th className="px-5 py-3.5">পরিমাণ</th>
                <th className="px-5 py-3.5">সরবরাহকারী / বিবরণ</th>
                <th className="px-5 py-3.5 text-right">মূল্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-800 block">{tx.date}</span>
                    <span className="text-[10px] font-mono text-slate-400">{tx.voucher_no}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {tx.type === 'purchase_inflow' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        <span>ক্রয় / আগমন</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                        <ArrowDownRight className="w-3 h-3 text-amber-600" />
                        <span>রান্নায় ব্যবহার</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{tx.item_name_bn}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-700">{tx.quantity} {tx.unit}</td>
                  <td className="px-5 py-3.5 text-slate-600">{tx.supplier_name || tx.notes || '-'}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-black text-slate-900">
                    ৳{tx.total_cost?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">ইনভেন্টরিতে পণ্য ক্রয় এন্ট্রি (Stock In)</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">পণ্য নির্বাচন করুন *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50"
                  required
                >
                  <option value="">-- পণ্য বাছাই করুন --</option>
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.item_name_bn} (মজুদ: {i.current_stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ক্রয়ের পরিমাণ *</label>
                  <input
                    type="number"
                    min="1"
                    value={txnQty}
                    onChange={(e) => setTxnQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোট খরচ (টাকা) *</label>
                  <input
                    type="number"
                    min="0"
                    value={txnCost}
                    onChange={(e) => setTxnCost(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">সরবরাহকারী / দোকানদার</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="মেসার্স মদিনা ট্রেডার্স..."
                    className="flex-1 p-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                  <VoiceInputButton onTranscript={(txt) => setSupplierName(txt)} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  স্টকে যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consumption Modal */}
      {isConsumptionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">রান্নায় ব্যবহার রেকর্ড (Stock Out)</h3>
              <button onClick={() => setIsConsumptionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">পণ্য নির্বাচন করুন *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50"
                  required
                >
                  <option value="">-- পণ্য বাছাই করুন --</option>
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.item_name_bn} (মজুদ: {i.current_stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ব্যবহৃত পরিমাণ *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={txnQty}
                  onChange={(e) => setTxnQty(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিবরণ / উদ্দেশ্য</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={txnNotes}
                    onChange={(e) => setTxnNotes(e.target.value)}
                    placeholder="যেমন: দুপুরের খাবারের জন্য চাউল ব্যবহার"
                    className="flex-1 p-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                  <VoiceInputButton onTranscript={(txt) => setTxnNotes(txt)} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConsumptionModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  ব্যবহার নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Log Modal */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">দৈনিক মিল ও খাবার প্রস্তুত লগ</h3>
              <button onClick={() => setIsMealModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMealSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">খাবারের বেলা *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'breakfast', name: 'সকালের নাস্তা' },
                    { id: 'lunch', name: 'দুপুরের খাবার' },
                    { id: 'dinner', name: 'রাতের খাবার' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMealType(m.id as any)}
                      className={`p-2 rounded-xl font-bold text-center border transition ${
                        mealType === m.id
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">মেন্যু বিবরণ *</label>
                  <VoiceInputButton onTranscript={(txt) => setMenuDesc((prev) => prev ? `${prev} ${txt}` : txt)} />
                </div>
                <textarea
                  rows={2}
                  value={menuDesc}
                  onChange={(e) => setMenuDesc(e.target.value)}
                  placeholder="যেমন: সাদা ভাত, ডাল ও রুই মাছের দোপেঁয়াজা..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিক্ষার্থী উপস্থিতি *</label>
                  <input
                    type="number"
                    min="0"
                    value={studentHeadcount}
                    onChange={(e) => setStudentHeadcount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">স্টাফ ও ওস্তাদ *</label>
                  <input
                    type="number"
                    min="0"
                    value={staffHeadcount}
                    onChange={(e) => setStaffHeadcount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মোট মিল প্রস্তুত খরচ (টাকা)</label>
                <input
                  type="number"
                  min="0"
                  value={mealCost}
                  onChange={(e) => setMealCost(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-slate-50 text-emerald-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMealModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  মিল তথ্য সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
