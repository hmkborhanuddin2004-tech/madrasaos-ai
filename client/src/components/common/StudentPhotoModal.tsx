import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Smartphone, QrCode, X, Check, RefreshCw, Copy, CheckCircle2, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';

interface StudentPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  currentPhotoUrl?: string;
  onPhotoUpdated: (newPhotoUrl: string) => void;
}

export const StudentPhotoModal: React.FC<StudentPhotoModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  currentPhotoUrl,
  onPhotoUpdated
}) => {
  const { apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'mobile' | 'camera' | 'scan'>('upload');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mobile Upload State
  const [mobileQrDataUrl, setMobileQrDataUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // QR Scan State
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  // Reset and initialize
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setUploadSuccess(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCapturedPhoto(null);

      // Generate Mobile Upload URL & QR
      const host = window.location.origin;
      const url = `${host}/mobile-upload?studentId=${studentId}&name=${encodeURIComponent(studentName)}`;
      setMobileUrl(url);
      QRCode.toDataURL(url, { width: 220, margin: 2 })
        .then(setMobileQrDataUrl)
        .catch(console.error);
    } else {
      stopCamera();
    }
  }, [isOpen, studentId]);

  // Handle Camera
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedPhoto) {
      startCamera();
    } else if (activeTab !== 'camera') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, capturedPhoto]);

  // Live Mobile Upload Poller
  useEffect(() => {
    let interval: any = null;
    if (isOpen && activeTab === 'mobile') {
      interval = setInterval(async () => {
        try {
          const res = await apiCall(`/api/v1/students/${studentId}`);
          if (res?.avatar_url && res.avatar_url !== currentPhotoUrl) {
            onPhotoUpdated(res.avatar_url);
            setUploadSuccess(true);
            setTimeout(() => {
              onClose();
            }, 1200);
          }
        } catch {}
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, activeTab, studentId, currentPhotoUrl]);

  // Camera Functions
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: 'user' }
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setErrorMsg('ক্যামেরা চালু করা সম্ভব হয়নি। ডিভাইসের ক্যামেরা পারমিশন চেক করুন।');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Handle Local File Selection
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

  // Save / Upload Photo
  const handleSavePhoto = async (photoData: string | File) => {
    setIsUploading(true);
    setErrorMsg('');
    try {
      let finalUrl = '';
      if (typeof photoData === 'string') {
        // Base64 upload
        const res = await fetch('/api/v1/uploads/photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': localStorage.getItem('tenantId') || 'inst_main'
          },
          body: JSON.stringify({
            photo: photoData,
            type: 'student_avatar',
            refId: studentId
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'আপলোড ব্যর্থ হয়েছে');
        finalUrl = json.url;
      } else {
        // Multipart file upload
        const formData = new FormData();
        formData.append('photo', photoData);
        formData.append('type', 'student_avatar');
        formData.append('refId', studentId);

        const res = await fetch('/api/v1/uploads/photo', {
          method: 'POST',
          headers: {
            'X-Tenant-ID': localStorage.getItem('tenantId') || 'inst_main'
          },
          body: formData
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'আপলোড ব্যর্থ হয়েছে');
        finalUrl = json.url;
      }

      // Update student avatar
      await apiCall(`/api/v1/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: finalUrl })
      });

      onPhotoUpdated(finalUrl);
      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Scanner
  useEffect(() => {
    if (isOpen && activeTab === 'scan') {
      const scanner = new Html5QrcodeScanner(
        'photo-modal-qr-reader',
        { fps: 10, qrbox: { width: 240, height: 240 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          try {
            scanner.clear();
            const res = await fetch(decodedText);
            const data = await res.json();
            setScanResult(data);
          } catch {
            setScanResult({ raw: decodedText });
          }
        },
        () => {}
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              শিক্ষার্থীর ছবি সংযোজন ও স্ক্যান
            </h3>
            <div className="text-[11px] text-slate-500 font-medium">
              {studentName} (ID: {studentId})
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs Bar as requested */}
        <div className="grid grid-cols-4 p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setErrorMsg(''); }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px]">ছবি আপলোড</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('mobile'); setErrorMsg(''); }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition ${
              activeTab === 'mobile'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[10px]">মোবাইল আপলোড</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('camera'); setErrorMsg(''); }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="text-[10px]">ছবি তুলুন</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('scan'); setErrorMsg(''); }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[10px]">স্ক্যান করুন</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          
          {errorMsg && (
            <div className="w-full mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center">
              {errorMsg}
            </div>
          )}

          {uploadSuccess && (
            <div className="w-full mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ছবি সফলভাবে সংরক্ষিত ও আইডি কার্ডে যুক্ত হয়েছে!</span>
            </div>
          )}

          {/* TAB 1: ছবি আপলোড (Device File) */}
          {activeTab === 'upload' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="relative w-36 h-36 rounded-full border-4 border-emerald-600/30 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : currentPhotoUrl ? (
                  <img src={currentPhotoUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                )}
              </div>

              <div className="text-center">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-200 transition">
                  <Upload className="w-4 h-4" />
                  <span>ডিভাইস থেকে ছবি নির্বাচন করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="text-[11px] text-slate-400 mt-1">
                  JPG, PNG অথবা WebP ফরম্যাট (সর্বোচ্চ ১০ এমবি)
                </div>
              </div>

              {selectedFile && (
                <button
                  type="button"
                  onClick={() => handleSavePhoto(selectedFile)}
                  disabled={isUploading}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  {isUploading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও আইডি কার্ডে যুক্ত করুন'}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: মোবাইল থেকে আপলোড (QR Code + Link) */}
          {activeTab === 'mobile' && (
            <div className="w-full flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white border-2 border-emerald-600/40 rounded-2xl shadow-md">
                {mobileQrDataUrl ? (
                  <img src={mobileQrDataUrl} alt="Mobile QR" className="w-44 h-44 object-contain" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                    QR তৈরি হচ্ছে...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="font-bold text-xs text-slate-800 dark:text-white">
                  মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  মোবাইল ফোন দিয়ে উপরের QR কোডটি স্ক্যান করলে সরাসরি ফোনের ক্যামেরা দিয়ে ছবি তুলে সাবমিট করার পেজ খুলে যাবে।
                </p>
              </div>

              {/* Copy Link Button */}
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  readOnly
                  value={mobileUrl}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-mono text-slate-600 truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mobileUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 transition shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'কপি হয়েছে' : 'কপি লিংক'}</span>
                </button>
              </div>

              {/* Direct Native Camera trigger for handheld tablets/phones */}
              <div className="pt-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200">
                  <Camera className="w-3.5 h-3.5" />
                  <span>মোবাইলে সরাসরি ক্যামেরা চালু করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: ছবি তোলা (Live Webcam) */}
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <canvas ref={canvasRef} className="hidden" />

              {!capturedPhoto ? (
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-emerald-600 shadow-lg bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Circular Face Guide Overlay */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/60 pointer-events-none"></div>
                </div>
              ) : (
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-emerald-600 shadow-lg bg-slate-100 flex items-center justify-center">
                  <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3 w-full justify-center">
                {!capturedPhoto ? (
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ছবি তুলুন</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>পুনরায় তুলুন</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePhoto(capturedPhoto)}
                      disabled={isUploading}
                      className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: স্ক্যান করুন (QR & Document Scanner) */}
          {activeTab === 'scan' && (
            <div className="w-full flex flex-col items-center space-y-4">
              {!scanResult ? (
                <div id="photo-modal-qr-reader" className="w-full"></div>
              ) : (
                <div className="w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 text-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-700 mx-auto" />
                  <div className="font-bold text-xs text-slate-900">যাচাই সফল হয়েছে</div>
                  <pre className="text-[10px] text-left p-3 bg-white rounded-xl border font-mono overflow-auto max-h-36">
                    {JSON.stringify(scanResult, null, 2)}
                  </pre>
                  <button
                    type="button"
                    onClick={() => setScanResult(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    আবার স্ক্যান করুন
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
