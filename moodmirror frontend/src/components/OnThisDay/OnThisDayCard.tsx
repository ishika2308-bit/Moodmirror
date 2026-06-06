import React from 'react';
import { motion } from 'motion/react';
import type { OnThisDayMemory } from '../../hooks/useOnThisDay';

interface OnThisDayCardProps {
  memory: OnThisDayMemory;
  onClick: () => void;
}

const getEmotionGradient = (emotion: string) => {
  const map: Record<string, string> = {
    hopeful: 'linear-gradient(135deg, rgba(255,216,155,0.4), rgba(25,84,123,0.4))',
    calm: 'linear-gradient(135deg, rgba(168,230,207,0.4), rgba(61,126,170,0.4))',
    reflective: 'linear-gradient(135deg, rgba(226,176,255,0.4), rgba(159,68,211,0.4))',
    excited: 'linear-gradient(135deg, rgba(255,154,158,0.4), rgba(254,207,239,0.4))',
    stressed: 'linear-gradient(135deg, rgba(255,117,140,0.4), rgba(255,126,179,0.4))',
    neutral: 'linear-gradient(135deg, rgba(224,234,252,0.4), rgba(207,222,243,0.4))'
  };
  return map[emotion?.toLowerCase()] || map.reflective;
};

export const OnThisDayCard: React.FC<OnThisDayCardProps> = ({ memory, onClick }) => {
  const isDeepPast = [3, 5, 10].includes(memory.yearDiff);
  
  const emotion = memory.analysis?.primaryEmotion || 'reflective';
  const gradient = getEmotionGradient(emotion);

  return (
    <motion.div
      layoutId={`on-this-day-${memory.id}`}
      onClick={onClick}
      className="relative w-full max-w-[280px] mx-auto rounded-full overflow-hidden cursor-pointer shadow-lg mb-8"
      style={{ background: gradient }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
      <div className="absolute inset-0 bg-noise opacity-20" />
      
      <div className="relative z-10 py-3 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg opacity-90">🫧</span>
          <span className="font-serif text-sm text-[var(--c-text)] tracking-wide">
            {isDeepPast ? 'Long time ago...' : memory.yearDiff === 1 ? '1 year ago today' : `${memory.yearDiff} years ago today`}
          </span>
        </div>
        
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-white text-[0.6rem] font-bold">→</span>
        </div>
      </div>
    </motion.div>
  );
};
