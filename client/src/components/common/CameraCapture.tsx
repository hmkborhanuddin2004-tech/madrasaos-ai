import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, Upload, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payment_receipt' | 'result_card' | 'student_doc' | 'payslip' | 'other';
  refId?: string;
  onUploaded?: (fileId: string, url: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, type, refId, onUploaded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      try {
        // Fallback: try any camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      } catch {
        setCameraError('ক্যামেরা অ্যাক্সেস করা যায়নি। ব্রাউজারে ক্যামেরার অনুমতি দিন।');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  React.useEffect(() => {
    if (isOpen && !preview) {
      startCamera();
    }
    if (!isOpen) {
      stopCamera();
      setPreview(null);
      setUploadDone(false);
      setCameraError(null);
    }
    return () => { if (!isOpen) stopCamera(); };
  }, [isOpen, preview, startCamera, stopCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setPreview(null);
    setUploadDone(false);
    startCamera();
  };

  const upload = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('branchId') || '';
      const res = await fetch('/api/v1/uploads/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        },
        body: JSON.stringify({ type, refId, image: preview }),
      });
      const data = await res.json();
      if (data.ok) {
        setUploadDone(true);
        onUploaded?.(data.fileId, data.url);
        setTimeout(() => onClose(), 1500);
      } else {
        setCameraError('আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch {
      setCameraError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setUploading(false);
    }
  };

  const typeLabel: Record<string, string> = {
    payment_receipt: 'ফি রশিদ',
    result_card: 'রেজাল্ট কার্ড',
    student_doc: 'ছাত্রের ডকুমেন্ট',
    payslip: 'বেতন স্লিপ',
    other: 'ডকুমেন্ট',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-600">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <span className="font-semibold">{typeLabel[type]} — ছবি তুলুন</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-emerald-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Success state */}
          {uploadDone ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Check className="w-16 h-16 text-emerald-500" />
              <p className="text-emerald-700 font-semibold text-lg">ছবি সফলভাবে সেভ হয়েছে!</p>
            </div>
          ) : preview ? (
            /* Preview state */
            <div className="space-y-4">
              <img src={preview} alt="ছবির প্রিভিউ" className="w-full rounded-xl object-cover max-h-72" />
              {cameraError && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={retake}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  পুনরায় তুলুন
                </button>
                <button
                  onClick={upload}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </div>
          ) : (
            /* Camera viewfinder */
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ minHeight: 280 }}
                />
                {!cameraReady && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">ক্যামেরা চালু হচ্ছে...</p>
                    </div>
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center px-6">
                    <div className="text-center">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-400">{cameraError}</p>
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={capture}
                disabled={!cameraReady}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                ছবি তুলুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
