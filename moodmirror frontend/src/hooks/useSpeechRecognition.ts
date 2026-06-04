import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window for vendor-prefixed SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface UseSpeechRecognitionOptions {
  silenceTimeoutMs?: number;  // Auto-stop after N ms of silence (default: 10000)
  lang?: string;              // Language for recognition (default: 'en-US')
  onSilenceTimeout?: () => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  audioLevel: number;  // 0-1 normalized volume level for visual feedback
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    silenceTimeoutMs = 10000,
    lang = 'en-US',
    onSilenceTimeout,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Audio level monitoring for visual feedback
  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        // Average the first 64 bins (low-mid frequencies = voice range)
        const voiceBins = dataArray.slice(0, 64);
        const avg = voiceBins.reduce((sum, val) => sum + val, 0) / voiceBins.length;
        setAudioLevel(Math.min(1, avg / 128)); // Normalize to 0-1
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic access denied or unavailable — degrade gracefully, animations just won't react
      setAudioLevel(0);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  // Silence detection: reset timer on every new result
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        onSilenceTimeout?.();
      }
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs, onSilenceTimeout]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      setTranscript(finalText);
      setInterimTranscript(interimText);
      resetSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return; // Silence, not an error
      if (event.error === 'aborted') return;   // Manual stop
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioMonitoring();
    resetSilenceTimer();
  }, [isSupported, lang, resetSilenceTimer, startAudioMonitoring]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioMonitoring();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [stopAudioMonitoring]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopAudioMonitoring();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [stopAudioMonitoring]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    audioLevel,
  };
}
