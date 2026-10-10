import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { VoiceAssistantModal } from './VoiceAssistantModal';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang?: 'bn-BD' | 'bn-IN' | 'en-US';
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  openModalOnError?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  lang = 'bn-BD',
  className = '',
  title = 'মুখে কথা বলে লিখুন (ভয়েস ইনপুট)',
  size = 'md',
  openModalOnError = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<'bn-BD' | 'bn-IN' | 'en-US'>(lang);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Browser doesn't have Web Speech API -> open modal with audio recording / quick commands
      setIsModalOpen(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = activeLang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && onTranscriptRef.current) {
          onTranscriptRef.current(transcript.trim());
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.warn('[VoiceInput] Speech error:', event.error);

        // If network error (common with bn-BD or Chromium blocks)
        if (event.error === 'network') {
          if (activeLang === 'bn-BD') {
            // Try bn-IN fallback first
            setActiveLang('bn-IN');
            try {
              recognition.lang = 'bn-IN';
              recognition.start();
              return;
            } catch {}
          }
          // If still network error, open the helpful Voice Assistant Modal
          if (openModalOnError) {
            setIsModalOpen(true);
          }
        } else if (event.error === 'not-allowed') {
          if (openModalOnError) {
            setIsModalOpen(true);
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[VoiceInput] Start error:', err);
      setIsListening(false);
      if (openModalOnError) {
        setIsModalOpen(true);
      }
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const sizeClasses = { sm: 'p-1.5', md: 'p-2', lg: 'p-2.5' };
  const iconSizes   = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };

  return (
    <>
      <div className="relative inline-flex items-center gap-0.5">
        <button
          type="button"
          onClick={toggleListening}
          onContextMenu={handleOpenModal}
          title={isListening ? 'শুনছি... কথা বলা শেষ হলে ক্লিক করুন' : `${title} (রাইট-ক্লিক: ভয়েস সহকারী)`}
          className={`flex items-center gap-1.5 rounded-xl font-medium transition-all active:scale-95 touch-manipulation select-none cursor-pointer ${
            isListening
              ? 'bg-emerald-600 text-white animate-pulse shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/80 shadow-xs'
          } ${sizeClasses[size]} ${className}`}
          aria-label="ভয়েস ইনপুট"
        >
          <Mic className={`${iconSizes[size]} ${isListening ? 'animate-bounce' : ''}`} />
          {isListening && (
            <span className="text-[10px] font-bold tracking-tight">শুনছি...</span>
          )}
        </button>

        {/* Listening floating badge */}
        {isListening && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap z-50 animate-bounce">
            বাংলায় বলুন...
          </span>
        )}
      </div>

      {/* Full Interactive Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTranscript={(txt) => {
          onTranscriptRef.current(txt);
        }}
        initialLang={activeLang}
      />
    </>
  );
};
