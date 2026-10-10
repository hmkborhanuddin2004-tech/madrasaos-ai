import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Check, Globe, RefreshCw, Radio, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  initialLang?: 'bn-BD' | 'bn-IN' | 'en-US';
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onTranscript,
  initialLang = 'bn-BD'
}) => {
  const { apiCall } = useAuth();
  const { settings } = useSettings();

  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [currentLang, setCurrentLang] = useState<'bn-BD' | 'bn-IN' | 'en-US'>(initialLang);
  const [engine, setEngine] = useState<'web_speech' | 'gemini_ai'>('web_speech');
  const [statusMessage, setStatusMessage] = useState<string>('মাইক্রোফোন বাটনে ক্লিক করে কথা বলুন');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio equalizer bars (9 bars)
  const [equalizerLevels, setEqualizerLevels] = useState<number[]>([15, 20, 30, 45, 60, 45, 30, 20, 15]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Pre-configured voice quick commands
  const quickVoiceCommands = [
    'আজকের অবস্থা বলো',
    'আজকের ক্লাসের হাজিরা গ্রহণ',
    'শিক্ষার্থী তালিকা ও অনুসন্ধান',
    'ফি আদায় ও বকেয়া রসিদ',
    'হিফজ সবক ও মঞ্জিল খাতা',
    'যাদের ৩ মাসের বেশি ফি বাকি তাদের রিপোর্ট',
    'স্বয়ংক্রিয় কাজের অটোমেশন সেন্টার',
    'মাদ্রাসা সেটিংস ও কাস্টমাইজেশন'
  ];

  // Stop everything when closing
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      setTranscriptText('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Audio Visualizer setup
  const startVisualizer = async () => {
    try {
      if (!micStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(micStreamRef.current);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Pick 9 frequency bands
        const step = Math.floor(bufferLength / 9);
        const levels = Array.from({ length: 9 }, (_, i) => {
          const val = dataArray[i * step] || 0;
          return Math.max(12, Math.min(80, (val / 255) * 80 + 10));
        });

        setEqualizerLevels(levels);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // fallback to gentle pulse
    }
  };

  const stopVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setEqualizerLevels([15, 20, 30, 45, 60, 45, 30, 20, 15]);
  };

  const stopAll = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } catch {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    stopVisualizer();
    setIsListening(false);
    setIsRecordingAudio(false);
    setIsProcessing(false);
  };

  // Web Speech recognition handler
  const startWebSpeech = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setEngine('gemini_ai');
      startGeminiRecording();
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLang;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('মাইক্রোফোন সক্রিয় — বাংলায় স্পষ্ট করে কথা বলুন');
        startVisualizer();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript;
            setTranscriptText(final);
            onTranscript(final);
            setStatusMessage('সফলভাবে সম্পন্ন হয়েছে!');
            stopAll();
            setTimeout(() => onClose(), 700);
            return;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (interim) setTranscriptText(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceModal] Speech error:', event.error);
        if (event.error === 'network') {
          // Automatic switch to audio recording mode without scary error
          stopAll();
          setEngine('gemini_ai');
          setStatusMessage('অডিও রেকর্ডিং মোডে চলছে — কথা বলুন...');
          startGeminiRecording();
        } else if (event.error === 'not-allowed') {
          stopAll();
          setErrorMessage('ব্রাউজারের মাইক্রোফোন অনুমতি (Allow Microphone) দিন।');
        } else if (event.error !== 'no-speech') {
          stopAll();
          setErrorMessage(`স্পিচ ত্রুটি: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopVisualizer();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      stopVisualizer();
      setEngine('gemini_ai');
      startGeminiRecording();
    }
  };

  // MediaRecorder audio recording for Gemini
  const startGeminiRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      startVisualizer();

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopVisualizer();
        setIsRecordingAudio(false);
        setIsProcessing(true);
        setStatusMessage('গুগল জেমিনি এআই দিয়ে প্রসেস হচ্ছে...');

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
              const res = await apiCall('/api/v1/ai/transcribe-voice', {
                method: 'POST',
                body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' })
              });

              if (res.success && res.text) {
                setTranscriptText(res.text);
                onTranscript(res.text);
                setStatusMessage('সফলভাবে লেখা হয়েছে!');
                setTimeout(() => onClose(), 700);
              } else {
                setErrorMessage(res.message || 'ভয়েস শনাক্ত করা যায়নি। সেটিংস থেকে Gemini API Key দিন।');
              }
            } catch (apiErr: any) {
              setErrorMessage('এআই ভয়েস সার্ভারে সংযোগ করা যায়নি।');
            } finally {
              setIsProcessing(false);
            }
          };
        } catch (err: any) {
          setIsProcessing(false);
          setErrorMessage('অডিও প্রসেস করতে ব্যর্থ হয়েছে।');
        }
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setStatusMessage('মাইক্রোফোন সক্রিয় — কথা বলুন, শেষ হলে বাটনে ক্লিক করুন');
    } catch (err: any) {
      setIsRecordingAudio(false);
      stopVisualizer();
      setErrorMessage('মাইক্রোফোন সংযোগ ব্যর্থ: অনুমতি দেওয়া আছে কি না নিশ্চিত করুন।');
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      stopVisualizer();
      return;
    }
    if (isRecordingAudio) {
      try { mediaRecorderRef.current?.stop(); } catch {}
      return;
    }

    if (engine === 'web_speech') {
      startWebSpeech();
    } else {
      startGeminiRecording();
    }
  };

  const isActive = isListening || isRecordingAudio;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                স্মার্ট ভয়েস সহকারী (Voice Assistant)
              </h3>
              <p className="text-[11px] text-slate-400">
                বাংলায় কথা বলুন অথবা নিচের যেকোনো কমান্ডে ক্লিক করুন
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopAll(); onClose(); }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-center">
          {/* Main Microphone Button */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={handleToggleVoice}
              disabled={isProcessing}
              title={isActive ? 'কথা বলা শেষ হলে থামাতে ক্লিক করুন' : 'কথা বলতে ক্লিক করুন'}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-emerald-500/50 ring-8 ring-emerald-400/30 scale-105'
                  : isProcessing
                  ? 'bg-amber-500 text-white shadow-amber-500/30 ring-8 ring-amber-400/20'
                  : 'bg-slate-800 hover:bg-slate-750 text-emerald-400 border-2 border-emerald-500/30 hover:border-emerald-400 hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <RefreshCw className="w-11 h-11 animate-spin text-white" />
              ) : isActive ? (
                <Mic className="w-12 h-12 text-white animate-bounce" />
              ) : (
                <Mic className="w-12 h-12 text-emerald-400" />
              )}
            </button>

            {/* Real-time Audio Wave Equalizer (Dancing green bars when active) */}
            <div className="flex items-center justify-center gap-1.5 h-12 mt-4">
              {equalizerLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  style={{ height: isActive ? `${lvl}px` : '8px' }}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isActive
                      ? 'bg-emerald-400 shadow-xs shadow-emerald-400'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Status indicator badge (Always green when active - NEVER RED!) */}
            <div className="mt-1">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                isActive
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                  : isProcessing
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
              }`}>
                {isActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
                {statusMessage}
              </span>
            </div>

            {/* Live Transcript Display */}
            {transcriptText && (
              <div className="mt-4 w-full p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm font-semibold">
                "{transcriptText}"
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="mt-3 w-full p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Engine & Language Selectors */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800">
            <div className="inline-flex rounded-xl p-1 bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { stopAll(); setEngine('web_speech'); }}
                className={`px-3 py-1 rounded-lg transition ${
                  engine === 'web_speech'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 গুগল লাইভ স্পিচ
              </button>
              <button
                type="button"
                onClick={() => { stopAll(); setEngine('gemini_ai'); }}
                className={`px-3 py-1 rounded-lg transition ${
                  engine === 'gemini_ai'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🤖 জেমিনি এআই ভয়েস
              </button>
            </div>

            <div className="inline-flex rounded-xl p-1 bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrentLang('bn-BD')}
                className={`px-2.5 py-1 rounded-lg transition ${currentLang === 'bn-BD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}
              >
                🇧🇩 বাংলা
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('bn-IN')}
                className={`px-2.5 py-1 rounded-lg transition ${currentLang === 'bn-IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}
              >
                🇮🇳 বাংলা
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('en-US')}
                className={`px-2.5 py-1 rounded-lg transition ${currentLang === 'en-US' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Quick Click Commands */}
          <div className="pt-2 text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              অথবা এক ক্লিকে যেকোনো কমান্ড বলুন:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickVoiceCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onTranscript(cmd);
                    onClose();
                  }}
                  className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 transition text-left cursor-pointer"
                >
                  🗣️ {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
