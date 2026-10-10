import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  BookOpen,
  Award,
  Star,
  Trophy,
  Save,
  MessageSquare,
  Clock,
  Heart,
  HelpCircle,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const MuhasabaScreen: React.FC = () => {
  const { user, apiCall } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'daily' | 'leaderboard'>('daily');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any | null>(null);

  // Form states for modal
  const [fajr, setFajr] = useState(false);
  const [dhuhr, setDhuhr] = useState(false);
  const [asr, setAsr] = useState(false);
  const [maghrib, setMaghrib] = useState(false);
  const [isha, setIsha] = useState(false);
  const [tahajjud, setTahajjud] = useState(false);
  const [tilawatPages, setTilawatPages] = useState(4);
  const [duasRead, setDuasRead] = useState(true);
  const [truthfulness, setTruthfulness] = useState(5);
  const [adab, setAdab] = useState(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDailyRecords = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/api/v1/muhasaba/daily?date=${selectedDate}`);
      setRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch muhasaba records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await apiCall('/api/v1/muhasaba/leaderboard');
      setLeaderboard(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDailyRecords();
  }, [selectedDate]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const openStudentModal = (st: any) => {
    setSelectedStudentForModal(st);
    setFajr(Boolean(st.fajr));
    setDhuhr(Boolean(st.dhuhr));
    setAsr(Boolean(st.asr));
    setMaghrib(Boolean(st.maghrib));
    setIsha(Boolean(st.isha));
    setTahajjud(Boolean(st.tahajjud));
    setTilawatPages(Number(st.tilawat_pages || 0));
    setDuasRead(Boolean(st.duas_read));
    setTruthfulness(Number(st.truthfulness_score || 5));
    setAdab(Number(st.adab_score || 5));
    setNotes(st.notes || '');
  };

  const calculateLiveScore = () => {
    let s = 0;
    if (fajr) s += 12;
    if (dhuhr) s += 12;
    if (asr) s += 12;
    if (maghrib) s += 12;
    if (isha) s += 12;
    if (tahajjud) s += 10;
    s += Math.min(10, tilawatPages * 2);
    if (duasRead) s += 5;
    s += Math.min(7.5, (truthfulness / 5) * 7.5);
    s += Math.min(7.5, (adab / 5) * 7.5);
    return Math.round(s * 10) / 10;
  };

  const handleSaveAmal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForModal) return;

    setSaving(true);
    try {
      await apiCall('/api/v1/muhasaba/record', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedStudentForModal.student_id,
          date: selectedDate,
          fajr: fajr ? 1 : 0,
          dhuhr: dhuhr ? 1 : 0,
          asr: asr ? 1 : 0,
          maghrib: maghrib ? 1 : 0,
          isha: isha ? 1 : 0,
          tahajjud: tahajjud ? 1 : 0,
          tilawat_pages: tilawatPages,
          duas_read: duasRead ? 1 : 0,
          truthfulness_score: truthfulness,
          adab_score: adab,
          notes
        })
      });
      setSelectedStudentForModal(null);
      fetchDailyRecords();
    } catch {
      alert('তথ্য সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>মুহাসাবা ও আমল ট্র্যাকিং সিস্টেম</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">দৈনিক নামায, তিলাওয়াত ও আখলাক মূল্যায়ন</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            পাঁচ ওয়াক্ত জামাতে নামায, তাহাজ্জুদ, কুরআন তিলাওয়াত ও সুন্নাহ ভিত্তিক আচরণ ট্র্যাকিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('daily')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'daily'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            দৈনিক খাতা
          </button>
          <button
            onClick={() => setActiveView('leaderboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === 'leaderboard'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>আমল লিডারবোর্ড</span>
          </button>
        </div>
      </div>

      {activeView === 'daily' && (
        <>
          {/* Date Selector */}
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>তারিখ নির্বাচন করুন:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:border-emerald-500 outline-hidden font-mono"
              />
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              {user.role === 'student'
                ? 'ব্যক্তিগত আমল খাতা'
                : user.role === 'guardian'
                ? 'সন্তানের আমল খাতা'
                : `মোট শিক্ষার্থী: ${records.length} জন`}
            </div>
          </div>

          {/* If Student Role: Render Personal Daily Amal Card (Strict Data Privacy) */}
          {user.role === 'student' ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>আমার আজকের আমল ও আত্মশুদ্ধি খাতা</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {records[0]?.full_name_bn || user.fullNameBn} • রোল: {records[0]?.roll_number || '০১'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">তারিখ</div>
                  <div className="text-xs font-bold text-emerald-800 font-mono">{selectedDate}</div>
                </div>
              </div>

              {/* 5 Waqt Jamat Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  ৫ ওয়াক্ত নামায (জামাতে আদায়)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: 'fajr', label: 'ফজর', state: fajr, setter: setFajr },
                    { key: 'dhuhr', label: 'যোহর', state: dhuhr, setter: setDhuhr },
                    { key: 'asr', label: 'আসর', state: asr, setter: setAsr },
                    { key: 'maghrib', label: 'মাগরিব', state: maghrib, setter: setMaghrib },
                    { key: 'isha', label: 'এশা', state: isha, setter: setIsha }
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => p.setter(!p.state)}
                      className={`py-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition ${
                        p.state
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {p.state ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tahajjud & Duas */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTahajjud(!tahajjud)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                    tahajjud
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">তাহাজ্জুদ সালাত</div>
                    <div className="text-[10px] text-slate-500">রাতের শেষ তৃতীয়াংশে</div>
                  </div>
                  {tahajjud ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDuasRead(!duasRead)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                    duasRead
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">মাসনূন দু'আ ও যিকির</div>
                    <div className="text-[10px] text-slate-500">সকাল-সন্ধ্যার দু'আ</div>
                  </div>
                  {duasRead ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                </button>
              </div>

              {/* Tilawat Pages */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">কুরআন তিলাওয়াত (পৃষ্ঠা সংখ্যা)</span>
                  <span className="font-bold text-emerald-700 font-mono">{tilawatPages} পৃষ্ঠা</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={tilawatPages}
                    onChange={(e) => setTilawatPages(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>
              </div>

              {/* Truthfulness & Akhlaq Rating */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">সত্যবাদিতা ও সততা</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTruthfulness(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= truthfulness ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">আদব ও সুন্নাহ আচরণ</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setAdab(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= adab ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Amal Score & Save Button */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800">আজকের আমল স্কোর</div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    {calculateLiveScore()} <span className="text-xs font-normal text-emerald-700">/ ১০০</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await apiCall('/api/v1/muhasaba/record', {
                        method: 'POST',
                        body: JSON.stringify({
                          student_id: records[0]?.student_id || 'std_001',
                          date: selectedDate,
                          fajr: fajr ? 1 : 0,
                          dhuhr: dhuhr ? 1 : 0,
                          asr: asr ? 1 : 0,
                          maghrib: maghrib ? 1 : 0,
                          isha: isha ? 1 : 0,
                          tahajjud: tahajjud ? 1 : 0,
                          tilawat_pages: tilawatPages,
                          duas_read: duasRead ? 1 : 0,
                          truthfulness_score: truthfulness,
                          adab_score: adab,
                          notes
                        })
                      });
                      alert('আপনার আমল সফলভাবে সংরক্ষিত হয়েছে! মাশাআল্লাহ।');
                      fetchDailyRecords();
                    } catch (err: any) {
                      alert('আমল সংরক্ষণে সমস্যা হয়েছে: ' + err.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'আমল সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Student Amal Table for Teachers and Admins */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <tr>
                      <th className="px-5 py-3.5">শিক্ষার্থী</th>
                      <th className="px-5 py-3.5 text-center">৫ ওয়াক্ত নামায (জামাত)</th>
                      <th className="px-5 py-3.5 text-center">তাহাজ্জুদ</th>
                      <th className="px-5 py-3.5 text-center">তিলাওয়াত</th>
                      <th className="px-5 py-3.5 text-center">আখলাক / আদব</th>
                      <th className="px-5 py-3.5 text-center">আমল স্কোর</th>
                      <th className="px-5 py-3.5 text-right">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                          আমল রেকর্ড লোড হচ্ছে...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                          কোনো শিক্ষার্থী পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      records.map((st) => (
                        <tr key={st.student_id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-800">{st.full_name_bn}</div>
                            <div className="text-[11px] text-slate-400 font-mono">রোল: {st.roll_number}</div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <span title="ফজর" className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${st.fajr ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>ফ</span>
                              <span title="জোহর" className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${st.dhuhr ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>যো</span>
                              <span title="আসর" className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${st.asr ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>আ</span>
                              <span title="মাগরিব" className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${st.maghrib ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>মা</span>
                              <span title="এশা" className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${st.isha ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>এ</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold">
                            {st.tahajjud ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">হ্যাঁ ✨</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">
                            {st.tilawat_pages ? `${st.tilawat_pages} পৃষ্ঠা` : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: st.adab_score || 5 }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              st.total_score >= 90
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : st.total_score >= 70
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {st.total_score} / ১০০
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openStudentModal(st)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition text-[11px] cursor-pointer"
                            >
                              আমল এন্ট্রি
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Leaderboard View */}
      {activeView === 'leaderboard' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>মাসিক আমল স্টার ও শীর্ষ র্যাংকিং তালিকা</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {leaderboard.slice(0, 3).map((lead) => (
              <div
                key={lead.student_id}
                className="bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-200 rounded-2xl p-4 text-center relative overflow-hidden"
              >
                <div className="text-2xl mb-1">{lead.badge}</div>
                <div className="text-xs font-bold text-slate-800">{lead.full_name_bn}</div>
                <div className="text-[11px] text-slate-500 font-mono mb-2">রোল: {lead.roll_number}</div>
                <div className="inline-block bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-full text-xs shadow-xs">
                  গড় স্কোর: {lead.avg_score} / ১০০
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">র‌্যাংক</th>
                  <th className="px-4 py-3">শিক্ষার্থীর নাম</th>
                  <th className="px-4 py-3">মোট দিন</th>
                  <th className="px-4 py-3">তিলাওয়াত (মোট পৃষ্ঠা)</th>
                  <th className="px-4 py-3">নামাযের সংখ্যা</th>
                  <th className="px-4 py-3 text-right">গড় স্কোর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((lead) => (
                  <tr key={lead.student_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-emerald-800">
                      #{lead.rank} {lead.badge}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{lead.full_name_bn}</td>
                    <td className="px-4 py-3">{lead.days_recorded} দিন</td>
                    <td className="px-4 py-3 font-mono">{lead.total_tilawat_pages || 0} পৃষ্ঠা</td>
                    <td className="px-4 py-3 font-mono">{lead.total_prayers || 0} ওয়াক্ত</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">
                      {lead.avg_score} / ১০০
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Amal Entry Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {selectedStudentForModal.full_name_bn} - আমল খাতা
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">তারিখ: {selectedDate}</span>
              </div>
              <div className="bg-emerald-100 text-emerald-900 font-extrabold px-3 py-1 rounded-xl text-xs border border-emerald-300">
                লাইভ স্কোর: {calculateLiveScore()} / ১০০
              </div>
            </div>

            <form onSubmit={handleSaveAmal} className="space-y-4 text-xs">
              {/* 5 Daily Prayers Checkboxes */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">৫ ওয়াক্ত জামাতে নামায (প্রতিটি ১২ পয়েন্ট):</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'ফজর', state: fajr, set: setFajr },
                    { label: 'জোহর', state: dhuhr, set: setDhuhr },
                    { label: 'আসর', state: asr, set: setAsr },
                    { label: 'মাগরিব', state: maghrib, set: setMaghrib },
                    { label: 'এশা', state: isha, set: setIsha }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => p.set(!p.state)}
                      className={`p-2 rounded-xl font-bold text-center border transition cursor-pointer ${
                        p.state
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tahajjud & Duas */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTahajjud(!tahajjud)}
                  className={`p-2.5 rounded-xl font-bold border text-center transition cursor-pointer ${
                    tahajjud
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  তাহাজ্জুদ আদায় (+১০ পয়েন্ট)
                </button>
                <button
                  type="button"
                  onClick={() => setDuasRead(!duasRead)}
                  className={`p-2.5 rounded-xl font-bold border text-center transition cursor-pointer ${
                    duasRead
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  মাসনূন দুআ ও যিকির (+৫ পয়েন্ট)
                </button>
              </div>

              {/* Tilawat Pages */}
              <div>
                <label className="font-bold text-slate-700 flex justify-between mb-1">
                  <span>কুরআন তিলাওয়াত:</span>
                  <span className="text-emerald-700 font-mono font-bold">{tilawatPages} পৃষ্ঠা (+{Math.min(10, tilawatPages * 2)} পয়েন্ট)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={tilawatPages}
                  onChange={(e) => setTilawatPages(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Akhlaq & Adab rating */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সত্যবাদিতা ও সততা (১-৫):</label>
                  <select
                    value={truthfulness}
                    onChange={(e) => setTruthfulness(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl outline-hidden bg-slate-50"
                  >
                    <option value={5}>৫ - সর্বোচ্চ প্রশংসনীয়</option>
                    <option value={4}>৪ - উত্তম</option>
                    <option value={3}>৩ - মধ্যম</option>
                    <option value={2}>২ - সতর্কতা প্রয়োজন</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">আদব ও আচরণ (১-৫):</label>
                  <select
                    value={adab}
                    onChange={(e) => setAdab(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl outline-hidden bg-slate-50"
                  >
                    <option value={5}>৫ - সুন্নাহ অনুযায়ী আদর্শ</option>
                    <option value={4}>৪ - মার্জিত</option>
                    <option value={3}>৩ - সাধারণ</option>
                    <option value={2}>২ - ত্রুটিপূর্ণ</option>
                  </select>
                </div>
              </div>

              {/* Notes with Voice input */}
              <div>
                <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                  <span>ওস্তাদের বিশেষ মন্তব্য / নসীহত:</span>
                  <VoiceInputButton
                    onTranscript={(spoken) => setNotes((prev) => (prev ? `${prev} ${spoken}` : spoken))}
                    size="sm"
                    title="মন্তব্য মুখে বলুন..."
                  />
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: মাশাআল্লাহ, আজ জামাতের সাথে তাহাজ্জুদ আদায় করেছে..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-hidden bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'আমল সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
