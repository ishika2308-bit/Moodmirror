import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import MirrorCore from '../components/ui/MirrorCore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAnalyzeReflection } from '../hooks/useAnalyzeReflection';
import { useEmotionalGoals, matchGoalsDeterministically } from '../hooks/useEmotionalGoals';
import { useSaveJournal } from '../hooks/useSaveJournal';
import { useOnThisDay } from '../hooks/useOnThisDay';
import { OnThisDayCard } from '../components/OnThisDay/OnThisDayCard';
import { OnThisDayModal } from '../components/OnThisDay/OnThisDayModal';
import { ReflectionReviewScreen } from '../components/Reflection/ReflectionReviewScreen';
import { TimeCapsuleModal, TimeCapsuleMode } from '../components/Reflection/TimeCapsuleModal';
import { PhotoUploader } from '../components/Reflection/PhotoUploader';
import { EmotionalPlaylistUI } from '../components/Spotify/EmotionalPlaylistUI';
import type { MirrorState, EmotionState, AnalysisResult } from '../types';

const ReflectionView: React.FC<{
  onEmotionChange?: (e: EmotionState) => void;
  initialAnalysis?: AnalysisResult | null;
  initialTranscript?: string;
  currentEmotion?: EmotionState;
  onClearAnalysis?: () => void;
  onNavigateToArchive?: () => void;
}> = ({ onEmotionChange, initialAnalysis, initialTranscript, currentEmotion = 'calm', onClearAnalysis, onNavigateToArchive }) => {
  const { userProfile } = useAuth();
  const [mirrorState, setMirrorState] = useState<MirrorState>('idle');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [savedTranscript, setSavedTranscript] = useState(initialTranscript || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved-story' | 'saved-vault' | 'saved-capsule'>('idle');
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [segments, setSegments] = useState<string[]>([]);
  const [editedTranscript, setEditedTranscript] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const isInitialized = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const companionName = userProfile?.companionName || 'Mira';

  const { analyzeReflection, isLoading: isAnalyzing } = useAnalyzeReflection();
  const { activeGoals } = useEmotionalGoals();
  const { saveJournal, isLoading: isSaving } = useSaveJournal();
  
  const { memory: onThisDayMemory, isLoading: isMemoryLoading } = useOnThisDay();
  const [selectedOnThisDay, setSelectedOnThisDay] = useState(false);

  const emotionMap: Record<string, EmotionState> = {
    hopeful: 'hopeful', happy: 'hopeful', grateful: 'hopeful', optimistic: 'hopeful',
    calm: 'calm', peaceful: 'calm', relaxed: 'calm', content: 'calm',
    reflective: 'reflective', nostalgic: 'reflective', thoughtful: 'reflective',
    anxious: 'stressed', stressed: 'stressed', overwhelmed: 'stressed', frustrated: 'stressed',
    excited: 'excited', energetic: 'excited',
  };

  const handleSaveToStory = async () => {
    const textToSave = savedTranscript || initialTranscript;
    if (!analysis || !textToSave) return;
    const filesToUpload = selectedPhotos.map(p => p.file);
    const id = await saveJournal(textToSave, analysis, 'story', undefined, filesToUpload);
    if (id) {
      setSaveStatus('saved-story');
      setTimeout(() => {
        handleReset();
      }, 2000);
    }
  };

  const handleSealCapsule = async (days: number) => {
    const textToSave = savedTranscript || initialTranscript;
    if (!analysis || !textToSave) return;
    const filesToUpload = selectedPhotos.map(p => p.file);
    const id = await saveJournal(textToSave, analysis, 'capsule', days, filesToUpload);
    if (id) {
      setShowCapsuleModal(false);
      setSaveStatus('saved-capsule');
      setTimeout(() => {
        handleReset();
      }, 2000);
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

  const hasStartedListening = useRef(false);

  // Load draft on mount
  useEffect(() => {
    const savedSegments = localStorage.getItem('moodmirror_reflection_draft_segments');
    const savedEdited = localStorage.getItem('moodmirror_reflection_draft_edited');
    if (savedSegments) {
      try {
        const parsed = JSON.parse(savedSegments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSegments(parsed);
          setIsReviewing(true);
          if (savedEdited) {
            setEditedTranscript(savedEdited);
          }
        }
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
  }, []);

  // Auto-save segments
  useEffect(() => {
    if (segments.length > 0) {
      localStorage.setItem('moodmirror_reflection_draft_segments', JSON.stringify(segments));
    } else {
      localStorage.removeItem('moodmirror_reflection_draft_segments');
    }
  }, [segments]);

  // Auto-save edited draft
  useEffect(() => {
    if (editedTranscript !== null) {
      localStorage.setItem('moodmirror_reflection_draft_edited', editedTranscript);
    } else {
      localStorage.removeItem('moodmirror_reflection_draft_edited');
    }
  }, [editedTranscript]);

  useEffect(() => {
    if (isListening) {
      hasStartedListening.current = true;
    }
  }, [isListening]);

  // State machine: recording ended → transition to review screen
  useEffect(() => {
    if (mirrorState === 'listening' && !isListening && hasStartedListening.current) {
      const spokenText = transcript.trim();
      if (spokenText.length > 0) {
        const newSegments = [...segments, spokenText];
        setSegments(newSegments);
        setEditedTranscript(null);
        setIsReviewing(true);
        setMirrorState('idle');
      } else if (segments.length > 0) {
        setIsReviewing(true);
        setMirrorState('idle');
      } else {
        setMirrorState('idle');
        onEmotionChange?.('calm');
      }
      hasStartedListening.current = false;
    }
  }, [isListening, mirrorState, transcript, segments]);

  // Initialize state on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (initialAnalysis) {
      setAnalysis(initialAnalysis);
      setMirrorState('reflecting');
      const mapped = emotionMap[initialAnalysis.primaryEmotion?.toLowerCase()] || 'reflective';
      onEmotionChange?.(mapped);
    } else {
      setMirrorState('idle');
    }
  }, [initialAnalysis, onEmotionChange]);

  const beginProcessing = async (text: string) => {
    stopListening();
    setMirrorState('processing');
    onEmotionChange?.('neutral');
    setIsReviewing(false);
    setSavedTranscript(text);
    
    // Clear drafts
    localStorage.removeItem('moodmirror_reflection_draft_segments');
    localStorage.removeItem('moodmirror_reflection_draft_edited');
    setSegments([]);
    setEditedTranscript(null);

    const activeGoalsLite = activeGoals.map(g => ({id: g.id, title: g.title}));
    const result = await analyzeReflection(text, activeGoalsLite);
    if (result?.analysis) {
      // Merge deterministic matches with Gemini matches
      const deterministicMatches = matchGoalsDeterministically(text, activeGoals);
      const combinedGoalIds = Array.from(new Set([
        ...(result.analysis.linkedGoalIds || []),
        ...deterministicMatches
      ]));
      
      const finalAnalysis = {
        ...result.analysis,
        linkedGoalIds: combinedGoalIds
      };
      
      setAnalysis(finalAnalysis);
      setMirrorState('reflecting');
      const mapped = emotionMap[finalAnalysis.primaryEmotion?.toLowerCase()] || 'reflective';
      onEmotionChange?.(mapped);
    } else {
      setMirrorState('idle');
    }
  };

  const handleMirrorTap = () => {
    if (isComposing) {
      setIsComposing(false);
      return;
    }
    if (mirrorState === 'idle' || mirrorState === 'reflecting') {
      if (selectedOnThisDay) return;
      
      setAnalysis(null);
      setSavedTranscript('');
      setSaveStatus('idle');
      setSegments([]);
      setEditedTranscript(null);
      setIsReviewing(false);
      setShowCapsuleModal(false);
      resetTranscript();
      startListening();
      setMirrorState('listening');
      onEmotionChange?.('reflective');
    } else if (mirrorState === 'listening') {
      stopListening();
      
      const fullText = (segments.join(' ') + ' ' + transcript).trim();
      if (!hasStartedListening.current || fullText.length === 0) {
        setMirrorState('idle');
        onEmotionChange?.('calm');
        hasStartedListening.current = false;
      }
    }
  };

  const handleDismiss = () => {
    const textToSave = savedTranscript || initialTranscript;
    if (analysis && textToSave) {
      const filesToUpload = selectedPhotos.map(p => p.file);
      // Fire and forget save to vault
      saveJournal(textToSave, analysis, 'vault', undefined, filesToUpload).catch(console.error);
    }
    handleReset();
  };

  const handleReset = () => {
    setMirrorState('idle');
    setAnalysis(null);
    setSavedTranscript('');
    setSaveStatus('idle');
    setIsComposing(false);
    setComposerText('');
    setIsReviewing(false);
    setShowCapsuleModal(false);
    setSegments([]);
    setEditedTranscript(null);
    setSelectedPhotos([]);
    resetTranscript();
    onEmotionChange?.('calm');
    onClearAnalysis?.();
  };

  const handleComposerSubmit = () => {
    if (!composerText.trim()) return;
    setIsComposing(false);
    setSavedTranscript(composerText);
    beginProcessing(composerText);
  };

  const liveText = (transcript + ' ' + interimTranscript).trim();

  // Companion label shown above the reflection quote
  const companionLabel = `${companionName} says`;

  return (
    <motion.div
      ref={scrollContainerRef}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="flex-1 w-full flex flex-col items-center justify-start pt-16 pb-40 px-6 relative overflow-y-auto overflow-x-hidden scrollbar-hide"
    >
      {/* Mirror Core */}
      <motion.div 
        className="mb-10 transition-all duration-700 ease-in-out origin-top"
        animate={{ 
          scale: isComposing || isReviewing ? 0.4 : 1, 
          y: isComposing || isReviewing ? -20 : 0,
          opacity: isComposing || isReviewing ? 0.4 : 1 
        }}
      >
        <MirrorCore
          emotion={
            isComposing || isReviewing ? 'neutral' :
            analysis
              ? emotionMap[analysis.primaryEmotion?.toLowerCase()] || 'reflective'
              : 'reflective'
          }
          state={mirrorState}
          audioLevel={audioLevel}
          onTap={handleMirrorTap}
        />
      </motion.div>

      <div className="w-full flex-1 relative flex flex-col items-center justify-start">
        <AnimatePresence mode="wait">

          {/* COMPOSER STATE (FULL SCREEN) */}
          {isComposing && (
            <motion.div
              key="composing"
              layoutId="composer-container"
              initial={{ opacity: 0, y: 50, borderRadius: '24px' }}
              animate={{ opacity: 1, y: 0, borderRadius: '0px' }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 right-0 z-20 flex flex-col w-full bg-transparent"
            >
              <textarea
                autoFocus
                className="w-full h-[40vh] bg-transparent resize-none outline-none font-sans font-light text-[1.1rem] leading-relaxed text-[var(--c-text)] placeholder-[var(--c-subtext)] placeholder-opacity-50 selection:bg-[var(--c-text)] selection:text-white"
                placeholder="What's on your mind?"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (composerText.trim().length > 0) {
                      handleComposerSubmit();
                    }
                  }
                }}
              />
              
              <div className="mt-4 flex flex-col items-center">
                <AnimatePresence>
                  {composerText.trim().length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={handleComposerSubmit}
                      className="px-6 py-3 rounded-full text-xs font-medium uppercase tracking-wider surface-glass text-[var(--c-text)] hover:bg-white/30 transition-all"
                    >
                      Analyze Journal
                    </motion.button>
                  )}
                </AnimatePresence>

                <PhotoUploader 
                  selectedPhotos={selectedPhotos}
                  onPhotoAdd={(file) => setSelectedPhotos(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }])}
                  onPhotoRemove={(index) => setSelectedPhotos(prev => prev.filter((_, i) => i !== index))}
                />

                <button 
                  onClick={() => setIsComposing(false)}
                  className="mt-4 text-[0.6rem] font-medium uppercase tracking-widest text-[var(--c-subtext)] opacity-50 hover:opacity-80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* REVIEW STATE */}
          {isReviewing && !analysis && (
            <ReflectionReviewScreen
              key="review-screen"
              transcript={editedTranscript !== null ? editedTranscript : segments.join(' ')}
              onTranscriptChange={(text) => {
                setEditedTranscript(text);
              }}
              onContinueSpeaking={() => {
                setIsReviewing(false);
                resetTranscript();
                startListening();
                setMirrorState('listening');
                onEmotionChange?.('reflective');
              }}
              onReflect={() => {
                const text = editedTranscript !== null ? editedTranscript : segments.join(' ');
                setSavedTranscript(text);
                beginProcessing(text);
              }}
              companionName={companionName}
              selectedPhotos={selectedPhotos}
              onPhotoAdd={(file) => setSelectedPhotos(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }])}
              onPhotoRemove={(index) => setSelectedPhotos(prev => prev.filter((_, i) => i !== index))}
            />
          )}

        {/* IDLE STATE */}
        {mirrorState === 'idle' && !isComposing && !analysis && !isReviewing && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full flex flex-col items-center max-w-sm"
          >
            {/* On This Day Discovery */}
            {onThisDayMemory && !isMemoryLoading && (
              <motion.div 
                className="w-full mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <OnThisDayCard 
                  memory={onThisDayMemory} 
                  onClick={() => setSelectedOnThisDay(true)} 
                />
              </motion.div>
            )}

            <p className="font-serif text-[1.4rem] tracking-tight leading-[1.4] text-[var(--c-text)] opacity-80 text-center px-4">
              "Tap the mirror to begin reflecting."
            </p>

            {/* Emergency Reflection */}
            <button
              onClick={() => {
                setMirrorState('idle');
                onEmotionChange?.('stressed');
                setIsComposing(true);
              }}
              className="mt-6 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105 surface-glass"
              style={{
                color: 'var(--c-text)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              I need to talk
            </button>

            {/* Emotional Playlist */}
            <div className="w-full mt-4">
              <EmotionalPlaylistUI emotion={(currentEmotion || 'calm') as EmotionState} />
            </div>

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
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              Thinking...
            </motion.p>
          </motion.div>
        )}

        {/* REFLECTING STATE — Analysis Complete */}
        {mirrorState === 'reflecting' && analysis && saveStatus === 'idle' && (
          <motion.div
            key="reflecting-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-xs text-center"
          >
            {/* Companion label */}
            <motion.p
              className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[var(--c-subtext)] mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {companionLabel}
            </motion.p>

            {/* Companion message (hero) */}
            <p className="font-serif text-[1.2rem] tracking-tight leading-[1.5] text-[var(--c-text)] mb-4">
              "{analysis.reflection}"
            </p>

            {/* Key emotion + drivers */}
            {analysis.emotionalDrivers.length > 0 && (
              <motion.div
                className="flex flex-wrap justify-center gap-2 mt-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {analysis.emotionalDrivers.map((driver) => (
                  <span
                    key={driver}
                    className="px-3 py-1 bg-[var(--c-border)] text-[var(--c-text)] text-[0.6rem] font-medium rounded-full uppercase tracking-wider"
                  >
                    {driver}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Gentle recommendation */}
            {analysis.recommendation && (
              <motion.p
                className="font-sans text-xs text-[var(--c-subtext)] opacity-80 italic mb-6 leading-relaxed px-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {analysis.recommendation}
              </motion.p>
            )}

            {/* Action buttons */}
            {(savedTranscript || initialTranscript) && (
              <motion.div
                className="flex flex-col items-center gap-3 mt-2 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {/* Primary: Add To Today's Story */}
                <button
                  id="add-to-story-btn"
                  onClick={handleSaveToStory}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
                  style={{
                    background: 'var(--c-text)',
                    color: 'var(--c-card)',
                  }}
                >
                  {isSaving ? 'Saving...' : "✦ Add To Today's Story"}
                </button>

                {/* Secondary: Seal in Time Capsule */}
                <button
                  id="seal-capsule-btn"
                  onClick={() => {
                    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    setShowCapsuleModal(true);
                  }}
                  disabled={isSaving}
                  className="w-full px-4 py-2 rounded-full text-[0.65rem] font-medium uppercase tracking-wider border border-[var(--c-border)] text-[var(--c-text)] hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : '◇ Seal in Time Capsule'}
                </button>

                {/* Dismiss */}
                <button
                  onClick={handleDismiss}
                  disabled={isSaving}
                  className="mt-1 text-[0.6rem] font-medium uppercase tracking-widest text-[var(--c-subtext)] opacity-50 hover:opacity-80 transition-all"
                >
                  Dismiss (Saves to Vault)
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* REFLECTING STATE — Success Message */}
        {mirrorState === 'reflecting' && analysis && saveStatus !== 'idle' && (
          <motion.div
            key="reflecting-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-xs text-center flex flex-col items-center justify-center mt-10"
          >
            <p className="font-serif text-[1.2rem] text-[var(--c-text)] opacity-90">
              {saveStatus === 'saved-story' ? "Added to Today's Story" : "Sealed in Time Capsule"}
            </p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* BOTTOM COMPOSER (Collapsed) */}
      <AnimatePresence>
        {mirrorState === 'idle' && !isComposing && !analysis && !selectedOnThisDay && !isReviewing && (
          <motion.div
            layoutId="composer-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-6 right-6 z-10"
          >
            <div 
              onClick={() => setIsComposing(true)}
              className="w-full flex items-center justify-between gap-3 pl-5 pr-2 py-2 rounded-full surface-glass border border-white/10 shadow-lg cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-[var(--c-text)] opacity-50 shrink-0" />
                <p className="font-sans text-sm text-[var(--c-subtext)] opacity-70 truncate">
                  {composerText.trim() ? composerText.trim() : "What's on your mind?"}
                </p>
              </div>

              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <PhotoUploader 
                  variant="icon"
                  selectedPhotos={selectedPhotos}
                  onPhotoAdd={(file) => {
                    setSelectedPhotos(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
                    setIsComposing(true);
                  }}
                  onPhotoRemove={(index) => setSelectedPhotos(prev => prev.filter((_, i) => i !== index))}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ON THIS DAY MODAL */}
      <AnimatePresence>
        {selectedOnThisDay && onThisDayMemory && (
          <OnThisDayModal 
            key="on-this-day-modal"
            memory={onThisDayMemory}
            onClose={() => setSelectedOnThisDay(false)}
            companionName={companionName}
          />
        )}
      </AnimatePresence>

      {/* TIME CAPSULE MODAL */}
      <AnimatePresence>
        {showCapsuleModal && (
          <TimeCapsuleModal 
            mode="seal"
            onClose={() => setShowCapsuleModal(false)}
            onSeal={handleSealCapsule}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReflectionView;