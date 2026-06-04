import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MirrorCore from '../components/ui/MirrorCore';
import { useSubmitJournal } from '../hooks/useSubmitJournal';
import type { EmotionState } from '../types';

const JournalView: React.FC<{ onEmotionChange: (e: EmotionState) => void }> = ({ onEmotionChange }) => {
  const [text, setText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { submitJournal, isLoading, error } = useSubmitJournal();
  
  const isWriting = text.length > 0;

  // Simulate emotional shift based on typing volume
  useEffect(() => {
    if (isSuccess) onEmotionChange('calm');
    else if (text.length === 0) onEmotionChange('reflective');
    else if (text.length > 0 && text.length < 20) onEmotionChange('hopeful');
    else if (text.length >= 20 && text.length < 60) onEmotionChange('excited');
    else if (text.length >= 60) onEmotionChange('calm');
  }, [text, isSuccess, onEmotionChange]);

  const handleSave = async () => {
    if (!text.trim() || isLoading) return;
    const result = await submitJournal(text);
    if (result) {
      setIsSuccess(true);
    }
  };

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-1 flex flex-col px-8 pt-12 pb-24 h-full"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-2">{today}</h2>
          <h1 className="font-serif text-3xl text-[var(--c-text)]">Journal</h1>
        </div>
        <div className="w-12 h-12 transform scale-[0.6] origin-top-right transition-all duration-1000" style={{ opacity: isWriting ? 1 : 0.6 }}>
          <MirrorCore isWriting={isWriting} emotionState={text.length > 60 ? 'calm' : text.length > 20 ? 'excited' : text.length > 0 ? 'hopeful' : 'reflective'} />
        </div>
      </div>

      <div className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              <textarea 
                className="flex-1 w-full bg-transparent resize-none outline-none font-sans font-light text-[1.1rem] leading-relaxed text-[var(--c-text)] placeholder-[var(--c-subtext)] placeholder-opacity-50 selection:bg-[var(--c-text)] selection:text-white"
                placeholder="What is occupying your mind today?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              
              <div className="mt-6 flex flex-col items-center">
                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                
                <AnimatePresence>
                  {text.trim().length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-6 py-3 rounded-full text-xs font-medium uppercase tracking-wider surface-glass text-[var(--c-text)] hover:bg-white/30 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Journal'}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <h2 className="font-serif text-2xl text-[var(--c-text)] mb-4">Entry Saved</h2>
              <p className="font-sans text-sm text-[var(--c-subtext)] mb-8 max-w-[80%] mx-auto leading-relaxed">
                Your thoughts have been securely captured. The Mirror is analyzing them for your daily reflection.
              </p>
              <button
                onClick={() => {
                  setText('');
                  setIsSuccess(false);
                }}
                className="px-6 py-3 rounded-full text-xs font-medium uppercase tracking-wider surface-glass text-[var(--c-text)] hover:bg-white/30 transition-all"
              >
                Write Another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default JournalView;
