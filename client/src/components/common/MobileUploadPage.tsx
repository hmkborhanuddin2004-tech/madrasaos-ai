import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, User } from 'lucide-react';

export const MobileUploadPage: React.FC = () => {
  const query = new URLSearchParams(window.location.search);
  const studentId = query.get('studentId') || '';
  const studentName = query.get('name') || 'শিক্ষার্থী';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !studentId) return;
    setIsUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('studentId', studentId);

      const res = await fetch('/api/v1/uploads/mobile-student-photo', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'আপলোড ব্যর্থ হয়েছে');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-6 text-center">
        
        {/* Header */}
        <div className="space-y-1">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 pt-2">
            শিক্ষার্থীর ছবি আপলোড
          </h2>
          <p className="text-xs text-slate-500">
            মোবাইল ক্যামেরা দিয়ে সরাসরি ছবি তুলে সাবমিট করুন
          </p>
        </div>

        {/* Student Info Card */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
            {studentName.slice(0, 1)}
          </div>
          <div className="truncate">
            <div className="font-bold text-xs text-slate-900 truncate">{studentName}</div>
            <div className="text-[11px] text-slate-500 font-mono">আইডি: {studentId}</div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        {isSuccess ? (
          <div className="py-6 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <div className="font-bold text-base text-slate-900">আলহামদুলিল্লাহ!</div>
            <p className="text-xs text-slate-600">
              শিক্ষার্থীর ছবি সফলভাবে আপলোড হয়েছে। আপনার কম্পিউটারের ড্যাশবোর্ডে এটি স্বয়ংক্রিয়ভাবে যুক্ত হয়ে গেছে।
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              আরেকটি ছবি তুলুন
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Circular Preview */}
            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-emerald-600 bg-slate-100 shadow-md flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-20 h-20 text-slate-300" />
              )}
            </div>

            {/* Buttons for Camera vs Gallery */}
            <div className="space-y-2.5">
              <label className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer">
                <Camera className="w-4 h-4" />
                <span>ক্যামেরা দিয়ে ছবি তুলুন</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs cursor-pointer border border-slate-200">
                <Upload className="w-4 h-4" />
                <span>গ্যালারি থেকে নির্বাচন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Action Button */}
            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                {isUploading ? 'আপলোড হচ্ছে...' : '✅ এই ছবি সেভ করুন'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
