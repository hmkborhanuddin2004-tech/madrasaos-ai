import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Library,
  BookOpen,
  Search,
  Plus,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Hash,
  User,
  Layers,
  X
} from 'lucide-react';

export const LibraryScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formTitleBn, setFormTitleBn] = useState('');
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('ফিকহুল ইসলাম');
  const [formIsbn, setFormIsbn] = useState('');
  const [formTotalCopies, setFormTotalCopies] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const endpoint = searchQuery ? `/api/v1/library?search=${encodeURIComponent(searchQuery)}` : '/api/v1/library';
      const data = await apiCall(endpoint);
      setBooks(data || []);
    } catch (err) {
      console.error('Failed to load library books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [searchQuery]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiCall('/api/v1/library', {
        method: 'POST',
        body: JSON.stringify({
          titleBn: formTitleBn,
          titleAr: formTitleAr || null,
          author: formAuthor,
          category: formCategory,
          isbn: formIsbn || null,
          totalCopies: Number(formTotalCopies)
        })
      });

      setIsModalOpen(false);
      setFormTitleBn('');
      setFormTitleAr('');
      setFormAuthor('');
      setFormIsbn('');
      await fetchBooks();
    } catch (err) {
      console.error('Failed to add book:', err);
      alert('কিতাব সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCopiesAll = books.reduce((acc, b) => acc + (b.total_copies || 0), 0);
  const availableCopiesAll = books.reduce((acc, b) => acc + (b.available_copies || 0), 0);
  const issuedCopiesAll = totalCopiesAll - availableCopiesAll;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-emerald-900 to-primary-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5 text-accent-gold" />
            <span>মাদ্রাসা কুতুবখানা ও লাইব্রেরি ডিজিটালাইজেশন</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            মাদ্রাসা কুতুবখানা / লাইব্রেরি
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            হাদীস, তাফসীর, ফিকহ, আরবি সাহিত্য ও উসূল শাস্ত্রের কিতাব ক্যাটালগ ও বিতরণ ব্যবস্থাপনা
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-gold to-amber-600 hover:from-amber-500 hover:to-accent-gold text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন কিতাব যুক্ত করুন</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-slate-500">মোট কিতাবের শিরোনাম</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{books.length}টি</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-slate-500">মোট সংগৃহীত কপি</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCopiesAll}টি</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-emerald-600">মজুদ অবশিষ্ট কপি</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{availableCopiesAll}টি</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] text-amber-600">শিক্ষার্থী ও উস্তাদদের নিকট</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{issuedCopiesAll}টি</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="কিতাবের নাম, আরবি শিরোনাম, লেখক অথবা শাস্ত্র দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse h-32"></div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">কোনো কিতাব পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            লাইব্রেরিতে এই শিরোনামে কোনো কিতাব তালিকাভুক্ত নেই। উপরে "নতুন কিতাব যুক্ত করুন" বাটনে ক্লিক করে কুতুবখানায় কিতাব অন্তর্ভুক্ত করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((b) => {
            const isLow = (b.available_copies || 0) <= 2;
            const isOut = (b.available_copies || 0) === 0;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      {b.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {b.title_bn}
                    </h3>
                    {b.title_ar && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-arabic mt-0.5" dir="rtl">
                        {b.title_ar}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    {isOut ? (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        সম্পূর্ণ বিতরণ
                      </span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        সীমিত মজুদ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        পর্যাপ্ত মজুদ
                      </span>
                    )}
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                      {b.available_copies} / {b.total_copies} কপি খালি
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>লেখক / মুসান্নিফ: <b className="font-semibold">{b.author}</b></span>
                  </div>
                  {b.isbn && (
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>ISBN / ক্যাটালগ কোড: {b.isbn}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-primary-900 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-gold" />
                <h3 className="text-sm font-bold">নতুন কিতাব সংযোজন ফরম</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">কিতাবের নাম (বাংলা)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সহীহুল বুখারী (৮ খণ্ড)"
                  value={formTitleBn}
                  onChange={(e) => setFormTitleBn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">কিতাবের নাম (আরবি, ঐচ্ছিক)</label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="صحيح البخاري"
                  value={formTitleAr}
                  onChange={(e) => setFormTitleAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">লেখক / মুসান্নিফ</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ইমাম বুখারী (রহ.)"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শাস্ত্র / ক্যাটাগরি</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="হাদীস শাস্ত্র">হাদীস শাস্ত্র</option>
                    <option value="ফিকহুল ইসলাম">ফিকহুল ইসলাম</option>
                    <option value="তাফসীর">তাফসীর</option>
                    <option value="আরবি ব্যাকরণ">আরবি ব্যাকরণ</option>
                    <option value="উসূলুল ফিকহ">উসূলুল ফিকহ</option>
                    <option value="ইতিহাস ও সিরাত">ইতিহাস ও সিরাত</option>
                    <option value="সাধারণ">সাধারণ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">কপি সংখ্যা</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formTotalCopies}
                    onChange={(e) => setFormTotalCopies(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ISBN / ক্যাটালগ নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="978-984-xxx-xxx"
                  value={formIsbn}
                  onChange={(e) => setFormIsbn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'কিতাব যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
