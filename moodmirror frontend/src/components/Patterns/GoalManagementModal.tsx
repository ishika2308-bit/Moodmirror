import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEmotionalGoals } from '../../hooks/useEmotionalGoals';
import { Plus, X, Sparkles } from 'lucide-react';

const GOAL_PRESETS = [
  "Be Kinder To Myself",
  "Reduce Overthinking",
  "Trust Myself More",
  "Protect My Mornings",
  "Make Time For Creativity",
  "Create Healthier Boundaries",
  "Practice Gratitude",
  "Be More Present"
];

interface GoalManagementModalProps {
  onClose: () => void;
}

export const GoalManagementModal: React.FC<GoalManagementModalProps> = ({ onClose }) => {
  const { addGoal } = useEmotionalGoals();
  const [customGoal, setCustomGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = async (preset: string) => {
    setIsSubmitting(true);
    try {
      await addGoal(preset);
      onClose();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    setIsSubmitting(true);
    try {
      await addGoal(customGoal.trim());
      onClose();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ y: '20%', opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: '20%', opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md surface-glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div>
            <span className="font-sans text-[0.6rem] uppercase tracking-widest text-[var(--c-subtext)] opacity-70 mb-1 block">
              Set Intention
            </span>
            <h2 className="font-serif text-2xl text-[var(--c-text)]">New Emotional Goal</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[var(--c-text)] opacity-70 hover:opacity-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-hide space-y-8">
          
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <label className="font-sans text-xs uppercase tracking-widest text-[var(--c-text)] opacity-60">
              Set a Personal Goal
            </label>
            <div className="relative">
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g. Forgive myself faster..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-sans text-sm text-[var(--c-text)] placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button 
                type="submit"
                disabled={!customGoal.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[var(--c-text)] text-[var(--bg-color)] flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 opacity-80" />
              <label className="font-sans text-xs uppercase tracking-widest text-[var(--c-text)] opacity-60">
                Suggestions
              </label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-sans text-[var(--c-text)] opacity-90 text-left disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
