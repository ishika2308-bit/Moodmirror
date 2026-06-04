import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Download, Trash2, SlidersHorizontal } from 'lucide-react';

const SelfView: React.FC<{ onOpenReflection: () => void }> = ({ onOpenReflection }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-6 pt-16 pb-24 h-full overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[var(--c-text)]">Self</h1>
        <div className="w-10 h-10 rounded-full bg-[var(--c-text)]/5 flex items-center justify-center border border-[var(--c-border)]">
          <User size={18} className="text-[var(--c-text)] opacity-80" />
        </div>
      </div>

      <motion.button
        onClick={onOpenReflection}
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.95 }}
        className="mb-10 relative overflow-hidden rounded-[2rem] p-8 surface-glass text-left flex flex-col shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--c-text)] opacity-5 rounded-full blur-2xl -mt-10 -mr-10" />
        <h3 className="font-serif text-2xl text-[var(--c-text)] mb-2 relative z-10">Weekly Reflection</h3>
        <p className="font-sans text-sm font-medium text-[var(--c-subtext)] pr-8 relative z-10 leading-relaxed">A summary of where your mind traveled this week.</p>
        <div className="mt-8 flex justify-end relative z-10">
          <div className="px-4 py-1.5 rounded-full bg-[var(--c-text)]/10 text-[var(--c-text)] text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-[var(--c-border)]">Open</div>
        </div>
      </motion.button>

      <div className="space-y-6">
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] ml-2">Preferences</h2>
        
        <div className="surface-glass rounded-[1.5rem] p-2">
          <button className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors">
            <div className="flex items-center space-x-4">
              <SlidersHorizontal size={18} className="text-[var(--c-text)] opacity-60" />
              <span className="font-sans text-sm font-medium text-[var(--c-text)]">Reflection Settings</span>
            </div>
          </button>
          <div className="h-px bg-[var(--c-border)] mx-4 my-1 opacity-50" />
          <button className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors">
            <div className="flex items-center space-x-4">
              <Shield size={18} className="text-[var(--c-text)] opacity-60" />
              <span className="font-sans text-sm font-medium text-[var(--c-text)]">Privacy Controls</span>
            </div>
          </button>
        </div>

        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] ml-2 mt-8">Data Ownership</h2>
        
        <div className="surface-glass rounded-[1.5rem] p-2">
          <button className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors">
            <div className="flex items-center space-x-4">
              <Download size={18} className="text-[var(--c-text)] opacity-60" />
              <span className="font-sans text-sm font-medium text-[var(--c-text)]">Export My Data</span>
            </div>
          </button>
          <div className="h-px bg-[var(--c-border)] mx-4 my-1 opacity-50" />
          <button className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[#D96677]/10 transition-colors group">
            <div className="flex items-center space-x-4">
              <Trash2 size={18} className="text-[#D96677]/70 group-hover:text-[#D96677]" />
              <span className="font-sans text-sm font-medium text-[#D96677]/90 group-hover:text-[#D96677]">Delete Data</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default SelfView;

