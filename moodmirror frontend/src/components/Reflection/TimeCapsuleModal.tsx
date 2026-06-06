import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { MemoryArtifactGallery } from '../ui/MemoryArtifactGallery';

export type TimeCapsuleMode = 'seal' | 'unlock' | 'locked';

interface TimeCapsuleModalProps {
  mode: TimeCapsuleMode;
  memory?: any; 
  companionName?: string;
  onClose: () => void;
  onSeal?: (days: number) => void;
  onUnlock?: () => void;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({ 
  mode, 
  memory, 
  companionName = 'Mira', 
  onClose, 
  onSeal, 
  onUnlock 
}) => {
  const [step, setStep] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When the modal opens, smoothly scroll it into view 
    // so the user sees the animation at the top of the container.
    if (modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSealClick = (days: number) => {
    setStep(1);
    setTimeout(() => {
      onSeal?.(days);
    }, 2500);
  };

  const handleUnlockClick = () => {
    setStep(1);
    setTimeout(() => {
      setStep(2);
    }, 2500);
  };

  return (
    <motion.div
      ref={modalRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] p-6 md:rounded-[2.5rem] overflow-y-auto backdrop-blur-xl flex flex-col items-center justify-center"
      style={{ 
        background: `linear-gradient(to bottom, rgba(15, 15, 26, 0.95), rgba(10, 10, 20, 0.98))`,
        backgroundAttachment: 'fixed'
      }}
    >
      <button
        onClick={onClose}
        disabled={step === 1}
        className="absolute top-10 left-6 text-[0.65rem] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-opacity disabled:opacity-0"
      >
        ← Cancel
      </button>

      <AnimatePresence mode="wait">
        {mode === 'seal' && step === 0 && (
          <motion.div 
            key="seal-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Clock className="w-8 h-8 text-white/80" />
            </div>
            <h2 className="font-serif text-3xl text-white mb-2">Seal in Time Capsule</h2>
            <p className="font-sans text-sm text-white/60 mb-10 leading-relaxed px-4">
              Write a message to your future self. It will remain locked in the vault until the time is right.
            </p>

            <div className="space-y-4">
              {[30, 90, 365].map(days => (
                <button
                  key={days}
                  onClick={() => handleSealClick(days)}
                  className="w-full py-4 px-6 rounded-[1.5rem] bg-black/40 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-between group"
                >
                  <span className="font-sans text-[0.8rem] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                    {days === 365 ? '1 Year' : `${days} Days`}
                  </span>
                  <Lock className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {mode === 'seal' && step === 1 && (
          <motion.div 
            key="sealing-animation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div 
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/20 flex items-center justify-center mb-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/40 to-blue-500/40 blur-xl opacity-50" />
              <Lock className="w-8 h-8 text-white relative z-10" />
            </motion.div>
            <motion.h3 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-serif text-2xl text-white"
            >
              Sealing Capsule...
            </motion.h3>
          </motion.div>
        )}

        {mode === 'locked' && step === 0 && (
          <motion.div 
            key="locked-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Lock className="w-8 h-8 text-white/50" />
            </div>
            <h2 className="font-serif text-3xl text-white mb-2">Time Capsule Locked</h2>
            <p className="font-sans text-sm text-white/60 mb-6 leading-relaxed px-4">
              This memory is sealed until {memory?.unlockAt ? new Date(memory.unlockAt).toLocaleDateString() : 'the future'}.
            </p>

            {memory?.analysis?.attachments && memory.analysis.attachments.length > 0 && (
              <div className="flex justify-center gap-2 mb-8">
                {memory.analysis.attachments.map((attachment: any, i: number) => (
                  <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 opacity-70">
                    <div className="absolute inset-0 backdrop-blur-md bg-black/40 z-10 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white/50" />
                    </div>
                    <img 
                      src={attachment.storage.url} 
                      alt="Sealed memory" 
                      className="w-full h-full object-cover blur-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-full border border-white/20 text-white/80 hover:bg-white/10 transition-colors text-xs uppercase tracking-widest font-bold"
            >
              Return to Vault
            </button>
          </motion.div>
        )}

        {mode === 'unlock' && step === 0 && (
          <motion.div 
            key="unlock-ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm text-center"
          >
             <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30 relative"
            >
              <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full" />
              <Sparkles className="w-10 h-10 text-yellow-200 relative z-10" />
            </motion.div>
            
            <h2 className="font-serif text-3xl text-white mb-2">Time Capsule Ready</h2>
            <p className="font-sans text-sm text-white/60 mb-10 leading-relaxed px-4">
              A memory from the past is waiting to be uncovered. Are you ready to see it?
            </p>
            
            <button
              onClick={handleUnlockClick}
              className="w-full py-5 rounded-full text-[0.75rem] font-bold uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              style={{ background: 'white', color: 'black' }}
            >
              Break the Seal
            </button>
          </motion.div>
        )}

        {mode === 'unlock' && step === 1 && (
          <motion.div 
            key="unlocking-animation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            <motion.div 
              animate={{ rotateY: [0, 180, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-500/40 to-orange-500/40 border border-yellow-500/50 flex items-center justify-center mb-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-yellow-500/60 blur-xl opacity-80" />
              <Unlock className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
            </motion.div>
          </motion.div>
        )}

        {mode === 'unlock' && step === 2 && memory && (
          <motion.div 
            key="unlocked-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-left bg-black/40 rounded-[2rem] p-8 border border-white/10"
          >
            <div className="flex justify-center mb-6">
              <Unlock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="font-serif text-3xl text-white mb-2 text-center">Capsule Opened</h2>
            <p className="font-sans text-sm text-white/60 mb-8 text-center px-4">
              You sealed this on {new Date(memory.createdAt?.toDate ? memory.createdAt.toDate() : memory.createdAt).toLocaleDateString()}.
            </p>

            <div className="mb-8">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-3 text-center">
                Your Words Back Then
              </p>
              <p className="font-sans text-lg text-white/90 leading-relaxed font-light text-center">
                "{memory.text}"
              </p>

              {memory.analysis?.attachments && memory.analysis.attachments.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <MemoryArtifactGallery attachments={memory.analysis.attachments} />
                </div>
              )}
            </div>

            {memory.analysis?.reflection && (
               <div className="rounded-2xl p-6 bg-white/10 border border-white/20 mb-8">
                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-white/60 mb-2">
                    {companionName}'s Note
                  </p>
                  <p className="font-serif italic text-white/90">
                    "{memory.analysis.reflection}"
                  </p>
               </div>
            )}

            <button
              onClick={() => onUnlock?.()}
              className="w-full py-4 rounded-full text-[0.75rem] font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white hover:text-black border border-white/50"
              style={{ color: 'white' }}
            >
              Add to Today's Story
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
