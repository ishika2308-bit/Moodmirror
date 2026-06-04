import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MirrorCore from '../components/ui/MirrorCore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAnalyzeReflection } from '../hooks/useAnalyzeReflection';
import { useSaveJournal } from '../hooks/useSaveJournal';
import type { MirrorState, EmotionState, AnalysisResult } from '../types';

const ReflectionView: React.FC<{ onEmotionChange?: (e: EmotionState) => void }> = ({ onEmotionChange }) => {
  const [mirrorState, setMirrorState] = useState<MirrorState>('idle');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [savedTranscript, setSavedTranscript] = useState('');
  
  const { analyzeReflection, isLoading: isAnalyzing } = useAnalyzeReflection();
  const { saveJournal, isLoading: isSaving } = useSaveJournal();

  const handleSaveAction = async (isPrimary: boolean) => {
    if (!analysis || !savedTranscript) return;
    const success = await saveJournal(savedTranscript, analysis, isPrimary);
    if (success) {
      handleReset();
    }
  };

  const handleSilenceTimeout = useCallback(() => {
    // Silence detected — stop and begin processing
  }, []);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    audioLevel,
  } = useSpeechRecognition({
    silenceTimeoutMs: 10000,
    onSilenceTimeout: handleSilenceTimeout,
  });

  // State machine transitions driven by hook state changes
  useEffect(() => {
    if (mirrorState === 'listening' && !isListening && (transcript || savedTranscript)) {
      // Recording just ended with content — move to processing
      const fullText = (savedTranscript + ' ' + transcript).trim();
      if (fullText.length > 0) {
        setSavedTranscript(fullText);
        beginProcessing(fullText);
      }
    }
  }, [isListening, mirrorState, transcript, savedTranscript]);

  const beginProcessing = async (text: string) => {
    setMirrorState('processing');
    onEmotionChange?.('neutral');

    const result = await analyzeReflection(text);
    
    if (result && result.analysis) {
      setAnalysis(result.analysis);
      setMirrorState('reflecting');

      // Map primary emotion to theme
      const emotionMap: Record<string, EmotionState> = {
        hopeful: 'hopeful', happy: 'hopeful', grateful: 'hopeful', optimistic: 'hopeful',
        calm: 'calm', peaceful: 'calm', relaxed: 'calm', content: 'calm',
        reflective: 'reflective', nostalgic: 'reflective', thoughtful: 'reflective',
        anxious: 'stressed', stressed: 'stressed', overwhelmed: 'stressed', frustrated: 'stressed',
        excited: 'excited', energetic: 'excited',
      };
      const mapped = emotionMap[result.analysis.primaryEmotion.toLowerCase()] || 'reflective';
      onEmotionChange?.(mapped);
    } else {
      // Fallback to idle if it fails
      setMirrorState('idle');
    }
  };

  const handleMirrorTap = () => {
    if (mirrorState === 'idle' || mirrorState === 'reflecting') {
      // Reset everything and start listening
      setAnalysis(null);
      setSavedTranscript('');
      resetTranscript();
      startListening();
      setMirrorState('listening');
      onEmotionChange?.('reflective');
    } else if (mirrorState === 'listening') {
      // Stop recording
      stopListening();
    }
    // Do nothing if processing
  };

  const handleReset = () => {
    setMirrorState('idle');
    setAnalysis(null);
    setSavedTranscript('');
    resetTranscript();
    onEmotionChange?.('calm');
  };

  // Live display text
  const liveText = (transcript + ' ' + interimTranscript).trim();

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="flex-1 flex flex-col items-center justify-center -mt-8 px-6 relative"
    >
      {/* Mirror Core */}
      <div className="mb-10">
        <MirrorCore 
          emotionState={analysis ? (analysis.primaryEmotion.toLowerCase().includes('stress') ? 'stressed' : 'reflective') : 'reflective'}
          mirrorState={mirrorState}
          audioLevel={audioLevel}
          onTap={handleMirrorTap}
        />
      </div>

      {/* State-specific UI below the sphere */}
      <AnimatePresence mode="wait">

        {/* IDLE STATE */}
        {mirrorState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xs text-center"
          >
            <p className="font-serif text-[1.4rem] tracking-tight leading-[1.4] text-[var(--c-text)]">
              "Tap the mirror to begin reflecting."
            </p>
            <p className="mt-6 font-sans text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--c-subtext)]">
              {isSupported ? 'Speak your thoughts' : 'Voice not supported in this browser'}
            </p>
          </motion.div>
        )}

        {/* LISTENING STATE */}
        {mirrorState === 'listening' && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="max-w-xs text-center"
          >
            {/* Live Transcription */}
            {liveText ? (
              <motion.p 
                className="font-serif text-lg text-[var(--c-text)] leading-relaxed min-h-[3rem]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                "{liveText}"
              </motion.p>
            ) : (
              <motion.p 
                className="font-serif text-lg text-[var(--c-text)] opacity-50 italic"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Listening...
              </motion.p>
            )}

            <p className="mt-6 font-sans text-[0.6rem] font-medium uppercase tracking-[0.2em] text-[var(--c-subtext)] opacity-60">
              Tap mirror to finish
            </p>

            {error && (
              <p className="mt-2 font-sans text-xs text-red-400">
                {error === 'not-allowed' ? 'Microphone permission denied' : `Error: ${error}`}
              </p>
            )}
          </motion.div>
        )}

        {/* PROCESSING STATE */}
        {mirrorState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="max-w-xs text-center"
          >
            <motion.p 
              className="font-serif text-xl text-[var(--c-text)] italic"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Reflecting...
            </motion.p>
          </motion.div>
        )}

        {/* REFLECTING STATE — Analysis Complete */}
        {mirrorState === 'reflecting' && analysis && (
          <motion.div
            key="reflecting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="max-w-xs text-center"
          >
            <p className="font-serif text-[1.35rem] tracking-tight leading-[1.4] text-[var(--c-text)] mb-2">
              "{analysis.reflection}"
            </p>
            <p className="mt-6 font-sans text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--c-subtext)]">
              Today's Reflection
            </p>

            {/* Action buttons */}
            <motion.div 
              className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8 w-full max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <button
                onClick={() => handleSaveAction(false)}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-full text-[0.65rem] md:text-xs font-medium uppercase tracking-wider bg-[var(--c-text)] text-[var(--c-card)] hover:opacity-80 transition-all disabled:opacity-50 shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save to Journal'}
              </button>
              
              <button
                onClick={() => handleSaveAction(true)}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-full text-[0.65rem] md:text-xs font-medium uppercase tracking-wider border border-[var(--c-border)] text-[var(--c-text)] hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Make Main Entry'}
              </button>

              <button
                onClick={handleReset}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-full text-[0.65rem] md:text-xs font-medium uppercase tracking-wider surface-glass text-[var(--c-text)] hover:bg-white/30 transition-all disabled:opacity-50"
              >
                Keep as Reflection
              </button>
            </motion.div>

            {/* Drivers preview */}
            {analysis.emotionalDrivers.length > 0 && (
              <motion.div 
                className="flex flex-wrap justify-center gap-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {analysis.emotionalDrivers.map(driver => (
                  <span key={driver} className="px-3 py-1 bg-[var(--c-border)] text-[var(--c-text)] text-[0.6rem] font-medium rounded-full uppercase tracking-wider">
                    {driver}
                  </span>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReflectionView;
