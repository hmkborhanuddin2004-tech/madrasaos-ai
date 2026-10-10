import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const QrCodeDisplay: React.FC<{ type: string; id: string }> = ({ type, id }) => {
  const { apiCall } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiCall(`/api/v1/qr/${type}/${id}`)
      .then(res => {
        if (mounted && res && res.ok) {
          setQrDataUrl(res.qr);
        }
      })
      .catch(err => console.error(err));
    return () => { mounted = false; };
  }, [type, id, apiCall]);

  if (!qrDataUrl) {
    return <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">লোড হচ্ছে...</div>;
  }

  return (
    <div className="flex flex-col items-center mt-2 border-t pt-2">
      <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 mb-1" />
      <span className="text-[10px] text-slate-500 font-bold">স্ক্যান করে যাচাই করুন</span>
    </div>
  );
};
