import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { EmotionState } from '../types';

interface ArchiveCardData {
  entryId: string;
  month: string;
  day: string;
  emotionTheme: EmotionState;
  primaryEmotion: string;
  moodDnaSummary: string;
  fullText: string;
  emotionalDrivers: string[];
  reflection: string;
  recommendation: string;
}

import { useDashboard } from '../hooks/useDashboard';

const getCardGlow = (emotion: EmotionState) => {
  switch(emotion) {
    case 'hopeful': return 'rgba(255, 218, 185, 0.4)';
    case 'calm': return 'rgba(176, 224, 230, 0.4)';
    case 'reflective': return 'rgba(230, 230, 250, 0.4)';
    case 'stressed': return 'rgba(220, 20, 60, 0.4)';
    default: return 'rgba(255, 255, 255, 0.2)';
  }
};

const ArchiveView: React.FC<{ onEmotionChange?: (e: EmotionState) => void }> = ({ onEmotionChange }) => {
  const { data, isLoading } = useDashboard();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<ArchiveCardData | null>(null);

  // Map backend entries to UI format
  const entries: ArchiveCardData[] = (data?.recentEntries || []).map(entry => {
    const dateObj = new Date(entry.date);
    const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(dateObj.getDate()).padStart(2, '0');

    const primaryEmotion = entry.analysis?.primaryEmotion || 'Reflective';
    const emotionMap: Record<string, EmotionState> = {
      hopeful: 'hopeful', happy: 'hopeful', grateful: 'hopeful', optimistic: 'hopeful',
      calm: 'calm', peaceful: 'calm', relaxed: 'calm', content: 'calm',
      reflective: 'reflective', nostalgic: 'reflective', thoughtful: 'reflective',
      anxious: 'stressed', stressed: 'stressed', overwhelmed: 'stressed', frustrated: 'stressed',
      excited: 'excited', energetic: 'excited',
    };
    const emotionTheme = emotionMap[primaryEmotion.toLowerCase()] || 'reflective';

    return {
      entryId: entry.id,
      month,
      day,
      emotionTheme,
      primaryEmotion,
      moodDnaSummary: entry.analysis?.summary || 'No summary available.',
      fullText: entry.text,
      emotionalDrivers: entry.analysis?.emotionalDrivers || [],
      reflection: entry.analysis?.reflection || 'Reflecting on your thoughts...',
      recommendation: entry.analysis?.recommendation || 'Keep journaling to unlock more insights.',
    };
  });

  useEffect(() => {
    if (onEmotionChange && !selectedEntry && entries.length > 0 && entries[activeIndex]) {
      onEmotionChange(entries[activeIndex].emotionTheme);
    }
  }, [activeIndex, selectedEntry, onEmotionChange, entries]);

  const handleNext = () => {
    if (entries.length === 0) return;
    setActiveIndex((i) => (i - 1 + entries.length) % entries.length);
  };
  
  const handlePrev = () => {
    if (entries.length === 0) return;
    setActiveIndex((i) => (i + 1) % entries.length);
  };

  // 3D calculation
  const radius = 280; // Distance from center
  const theta = entries.length > 0 ? 360 / entries.length : 360; // Angle per item

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center h-full relative overflow-hidden"
    >
      <AnimatePresence>
        {!selectedEntry && (
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-6 font-serif text-3xl text-[var(--c-text)] z-20"
          >
            Archive
          </motion.h1>
        )}
      </AnimatePresence>

      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center opacity-50"
        >
          <p className="font-serif italic animate-pulse text-[var(--c-text)]">Loading your memories...</p>
        </motion.div>
      ) : entries.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center max-w-xs text-center"
        >
          <p className="font-sans text-sm text-[var(--c-subtext)] opacity-70">
            Your archive is empty. Start journaling to build your emotional timeline.
          </p>
        </motion.div>
      ) : (
        <>
          {/* 3D Carousel Container */}
      <AnimatePresence>
        {!selectedEntry && (
          <motion.div 
            className="relative w-full h-[400px] flex items-center justify-center"
            style={{ perspective: 1000 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
          >
            {/* Drag targets for touch / mouse */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-30 cursor-pointer" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-30 cursor-pointer" onClick={handleNext} />
            
            <motion.div 
              className="relative w-[220px] h-[320px]"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: activeIndex * theta }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            >
              {entries.map((entry, i) => {
                const isActive = i === activeIndex;
                const glow = getCardGlow(entry.emotionTheme);
                
                return (
                  <motion.div
                    layoutId={`card-${entry.entryId}`}
                    key={entry.entryId}
                    onClick={() => isActive && setSelectedEntry(entry)}
                    className={`absolute inset-0 rounded-[2.5rem] flex flex-col p-8 transition-all duration-700
                      ${isActive ? 'cursor-pointer hover:scale-[1.02]' : 'pointer-events-none'}`}
                    style={{
                      background: 'var(--c-card)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: `1px solid ${isActive ? glow : 'var(--c-border)'}`,
                      boxShadow: isActive ? `0 20px 40px -10px ${glow}` : 'none',
                      transform: `rotateY(${i * -theta}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      opacity: isActive ? 1 : Math.abs(activeIndex - i) === 1 || Math.abs(activeIndex - i) === entries.length - 1 ? 0.4 : 0,
                    }}
                  >
                    <motion.span layoutId={`month-${entry.entryId}`} className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--c-subtext)] opacity-80">{entry.month}</motion.span>
                    
                    <div className="flex-1 flex items-center justify-center mt-[-20px]">
                      <motion.h2 layoutId={`day-${entry.entryId}`} className="font-serif text-[7rem] leading-none text-[var(--c-text)] drop-shadow-sm">
                        {entry.day}
                      </motion.h2>
                    </div>

                    <div className="mt-auto">
                      <motion.div layoutId={`badge-${entry.entryId}`} className="inline-block px-3 py-1 rounded-full mb-4 shadow-sm" style={{ background: glow }}>
                        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--c-text)] mix-blend-multiply opacity-80">{entry.primaryEmotion}</span>
                      </motion.div>
                      <motion.p layoutId={`dna-${entry.entryId}`} className="font-serif italic text-base text-[var(--c-text)] opacity-90 line-clamp-2 leading-relaxed">
                        {entry.moodDnaSummary}
                      </motion.p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!selectedEntry && entries.length > 0 && !isLoading && (
          <motion.p 
            exit={{ opacity: 0 }}
            className="absolute bottom-24 text-xs font-medium text-[var(--c-subtext)] uppercase tracking-[0.2em] opacity-50 z-20 pointer-events-none"
          >
            Swipe left/right • Tap to open
          </motion.p>
        )}
      </AnimatePresence>

      {/* Journal Detail View Overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div 
            className="absolute inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
            exit={{ opacity: 0, backgroundColor: 'transparent' }}
          >
            <div className="min-h-full p-4 md:p-10 flex flex-col items-center pb-32">
              <button 
                onClick={() => setSelectedEntry(null)}
                className="self-start md:self-auto md:fixed top-8 left-8 mb-6 w-10 h-10 flex items-center justify-center rounded-full surface-glass text-[var(--c-text)] hover:bg-black/10 transition-colors z-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>

              <motion.div 
                layoutId={`card-${selectedEntry.entryId}`}
                className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                style={{
                  background: 'var(--c-card)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: `1px solid ${getCardGlow(selectedEntry.emotionTheme)}`,
                  boxShadow: `0 30px 60px -15px ${getCardGlow(selectedEntry.emotionTheme)}`,
                }}
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <motion.span layoutId={`month-${selectedEntry.entryId}`} className="block text-sm font-bold uppercase tracking-[0.3em] text-[var(--c-subtext)] mb-2">
                      {selectedEntry.month}
                    </motion.span>
                    <motion.h2 layoutId={`day-${selectedEntry.entryId}`} className="font-serif text-[4rem] md:text-[5rem] leading-none text-[var(--c-text)]">
                      {selectedEntry.day}
                    </motion.h2>
                  </div>
                  <motion.div layoutId={`badge-${selectedEntry.entryId}`} className="px-4 py-2 rounded-full" style={{ background: getCardGlow(selectedEntry.emotionTheme) }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-text)] mix-blend-multiply opacity-80">{selectedEntry.primaryEmotion}</span>
                  </motion.div>
                </div>

                <motion.p layoutId={`dna-${selectedEntry.entryId}`} className="font-serif italic text-xl md:text-2xl text-[var(--c-text)] mb-10 opacity-90 border-b border-[var(--c-border)] pb-8">
                  "{selectedEntry.moodDnaSummary}"
                </motion.p>

                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <section>
                    <h4 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-3">Journal Entry</h4>
                    <p className="font-sans text-[var(--c-text)] text-sm md:text-base leading-relaxed">{selectedEntry.fullText}</p>
                  </section>

                  <section className="bg-black/5 rounded-2xl p-6 border border-[var(--c-border)]">
                    <h4 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-3">AI Reflection</h4>
                    <p className="font-serif text-lg text-[var(--c-text)] leading-relaxed italic">{selectedEntry.reflection}</p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <h4 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-3">Primary Drivers</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.emotionalDrivers.map(driver => (
                          <span key={driver} className="px-3 py-1 bg-[var(--c-text)] text-[var(--c-card)] text-xs font-medium rounded-full opacity-80">
                            {driver}
                          </span>
                        ))}
                      </div>
                    </section>
                    
                    <section>
                      <h4 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-3">Recommendation</h4>
                      <p className="font-sans text-sm text-[var(--c-subtext)] leading-relaxed">{selectedEntry.recommendation}</p>
                    </section>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default ArchiveView;
