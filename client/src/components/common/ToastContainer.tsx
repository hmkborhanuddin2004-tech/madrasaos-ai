import React, { useEffect, useState } from 'react';
import { subscribeToasts, ToastItem } from '../../utils/toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts((items) => setToasts(items));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[999999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            t.type === 'success'
              ? 'bg-[#FAF8F5] text-[#17161A] border-emerald-600/40 ring-1 ring-emerald-600/20'
              : t.type === 'error'
              ? 'bg-[#FAF8F5] text-[#93321F] border-[#93321F]/40 ring-1 ring-[#93321F]/20'
              : t.type === 'warning'
              ? 'bg-[#FAF8F5] text-amber-900 border-amber-500/40 ring-1 ring-amber-500/20'
              : 'bg-[#FAF8F5] text-[#17161A] border-[#1F2A44]/30 ring-1 ring-[#1F2A44]/15'
          }`}
          style={{ fontFamily: "var(--font-bangla, 'Noto Serif Bengali', serif)" }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-[#93321F]" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-700" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-[#1F2A44]" />}
          </div>
          <div className="flex-1 text-xs leading-relaxed font-medium">
            {t.message}
          </div>
        </div>
      ))}
    </div>
  );
};
