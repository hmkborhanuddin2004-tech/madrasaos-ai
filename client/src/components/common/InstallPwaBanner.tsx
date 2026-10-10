import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Apple, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('madrasaos_pwa_dismissed') === 'true';
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'desktop' | 'android' | 'ios'>('desktop');

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect device type to set default guide tab
    const userAgent = navigator.userAgent || '';
    if (/android/i.test(userAgent)) {
      setActiveGuideTab('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      setActiveGuideTab('ios');
    } else {
      setActiveGuideTab('desktop');
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show smooth in-app guide modal instead of harsh browser alert()
      setShowGuideModal(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('madrasaos_pwa_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs transition relative z-30 border-b border-emerald-600/40">
        <div className="flex items-center gap-2.5 max-w-2xl">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 border border-white/20">
            <Smartphone className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="truncate">
            <span className="font-bold text-emerald-100">MadrasaOS অ্যাপ ইনস্টল:</span>
            <span className="hidden sm:inline text-white/90 ml-1.5 font-normal">
              মোবাইল ও কম্পিউটারে নেটিভ অ্যাপের মতো অফলাইনে চালান ও দ্রুত পরিচালনা করুন।
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            onClick={handleInstallClick}
            className="bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer border border-emerald-100"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>অ্যাপ ইনস্টল</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-white transition cursor-pointer"
            title="ব্যানার বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Elegant In-App Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Download className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">MadrasaOS অ্যাপ ইনস্টল নির্দেশিকা</h3>
                  <p className="text-xs text-emerald-200">আপনার ডিভাইসে ১ ক্লিকে অ্যাপ হিসেবে যুক্ত করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Device Selector Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1.5 gap-1.5">
              <button
                onClick={() => setActiveGuideTab('desktop')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeGuideTab === 'desktop'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>কম্পিউটার (PC)</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('android')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeGuideTab === 'android'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android ফোন</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('ios')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeGuideTab === 'ios'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 space-y-4">
              {activeGuideTab === 'desktop' && (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">১</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      আপনার ব্রাউজারের (Chrome/Edge) <strong>অ্যাড্রেস বারের একদম ডানপাশে</strong> (URL এর পাশে) ছোট <strong>🖥️ বা ⬇️ "ইনস্টল / Install MadrasaOS"</strong> আইকনটিতে ক্লিক করুন।
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">২</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      অথবা ব্রাউজার মেনুর <strong>তিনটি ডট (⋮)</strong> ক্লিক করে <strong>"Save and Share" ➔ "Install page as app"</strong> অপশনে চাপুন।
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">৩</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      পপআপে <strong>"Install"</strong> বাটনে ক্লিক করলেই সফটওয়্যারটি আপনার ডেস্কটপে স্বতন্ত্র অ্যাপ হিসেবে চালু হয়ে যাবে।
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'android' && (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">১</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      গুগল ক্রোম (Chrome) ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮) মেনু</strong> আইকনটিতে ট্যাপ করুন।
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">২</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> নির্বাচন করুন।
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">৩</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>"Add" / "Install"</strong> বাটনে চাপ দিন। আপনার মোবাইল স্ক্রিনে MadrasaOS আইকন চলে আসবে।
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'ios' && (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">১</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      সাফারি (Safari) ব্রাউজারের নিচে <strong>শেয়ার আইকন (Share button / ⎋)</strong> এ ট্যাপ করুন।
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">২</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      একটু নিচে স্ক্রোল করে <strong>"Add to Home Screen"</strong> অপশনটিতে ট্যাপ করুন।
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">৩</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      উপরে ডানদিকের <strong>"Add"</strong> বাটনে চাপ দিন। আইফোনের হোমস্ক্রিনে অ্যাপটি সেভ হয়ে যাবে।
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow cursor-pointer"
              >
                বুঝেছি, ধন্যবাদ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
