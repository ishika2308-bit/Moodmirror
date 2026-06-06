import React from 'react';
import { motion } from 'motion/react';
import type { OnThisDayMemory } from '../../hooks/useOnThisDay';
import { MemoryArtifactGallery } from '../ui/MemoryArtifactGallery';

interface OnThisDayModalProps {
  memory: OnThisDayMemory;
  onClose: () => void;
  companionName: string;
}

const getEmotionGradient = (emotion: string) => {
  const map: Record<string, string> = {
    hopeful: 'linear-gradient(135deg, rgba(255,216,155,0.6), rgba(25,84,123,0.6))',
    calm: 'linear-gradient(135deg, rgba(168,230,207,0.6), rgba(61,126,170,0.6))',
    reflective: 'linear-gradient(135deg, rgba(226,176,255,0.6), rgba(159,68,211,0.6))',
    excited: 'linear-gradient(135deg, rgba(255,154,158,0.6), rgba(254,207,239,0.6))',
    stressed: 'linear-gradient(135deg, rgba(255,117,140,0.6), rgba(255,126,179,0.6))',
    neutral: 'linear-gradient(135deg, rgba(224,234,252,0.6), rgba(207,222,243,0.6))'
  };
  return map[emotion?.toLowerCase()] || map.reflective;
};

export const OnThisDayModal: React.FC<OnThisDayModalProps> = ({ memory, onClose, companionName }) => {
  const emotion = memory.analysis?.primaryEmotion || 'reflective';
  const gradient = getEmotionGradient(emotion);
  const isAnniversary = [1, 3, 5, 10].includes(memory.yearDiff);

  return (
    <motion.div
      layoutId={`on-this-day-${memory.id}`}
      className="absolute inset-0 z-50 p-6 md:rounded-[2.5rem] overflow-y-auto backdrop-blur-[60px]"
      style={{ 
        background: `linear-gradient(to bottom, rgba(15, 15, 26, 0.85), rgba(15, 15, 26, 0.95)), ${gradient}`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        minHeight: '100%'
      }}
    >
      
      <div className="relative z-10 pt-10 pb-28 max-w-sm mx-auto">
        <button
          onClick={onClose}
          className="flex items-center gap-2 mb-10 text-[0.65rem] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-opacity"
        >
          ← Close Memory
        </button>

        <div className="mb-10 text-center">
          {isAnniversary && (
            <span className="inline-block font-sans text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
              A Memory From
            </span>
          )}
          <h2 className="font-serif text-4xl text-white">
            {memory.yearDiff === 1 ? '1 Year Ago' : `${memory.yearDiff} Years Ago`}
          </h2>
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-white/50 mt-2">
            {memory.originalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Then vs Now Orb Evolution */}
        <div className="mb-12 relative flex items-center justify-between px-4">
          <div className="flex flex-col items-center">
            <motion.div 
              className="w-16 h-16 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-3 flex items-center justify-center"
              style={{ background: getEmotionGradient(memory.then[0] || emotion) }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            <span className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-white/70">
              {memory.then[0] || 'Past'}
            </span>
          </div>

          <motion.div 
            className="flex-1 h-[1px] mx-4 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="absolute inset-0 bg-white/20" />
            <motion.div 
              className="absolute inset-y-0 left-0 bg-white shadow-[0_0_10px_white]"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.8, duration: 1.5, ease: 'easeInOut' }}
            />
          </motion.div>

          <div className="flex flex-col items-center">
            <motion.div 
              className="w-16 h-16 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-3 flex items-center justify-center"
              style={{ background: getEmotionGradient(memory.now[0] || 'reflective') }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.0 }}
            />
            <motion.span 
              className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              {memory.now[0] || 'Now'}
            </motion.span>
          </div>
        </div>

        {/* Letter Between Selves */}
        <div className="rounded-[2rem] p-8 mb-8 bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative">
          <div className="absolute -top-3 left-8 px-3 py-1 bg-[#1a1a2e] border border-white/10 rounded-full">
            <span className="font-sans text-[0.55rem] font-bold uppercase tracking-widest text-white/70">
              {companionName} Reflects
            </span>
          </div>
          <p className="font-serif text-lg text-white/90 leading-relaxed italic">
            "{memory.companionReflection}"
          </p>
        </div>

        {/* Original Words */}
        <div className="rounded-[2rem] p-6 mb-8 bg-black/20 border border-white/5 shadow-inner">
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-white/50 mb-3">
            Your Original Words
          </p>
          <p className="font-sans text-[0.95rem] text-white/80 leading-relaxed font-light">
            {memory.text}
          </p>

          {memory.analysis?.attachments && memory.analysis.attachments.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <MemoryArtifactGallery attachments={memory.analysis.attachments} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-10">
          <button
            className="w-full py-4 rounded-full text-[0.7rem] font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            style={{ background: 'white', color: 'black' }}
          >
            View Full Day Story
          </button>
          <button
            className="w-full py-4 rounded-full text-[0.7rem] font-bold uppercase tracking-widest border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            Save As Artifact
          </button>
        </div>

      </div>
    </motion.div>
  );
};
