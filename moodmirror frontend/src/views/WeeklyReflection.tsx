import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

const WeeklyReflection: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex flex-col h-full bg-[#fdfdfd] overflow-y-auto"
    >
      <div className="flex justify-between items-center p-6 sticky top-0 bg-gradient-to-b from-[#fdfdfd] via-[#fdfdfd]/90 to-transparent z-10 h-24">
        <Sparkles size={18} className="text-[#8F7868] ml-2" />
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors text-[#593F31]"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 px-8 pb-32 pt-4 max-w-lg mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
        >
          <h2 className="font-sans text-[0.65rem] uppercase font-bold tracking-[0.2em] text-[#8F7868] mb-12 text-center opacity-80 border-b border-[#8F7868]/20 pb-4 max-w-[120px] mx-auto">
            October 12 - 18
          </h2>
          
          <div className="space-y-10 font-serif text-[1.45rem] leading-[1.65] text-[#593F31] tracking-tight">
            <p className="indent-8 font-medium">Dear Anvesh,</p>
            
            <p>
              This week you searched for certainty.
            </p>
            
            <p className="text-[#8F7868]">
              You worried about outcomes. Your entries early in the week carried the heavy rhythm of someone trying to control the uncontrollable.
            </p>
            
            <p>
              Yet every time you wrote about creating something, your language became unexpectedly hopeful.
            </p>
            
            <p className="italic text-[#CB7F5A] font-medium pt-4">
              That is worth noticing.
            </p>
            
            <p className="pt-12 text-sm font-sans uppercase tracking-[0.2em] text-[#8F7868] opacity-60 text-right pr-4">
              — The Mirror
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default WeeklyReflection;
