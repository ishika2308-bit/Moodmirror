import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEmotionalGoals } from '../../hooks/useEmotionalGoals';
import { GoalManagementModal } from './GoalManagementModal';
import { GoalDetailModal } from './GoalDetailModal';
import { Plus, Target, Sparkles, MoveRight } from 'lucide-react';
import type { Goal } from '../../types';

export const EmotionalGoals: React.FC<{ recentEntries?: any[] }> = ({ recentEntries = [] }) => {
  const { activeGoals, loading } = useEmotionalGoals();
  const [showManager, setShowManager] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  if (loading) return null;

  // Calculate generic deterministic observations for the whole goals section
  const totalLinked = activeGoals.reduce((acc, goal) => {
    const linked = recentEntries.filter(entry => entry.analysis?.linkedGoalIds?.includes(goal.id));
    return acc + linked.length;
  }, 0);

  const overallInsight = totalLinked > 5 
    ? "You've been actively reflecting on your emotional goals recently."
    : activeGoals.length > 0 
      ? "Tracking your emotional growth over time."
      : "Set intentions to guide your reflection journey.";

  return (
    <div className="w-full mt-12 mb-8 md:col-span-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-serif text-2xl text-[var(--c-text)] flex items-center gap-2">
          <Target size={20} className="opacity-70" />
          Emotional Goals
        </h3>
        <button 
          onClick={() => setShowManager(true)}
          className="text-[0.7rem] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
        >
          <Plus size={14} /> Add Goal
        </button>
      </div>
      
      <div className="flex items-start gap-3 mb-8 px-1">
        <Sparkles size={16} className="text-emerald-400 opacity-80 mt-1 shrink-0" />
        <p className="font-sans text-xs text-[var(--c-subtext)] opacity-80 leading-relaxed italic">
          "{overallInsight}"
        </p>
      </div>

      {activeGoals.length === 0 ? (
        <div 
          onClick={() => setShowManager(true)}
          className="w-full p-8 rounded-3xl border-2 border-dashed border-white/10 surface-glass flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="opacity-50" />
          </div>
          <p className="font-serif text-lg opacity-80 mb-2">Set an Intention</p>
          <p className="font-sans text-xs opacity-50 max-w-[200px] leading-relaxed">
            Create emotional goals to guide your reflections and track your personal growth.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeGoals.map((goal, index) => {
            const linkedMemories = recentEntries.filter(e => e.analysis?.linkedGoalIds?.includes(goal.id));
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedGoal(goal)}
                className="p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden group"
              >
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Target size={120} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="font-serif text-xl pr-4">{goal.title}</h4>
                    <span className="shrink-0 text-[0.6rem] uppercase tracking-widest opacity-50 bg-black/20 px-2 py-1 rounded-full">
                      {linkedMemories.length} Moments
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[0.65rem] uppercase tracking-wider opacity-50">
                      {linkedMemories.length > 0 ? 'Active' : 'Just Started'}
                    </span>
                    <MoveRight size={16} className="opacity-30 group-hover:opacity-80 transition-opacity group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showManager && <GoalManagementModal onClose={() => setShowManager(false)} />}
        {selectedGoal && <GoalDetailModal goal={selectedGoal} recentEntries={recentEntries} onClose={() => setSelectedGoal(null)} />}
      </AnimatePresence>
    </div>
  );
};
