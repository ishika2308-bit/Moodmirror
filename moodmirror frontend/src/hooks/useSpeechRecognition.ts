import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapacitorSpeechRecognition } from '@capacitor-community/speech-recognition';

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
  onaudiostart?: (() => void) | null;
  onaudioend?: (() => void) | null;
  onsoundstart?: (() => void) | null;
  onsoundend?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
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
  const transcriptRef = useRef('');
  const nativeListenersRef = useRef<any[]>([]);

  const isSupported = typeof window !== 'undefined' && 
    (Capacitor.isNativePlatform() || !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  // Audio level monitoring for visual feedback
  const startAudioMonitoring = useCallback(async () => {
    console.log('[useSpeechRecognition] startAudioMonitoring called');
    if (Capacitor.isNativePlatform()) {
      console.log('[useSpeechRecognition] Native: Skipping AudioContext/getUserMedia (disabled to prevent mic lock)');
      return;
    }
    try {
      console.log('[useSpeechRecognition] Requesting getUserMedia({ audio: true })');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[useSpeechRecognition] getUserMedia succeeded, tracks:', stream.getTracks().length);
      streamRef.current = stream;

      let audioCtx: AudioContext;
      try {
        audioCtx = new AudioContext();
        console.log('[useSpeechRecognition] AudioContext created, state:', audioCtx.state);
      } catch (ctxErr: any) {
        console.warn('[useSpeechRecognition] AudioContext creation failed:', ctxErr);
        setAudioLevel(0);
        return;
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        try {
          analyser.getByteFrequencyData(dataArray);
          // Average the first 64 bins (low-mid frequencies = voice range)
          const voiceBins = dataArray.slice(0, 64);
          const avg = voiceBins.reduce((sum, val) => sum + val, 0) / voiceBins.length;
          setAudioLevel(Math.min(1, avg / 128)); // Normalize to 0-1
        } catch (tickErr: any) {
          console.warn('[useSpeechRecognition] tick error:', tickErr);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (micErr: any) {
      console.warn('[useSpeechRecognition] getUserMedia failed:', micErr.name, micErr.message);
      // Mic access denied or unavailable — degrade gracefully, animations just won't react
      setAudioLevel(0);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    console.log('[useSpeechRecognition] 🛑 stopAudioMonitoring called');
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      console.log('[useSpeechRecognition] Closing AudioContext');
      audioContextRef.current.close().catch(e => console.warn('AudioContext close error:', e));
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`[useSpeechRecognition] Stopping ${tracks.length} media tracks`);
      tracks.forEach(t => {
        console.log(`[useSpeechRecognition] Stopping track: ${t.kind} - ${t.label}`);
        t.stop();
      });
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
    console.log('[useSpeechRecognition] ✅ stopAudioMonitoring complete');
  }, []);

  // Silence detection: reset timer on every new result
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        CapacitorSpeechRecognition.stop().catch(() => {});
        onSilenceTimeout?.();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
        onSilenceTimeout?.();
      }
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs, onSilenceTimeout]);

  const startListening = useCallback(async () => {
    console.log('[useSpeechRecognition] startListening called, isSupported:', isSupported);
    if (!isSupported) {
      console.error('[useSpeechRecognition] Speech recognition not supported');
      setError('Speech recognition is not supported in this browser/device.');
      return;
    }

    setError(null);
    setTranscript('');
    transcriptRef.current = '';
    setInterimTranscript('');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('[useSpeechRecognition] Native: Checking permissions');
        const { speechRecognition } = await CapacitorSpeechRecognition.checkPermissions();
        console.log('[useSpeechRecognition] Native: Permission check result:', speechRecognition);
        
        if (speechRecognition !== 'granted') {
          console.log('[useSpeechRecognition] Native: Requesting permissions');
          const { speechRecognition: requestResult } = await CapacitorSpeechRecognition.requestPermissions();
          console.log('[useSpeechRecognition] Native: Permission request result:', requestResult);
          if (requestResult !== 'granted') {
            setError('Microphone permission denied');
            return;
          }
        }

        // Remove any stale JS listeners from previous session.
        // Do NOT call stop() here — it hangs when no session is active,
        // blocking the entire startListening async function before start() is ever reached.
        console.log('[useSpeechRecognition] Native: Clearing stale listeners before new session');
        for (const listener of nativeListenersRef.current) {
          if (listener && typeof listener.remove === 'function') {
            listener.remove().catch(() => {});
          }
        }
        nativeListenersRef.current = [];
        
        console.log('[useSpeechRecognition] Native: Calling CapacitorSpeechRecognition.start()');
        await CapacitorSpeechRecognition.start({
          language: lang,
          maxResults: 5,
          prompt: "Say something",
          partialResults: true,
          popup: false,
        });
        console.log('[useSpeechRecognition] Native: CapacitorSpeechRecognition.start() returned successfully');
        // Fallback: if the plugin does not fire listeningState 'started',
        // set isListening true after a short timeout so UI stays in sync.
        const startFallbackTimer = setTimeout(() => {
          setIsListening(prev => {
            if (!prev) {
              console.log('[useSpeechRecognition] Native: Fallback setIsListening(true) triggered');
            }
            return true;
          });
        }, 500);
        
        console.log('[useSpeechRecognition] Native: Registering partialResults listener');
        const partialListener = await CapacitorSpeechRecognition.addListener('partialResults', (data: any) => {
          console.log('[useSpeechRecognition] Native: partialResults received:', data);
          // Ensure we're marked as listening when results arrive (safety net)
          setIsListening(true);
          if (data.matches && data.matches.length > 0) {
            setTranscript(data.matches[0]);
            transcriptRef.current = data.matches[0];
            resetSilenceTimer();
          }
        });
        nativeListenersRef.current.push(partialListener);
        
        console.log('[useSpeechRecognition] Native: Registering listeningState listener');
        const stateListener = await CapacitorSpeechRecognition.addListener('listeningState', (data: any) => {
           console.log('[useSpeechRecognition] Native: listeningState changed:', data);
           if (data.status === 'started') {
              // Microphone is NOW truly active on the Android side
              console.log('[useSpeechRecognition] Native: Microphone confirmed active via listeningState');
              clearTimeout(startFallbackTimer);
              setIsListening(true);
           } else if (data.status === 'stopped') {
              console.log('[useSpeechRecognition] Native: Session ended naturally, cleaning up listeners');
              clearTimeout(startFallbackTimer);
              Promise.resolve().then(async () => {
                for (const l of nativeListenersRef.current) {
                  if (l && typeof l.remove === 'function') {
                    await l.remove().catch(() => {});
                  }
                }
                nativeListenersRef.current = [];
              });
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              setIsListening(false);
           }
        });
        nativeListenersRef.current.push(stateListener);

        startAudioMonitoring();
        resetSilenceTimer();
      } catch (err: any) {
        console.error('[useSpeechRecognition] Native start error exception:', err, err.message, err.stack);
        setError(err.message || 'Speech recognition failed to start natively');
      }
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      console.error('[useSpeechRecognition] SpeechRecognition constructor not found');
      setError('Speech recognition is not available');
      return;
    }

    let recognition: SpeechRecognitionInstance;
    try {
      recognition = new SpeechRecognitionCtor();
      console.log('[useSpeechRecognition] SpeechRecognition instance created');
    } catch (initErr: any) {
      console.error('[useSpeechRecognition] Failed to create SpeechRecognition instance:', initErr);
      setError('Failed to initialize speech recognition');
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      console.log('[useSpeechRecognition] 🔵 onstart fired');
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0]?.transcript || '';
        if (result.isFinal) {
          finalText += transcriptText;
        } else {
          interimText += transcriptText;
        }
      }

      setTranscript(finalText);
      transcriptRef.current = finalText;
      setInterimTranscript(interimText);
      resetSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('[useSpeechRecognition] ❌ onerror fired', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[useSpeechRecognition] ⚫ onend fired');
      setIsListening(false);
      setInterimTranscript('');
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (startErr: any) {
      console.error('[useSpeechRecognition] recognition.start() threw:', startErr);
      setError('Speech recognition failed to start');
      return;
    }
    startAudioMonitoring();
    resetSilenceTimer();
  }, [isSupported, lang, resetSilenceTimer, startAudioMonitoring]);

  const stopListening = useCallback(async () => {
    console.log('[useSpeechRecognition] stopListening called');
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('[useSpeechRecognition] Native: Calling CapacitorSpeechRecognition.stop()');
        await CapacitorSpeechRecognition.stop();
        console.log('[useSpeechRecognition] Native: CapacitorSpeechRecognition.stop() returned');
      } catch (err) {
        console.error('[useSpeechRecognition] Native stop error exception:', err);
      }
      
      console.log('[useSpeechRecognition] Native: Removing specific listeners');
      for (const listener of nativeListenersRef.current) {
        if (listener && typeof listener.remove === 'function') {
          await listener.remove().catch(() => {});
        }
      }
      nativeListenersRef.current = [];
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Failed to stop recognition", e);
        }
      }
    }
    stopAudioMonitoring();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsListening(false);
  }, [stopAudioMonitoring]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
    setInterimTranscript('');
  }, []);

  // Keep transcriptRef in sync with state for use in event closures
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) {
        CapacitorSpeechRecognition.stop().catch(() => {});
        for (const listener of nativeListenersRef.current) {
          if (listener && typeof listener.remove === 'function') {
            listener.remove().catch(() => {});
          }
        }
        nativeListenersRef.current = [];
      } else {
        if (recognitionRef.current) recognitionRef.current.abort();
      }
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
