import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, TrendingUp, Sparkles, Heart } from 'lucide-react';
import type { Goal } from '../../types';

interface GoalDetailModalProps {
  goal: Goal;
  recentEntries: any[];
  onClose: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, recentEntries, onClose }) => {
  const linkedMemories = useMemo(() => {
    return recentEntries.filter(entry => entry.analysis?.linkedGoalIds?.includes(goal.id))
      .sort((a, b) => {
        const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
        const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : new Date(b.createdAt?.toDate?.() || b.createdAt).getTime();
        return timeA - timeB; // Oldest first for timeline
      });
  }, [goal.id, recentEntries]);

  // Deterministic Insights
  const { firstMemory, mostImportant, mostHopeful, recentMemory, insight } = useMemo(() => {
    if (linkedMemories.length === 0) {
      return { 
        insight: "You've set your intention. Future reflections will automatically connect here."
      };
    }

    const first = linkedMemories[0];
    const recent = linkedMemories[linkedMemories.length - 1];
    
    const mostImportantMem = [...linkedMemories].sort((a, b) => (b.metrics?.importanceScore || 0) - (a.metrics?.importanceScore || 0))[0];
    const mostHopefulMem = [...linkedMemories].sort((a, b) => (b.analysis?.positivity || 0) - (a.analysis?.positivity || 0))[0];

    // Calculate generic trend insight
    let trendInsight = "Your reflections on this goal are becoming more frequent.";
    const avgPositivity = linkedMemories.reduce((acc, mem) => acc + (mem.analysis?.positivity || 0), 0) / linkedMemories.length;
    
    if (avgPositivity > 70) {
      trendInsight = "Reflections connected to this goal are consistently hopeful and positive.";
    } else if (avgPositivity < 40) {
      trendInsight = "This goal often surfaces during times of stress or overwhelm.";
    } else if (linkedMemories.length >= 3) {
      const recentAvg = linkedMemories.slice(-3).reduce((acc, mem) => acc + (mem.analysis?.positivity || 0), 0) / 3;
      const olderAvg = linkedMemories.slice(0, 3).reduce((acc, mem) => acc + (mem.analysis?.positivity || 0), 0) / 3;
      if (recentAvg > olderAvg + 10) {
        trendInsight = "You've been speaking more positively about this goal recently.";
      }
    }

    return {
      firstMemory: first,
      mostImportant: mostImportantMem,
      mostHopeful: mostHopefulMem,
      recentMemory: recent,
      insight: trendInsight
    };
  }, [linkedMemories]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full sm:max-w-md h-[85vh] sm:h-[80vh] surface-glass border border-white/10 sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-emerald-500/20 to-transparent" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }} />
        
        <div className="relative pt-8 pb-6 px-6 border-b border-white/10 flex justify-between items-start shrink-0">
          <div>
            <span className="font-sans text-[0.6rem] uppercase tracking-widest text-emerald-400 opacity-80 mb-2 block font-bold flex items-center gap-1">
              <Sparkles size={10} /> Active Goal
            </span>
            <h2 className="font-serif text-3xl text-[var(--c-text)]">{goal.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-[var(--c-text)] opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <h4 className="font-sans text-[0.65rem] uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
              <TrendingUp size={12} /> Companion Observation
            </h4>
            <p className="font-serif text-lg italic opacity-90 leading-relaxed">
              "{insight}"
            </p>
          </div>

          {linkedMemories.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-sans text-xs uppercase tracking-widest text-[var(--c-text)] opacity-60 pl-2">Growth Moments</h3>
              
              <div className="relative pl-6 space-y-8 border-l border-white/10 ml-2">
                
                {/* First Mention */}
                {firstMemory && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white/20 border-2 border-[var(--bg-color)]" />
                    <div className="text-[0.6rem] uppercase tracking-widest opacity-50 mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(firstMemory.createdAt)} • First Linked
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mt-2">
                      <p className="font-sans text-sm opacity-80 leading-relaxed">"{firstMemory.encryptedJournal?.slice(0, 100)}..."</p>
                    </div>
                  </div>
                )}

                {/* Most Important */}
                {mostImportant && mostImportant.id !== firstMemory?.id && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-400/50 border-2 border-[var(--bg-color)] shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                    <div className="text-[0.6rem] uppercase tracking-widest text-amber-400 opacity-80 mb-1 flex items-center gap-1">
                      <Sparkles size={10} /> {formatDate(mostImportant.createdAt)} • High Impact
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/5 border border-amber-400/20 mt-2">
                      <p className="font-sans text-sm opacity-90 leading-relaxed">"{mostImportant.encryptedJournal?.slice(0, 100)}..."</p>
                    </div>
                  </div>
                )}

                {/* Most Hopeful */}
                {mostHopeful && mostHopeful.id !== firstMemory?.id && mostHopeful.id !== mostImportant?.id && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-rose-400/50 border-2 border-[var(--bg-color)] shadow-[0_0_10px_rgba(251,113,133,0.3)]" />
                    <div className="text-[0.6rem] uppercase tracking-widest text-rose-400 opacity-80 mb-1 flex items-center gap-1">
                      <Heart size={10} /> {formatDate(mostHopeful.createdAt)} • Most Hopeful
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-400/10 to-pink-500/5 border border-rose-400/20 mt-2">
                      <p className="font-sans text-sm opacity-90 leading-relaxed">"{mostHopeful.encryptedJournal?.slice(0, 100)}..."</p>
                    </div>
                  </div>
                )}

                {/* Recent */}
                {recentMemory && recentMemory.id !== firstMemory?.id && recentMemory.id !== mostImportant?.id && recentMemory.id !== mostHopeful?.id && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white/40 border-2 border-[var(--bg-color)]" />
                    <div className="text-[0.6rem] uppercase tracking-widest opacity-50 mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(recentMemory.createdAt)} • Recent Reflection
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mt-2">
                      <p className="font-sans text-sm opacity-80 leading-relaxed">"{recentMemory.encryptedJournal?.slice(0, 100)}..."</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
