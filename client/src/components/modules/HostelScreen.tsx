import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bed, Users, PlusCircle, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';

export const HostelScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const [hostelData, setHostelData] = useState<any>(null);
  const [showOutpassModal, setShowOutpassModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('পারিবারিক ছুটি');
  const [returnTime, setReturnTime] = useState('2026-09-22 18:00');
  const [residentialStudents, setResidentialStudents] = useState<any[]>([]);

  const fetchHostel = async () => {
    try {
      const data = await apiCall('/api/v1/hostels/status');
      setHostelData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResidentialStudents = async () => {
    try {
      const res = await apiCall('/api/v1/students?isResidential=true&limit=100');
      const list = res?.students || res || [];
      setResidentialStudents(list);
      if (list.length > 0) {
        setStudentId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHostel();
    fetchResidentialStudents();
  }, []);

  const handleIssueOutpass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/api/v1/hostels/outpasses', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          reason,
          expectedReturnTime: returnTime,
          approvedBy: 'হোস্টেল সুপার মাওলানা ইসমাইল'
        })
      });
      setShowOutpassModal(false);
      fetchHostel();
      alert('আউটপাস সফলভাবে অনুমোদন করা হয়েছে।');
    } catch (err) {
      alert('আউটপাস এন্ট্রি করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">মোট ধারণক্ষমতা</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{hostelData?.totalCapacity || 18} সিট</div>
          <div className="text-[11px] text-slate-500 mt-1">{hostelData?.totalRooms || 3}টি আবাসিক কক্ষ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">বরাদ্দকৃত সিট</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">{hostelData?.totalOccupied || 15} সিট</div>
          <div className="text-[11px] text-teal-700 font-semibold mt-1">{hostelData?.occupancyRate || 83}% পূর্ণ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">খালি সিট সংখ্যা</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{hostelData?.availableBeds || 3}টি</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">নতুন বরাদ্দের উপযোগী</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">অনুমোদিত আউটপাস</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{hostelData?.activeOutpassesCount || 0} জন</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">ছুটিতে আছেন</div>
        </div>
      </div>

      {/* Header with Outpass Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bed className="w-5 h-5 text-teal-700" />
          <span>ওমর ফারুক (রা.) ছাত্রাবাস - কক্ষ ও বেড বিন্যাস</span>
        </h2>

        <button
          onClick={() => setShowOutpassModal(true)}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন আউটপাস ইস্যু</span>
        </button>
      </div>

      {/* Rooms and Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hostelData?.rooms?.map((room: any) => (
          <div key={room.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="font-bold text-sm text-slate-900">রুম নং: {room.room_number}</span>
                <span className="text-xs text-slate-400 ml-2">তলা: {room.floor}</span>
              </div>
              <span className="text-xs font-bold text-slate-600">
                ধারণক্ষমতা: {room.capacity} সিট (খালি: {room.capacity - room.occupied}টি)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {room.beds?.map((bed: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                    bed.status === 'occupied'
                      ? 'border-teal-200 bg-teal-50/70 text-teal-950'
                      : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">বেড: {bed.bedNumber}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        bed.status === 'occupied' ? 'bg-teal-200 text-teal-900' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {bed.status === 'occupied' ? 'বরাদ্দকৃত' : 'খালি'}
                    </span>
                  </div>
                  <div className="font-semibold text-xs mt-2 truncate">
                    {bed.studentNameBn || '— ফাকা —'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Outpass Modal */}
      {showOutpassModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>আবাসিক ছাত্রের আউটপাস ইস্যু</span>
              </h3>
              <button onClick={() => setShowOutpassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueOutpass} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">শিক্ষার্থী নির্বাচন</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium"
                >
                  {residentialStudents.length > 0 ? (
                    residentialStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name_bn} ({s.class_name_bn || 'আবাসিক'} - রোল: {s.roll_number})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="std_001">আব্দুল্লাহ আল-মামুন (রুম ১০১)</option>
                      <option value="std_002">মুহাম্মদ ফারুক (রুম ১০১)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">ছুটি / প্রস্থানের কারণ</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">প্রত্যাশিত প্রত্যাবর্তনের সময়</label>
                <input
                  type="text"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowOutpassModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl shadow-md"
                >
                  আউটপাস অনুমোদন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
