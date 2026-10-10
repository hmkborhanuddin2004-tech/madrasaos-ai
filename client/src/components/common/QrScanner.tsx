import React, { useEffect, useRef, useState } from 'react';
import { X, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onResult?: (result: string) => void;
}

interface VerifyResult {
  ok: boolean;
  type?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export const QrScanner: React.FC<QrScannerProps> = ({ isOpen, onClose, onResult }) => {
  const [scanning, setScanning] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const divId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setVerifyResult(null);
      setError(null);
      return;
    }
    startScanner();
    return () => stopScanner();
  }, [isOpen]);

  const startScanner = async () => {
    try {
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode(divId);
      scannerRef.current = html5QrCode;
      setScanning(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => {} // ignore scan failures silently
      );
    } catch (err) {
      setError('ক্যামেরা চালু করতে সমস্যা হয়েছে। ব্রাউজারে ক্যামেরার অনুমতি দিন।');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current as { stop: () => Promise<void>; clear: () => void };
        await scanner.stop();
        scanner.clear();
      } catch (_) {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (text: string) => {
    await stopScanner();
    if (onResult) onResult(text);

    // Try to verify the QR via our API
    try {
      const url = new URL(text);
      const params = new URLSearchParams(url.search);
      const type = params.get('type');
      const id = params.get('id');
      const sig = params.get('sig');

      if (type && id && sig) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/v1/verify?type=${type}&id=${id}&sig=${sig}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setVerifyResult(data);
      } else {
        setVerifyResult({ ok: false, error: 'অবৈধ QR কোড' });
      }
    } catch {
      // Not a URL — just show the raw text
      setVerifyResult({ ok: true, data: { raw: text } });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-600">
          <div className="flex items-center gap-2 text-white">
            <QrCode className="w-5 h-5" />
            <span className="font-semibold text-lg">QR স্ক্যানার</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-emerald-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Result view */}
          {verifyResult ? (
            <div className={`rounded-xl p-4 ${verifyResult.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {verifyResult.ok
                  ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  : <AlertCircle className="w-6 h-6 text-red-500" />
                }
                <span className={`font-bold text-lg ${verifyResult.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                  {verifyResult.ok ? '✅ যাচাই সফল' : '❌ অবৈধ QR কোড'}
                </span>
              </div>
              {verifyResult.ok && verifyResult.data && (
                <div className="space-y-1 text-sm text-gray-700">
                  {Object.entries(verifyResult.data).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium text-gray-500 min-w-24">{key}:</span>
                      <span>{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
              {!verifyResult.ok && (
                <p className="text-sm text-red-600">{verifyResult.error || 'এই QR কোড যাচাই করা সম্ভব হয়নি।'}</p>
              )}
              <button
                onClick={() => { setVerifyResult(null); startScanner(); }}
                className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                আবার স্ক্যান করুন
              </button>
            </div>
          ) : (
            <>
              {/* Scanner viewfinder */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ minHeight: 300 }}>
                <div id={divId} className="w-full" />
                {scanning && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                    <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                      QR কোডের দিকে ক্যামেরা ধরুন
                    </span>
                  </div>
                )}
                {!scanning && !error && (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">ক্যামেরা চালু হচ্ছে...</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center h-64 px-4">
                    <div className="text-center">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-500">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
