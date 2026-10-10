import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XCircle, CheckCircle, X, Camera, QrCode, RefreshCcw, Upload, Image as ImageIcon, Search, ShieldCheck } from 'lucide-react';

interface DocumentCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'payment_receipt' | 'result_card' | 'student_doc' | 'payslip' | 'other';
  refId?: string;
  defaultTab?: 'qr' | 'camera';
  onPhotoUploaded?: (photo: any) => void;
}

export const DocumentCapture: React.FC<DocumentCaptureProps> = ({ 
  isOpen, 
  onClose, 
  type = 'other', 
  refId, 
  defaultTab = 'qr',
  onPhotoUploaded 
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'camera'>(defaultTab);

  // QR Scanner State
  const [scanResult, setScanResult] = useState<any>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrElementId = 'doc-capture-qr-viewport';

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setScanResult(null);
      setQrError(null);
      setManualCode('');
      setCapturedImage(null);
      setUploadError(null);
    } else {
      stopCamera();
      stopQrScanner();
    }
  }, [isOpen, defaultTab]);

  // Verification processor (handles URLs, student IDs, and raw text)
  const processVerification = async (text: string) => {
    setIsVerifying(true);
    setQrError(null);

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';

    try {
      let verifyUrl = '';

      if (text.startsWith('http://') || text.startsWith('https://')) {
        const url = new URL(text);
        const qType = url.searchParams.get('type');
        const qId = url.searchParams.get('id');
        const qSig = url.searchParams.get('sig');

        if (qType && qId && qSig) {
          verifyUrl = `${apiBase}/verify?type=${encodeURIComponent(qType)}&id=${encodeURIComponent(qId)}&sig=${encodeURIComponent(qSig)}`;
        } else {
          // URL without standard params - try raw code
          verifyUrl = `${apiBase}/verify?code=${encodeURIComponent(text)}`;
        }
      } else {
        // Plain text ID or code
        verifyUrl = `${apiBase}/verify?code=${encodeURIComponent(text.trim())}`;
      }

      const res = await fetch(verifyUrl);
      const data = await res.json();

      if (res.ok && data.ok) {
        setScanResult(data);
      } else {
        setQrError(data.error || 'তথ্য যাচাই করা সম্ভব হয়নি। সঠিক কোড লিখুন বা আবার স্ক্যান করুন।');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setQrError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। নেটওয়ার্ক সংযোগ যাচাই করুন।');
    } finally {
      setIsVerifying(false);
    }
  };

  const stopQrScanner = async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        html5QrRef.current.clear();
      } catch (e) {
        // ignore scanner cleanup errors
      }
      html5QrRef.current = null;
    }
  };

  // Handle QR Camera Scanner setup
  useEffect(() => {
    let isMounted = true;

    if (isOpen && activeTab === 'qr' && !scanResult) {
      const startScanner = async () => {
        try {
          await stopQrScanner();
          if (!isMounted) return;

          const scanner = new Html5Qrcode(qrElementId);
          html5QrRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 230, height: 230 } },
            async (decodedText: string) => {
              await stopQrScanner();
              processVerification(decodedText);
            },
            () => {} // silent on frame without qr
          );
        } catch (err) {
          // Camera might be denied or in use, we allow manual and file upload
          console.warn('QR camera stream unavailable:', err);
        }
      };

      // Slight timeout to let DOM element mount
      const t = setTimeout(startScanner, 200);
      return () => {
        isMounted = false;
        clearTimeout(t);
        stopQrScanner();
      };
    } else {
      stopQrScanner();
    }
  }, [isOpen, activeTab, scanResult]);

  // Handle file QR scan
  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopQrScanner();
      const scanner = new Html5Qrcode(qrElementId);
      html5QrRef.current = scanner;
      const decodedText = await scanner.scanFile(file, true);
      processVerification(decodedText);
    } catch (err) {
      setQrError('আপলোড করা ছবিতে কোনো স্পষ্ট QR কোড পাওয়া যায়নি।');
    }
  };

  // Handle Camera initialization for Photo Capture Tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera();
    }
    return () => {
      if (activeTab !== 'camera' || capturedImage) {
        stopCamera();
      }
    };
  }, [isOpen, activeTab, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera', err);
      setUploadError('ক্যামেরা চালু করা সম্ভব হয়নি। ডিভাইসে ক্যামেরা পারমিশন দেওয়া আছে কিনা পরীক্ষা করুন।');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setUploadError(null);
    startCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedImage) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
      const tenantId = localStorage.getItem('tenantId') || 'inst_main';
      const token = localStorage.getItem('token') || '';

      const res = await fetch(`${apiBase}/uploads/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          photo: capturedImage,
          type: type,
          refId: refId || 'none',
          note: 'Captured via MadrasaOS Document Scanner'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ছবি সংরক্ষণ ব্যর্থ হয়েছে।');
      }

      if (onPhotoUploaded) {
        onPhotoUploaded(data);
      }
      
      onClose();
    } catch (err: any) {
      console.error('Upload Error', err);
      setUploadError(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Header Tabs */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex space-x-6">
            <button 
              onClick={() => { setActiveTab('qr'); setCapturedImage(null); }}
              className={`flex items-center space-x-2 font-bold text-sm pb-1 transition-all ${
                activeTab === 'qr' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR ও কোড যাচাই</span>
            </button>
            <button 
              onClick={() => { setActiveTab('camera'); setScanResult(null); }}
              className={`flex items-center space-x-2 font-bold text-sm pb-1 transition-all ${
                activeTab === 'camera' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>নথি ও ছবি তুলুন</span>
            </button>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'qr' && (
            <div className="space-y-4">
              {!scanResult && !qrError && (
                <div className="space-y-4">
                  {/* Viewport Box for Live Scan */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                    <div id={qrElementId} className="w-full min-h-[220px]" />
                    <div className="p-2 bg-slate-900/90 text-center text-xs text-slate-300">
                      ক্যামেরার সামনে QR কোডটি ধরুন
                    </div>
                  </div>

                  {/* Image Upload for QR Option */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>গ্যালারি বা ছবি ফাইল থেকে QR স্ক্যান</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrFileUpload}
                    />
                  </div>

                  {/* Manual Code Entry Fallback */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      অথবা স্টুডেন্ট আইডি বা ভেরিফিকেশন কোড লিখুন:
                    </label>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (manualCode.trim()) processVerification(manualCode.trim());
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="যেমন: DUCM-2026-001 বা ইনভয়েস কোড"
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        disabled={isVerifying || !manualCode.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isVerifying ? (
                          <span>যাচাই...</span>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>যাচাই</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {qrError && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">যাচাইকরণ ব্যর্থ</h4>
                  <p className="text-red-600 text-sm font-medium mb-5 px-4">{qrError}</p>
                  
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => { setQrError(null); setScanResult(null); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                      পুনরায় স্ক্যান করুন
                    </button>
                  </div>
                </div>
              )}
              
              {/* Scan Success State */}
              {scanResult && (
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">যাচাই সফল হয়েছে</h3>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>MadrasaOS দ্বারা সত্য প্রমাণিত</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-sm space-y-2.5 mb-5">
                    {scanResult.type === 'student' && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500 text-xs">শিক্ষার্থীর নাম:</span>
                          <span className="font-bold text-slate-800">{scanResult.data?.name || scanResult.data?.studentName}</span>
                        </div>
                        {scanResult.data?.class && (
                          <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                            <span className="text-slate-500 text-xs">শ্রেণি / জামাত:</span>
                            <span className="font-medium text-slate-800">{scanResult.data.class}</span>
                          </div>
                        )}
                        {scanResult.data?.roll && (
                          <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                            <span className="text-slate-500 text-xs">রোল নম্বর:</span>
                            <span className="font-mono font-bold text-slate-800">{scanResult.data.roll}</span>
                          </div>
                        )}
                        {scanResult.data?.code && (
                          <div className="flex justify-between pt-0.5">
                            <span className="text-slate-500 text-xs">আইডি নম্বর:</span>
                            <span className="font-mono font-bold text-emerald-700">{scanResult.data.code}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {scanResult.type === 'payment' && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500 text-xs">রশিদ নং:</span>
                          <span className="font-mono font-bold text-slate-800">{scanResult.data?.receiptNo}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500 text-xs">পরিশোধের পরিমাণ:</span>
                          <span className="font-bold text-emerald-700">৳{scanResult.data?.amount}</span>
                        </div>
                        <div className="flex justify-between pt-0.5">
                          <span className="text-slate-500 text-xs">শিক্ষার্থীর নাম:</span>
                          <span className="font-medium text-slate-800">{scanResult.data?.studentName}</span>
                        </div>
                      </div>
                    )}

                    {scanResult.type !== 'student' && scanResult.type !== 'payment' && (
                      <pre className="text-xs overflow-auto font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                        {JSON.stringify(scanResult.data, null, 2)}
                      </pre>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setScanResult(null); setQrError(null); setManualCode(''); }}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                    >
                      আরেকটি যাচাই করুন
                    </button>
                    <button 
                      onClick={onClose}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-md transition-colors"
                    >
                      সম্পন্ন
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              {uploadError && (
                <div className="w-full p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
                  {uploadError}
                </div>
              )}

              {!capturedImage ? (
                <div className="w-full flex flex-col items-center relative rounded-xl overflow-hidden bg-black shadow-inner">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-auto max-h-[340px] aspect-[4/3] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center">
                    <button 
                      type="button"
                      onClick={capturePhoto}
                      aria-label="ছবি তুলুন"
                      className="w-16 h-16 bg-white rounded-full border-4 border-emerald-500 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-slate-300 bg-emerald-50"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm max-h-[320px] w-full flex justify-center bg-slate-100">
                    <img 
                      src={capturedImage} 
                      alt="Captured preview" 
                      className="h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex w-full space-x-3">
                    <button 
                      onClick={retakePhoto}
                      disabled={uploading}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span>পুনরায় তুলুন</span>
                    </button>
                    
                    <button 
                      onClick={uploadPhoto}
                      disabled={uploading}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {uploading ? (
                        <span>আপলোড হচ্ছে...</span>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>সংরক্ষণ করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
