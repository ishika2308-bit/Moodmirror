import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { MemoryProfileData } from '../../hooks/useDashboard';
import { RelationshipDetailModal } from './RelationshipDetailModal';

export const RelationshipReflection: React.FC<{ memoryProfile?: MemoryProfileData; recentEntries?: any[] }> = ({ memoryProfile, recentEntries }) => {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  if (!memoryProfile || !memoryProfile.people || Object.keys(memoryProfile.people).length === 0) {
    return null; // Don't render if no relationship data exists yet
  }

  // Convert people object to array and sort by mention count
  const peopleArr = Object.values(memoryProfile.people)
    .sort((a: any, b: any) => b.mentionCount - a.mentionCount)
    .slice(0, 10); // Show top 10

  if (peopleArr.length === 0) return null;

  // Companion Insight Generator (Deterministic)
  const generateInsight = (person: any) => {
    if (person.mentionCount > 5 && person.averageMood >= 70) {
      return `Conversations mentioning ${person.name} frequently appear during hopeful and joyful periods.`;
    } else if (person.mentionCount > 5 && person.averageMood < 40) {
      return `You often reflect on ${person.name} during times of stress or overwhelm.`;
    } else if (person.mentionCount <= 2) {
      return `A recent presence in your reflections.`;
    }
    
    // Fallback: use the most common emotion
    const emotions = Object.entries(person.commonEmotions || {}).sort((a: any, b: any) => b[1] - a[1]);
    if (emotions.length > 0) {
      const topEmotion = emotions[0][0];
      return `Often associated with feelings of ${topEmotion.toLowerCase()}.`;
    }
    return `A recurring presence in your story.`;
  };

  // Helper to determine gradient based on dominant emotion
  const getEmotionGradient = (person: any) => {
    const emotions = Object.entries(person.commonEmotions || {}).sort((a: any, b: any) => b[1] - a[1]);
    const topEmotion = emotions.length > 0 ? (emotions[0][0] as string).toLowerCase() : '';
    
    switch (topEmotion) {
      case 'hopeful':
      case 'happy':
      case 'joyful':
      case 'optimistic':
      case 'excited':
        return 'from-yellow-400/20 to-orange-500/20'; // Warm, sunny
      case 'calm':
      case 'peaceful':
      case 'relaxed':
      case 'content':
        return 'from-teal-400/20 to-emerald-500/20'; // Serene green/teal
      case 'reflective':
      case 'nostalgic':
      case 'thoughtful':
        return 'from-blue-400/20 to-indigo-500/20'; // Deep blue
      case 'stressed':
      case 'anxious':
      case 'overwhelmed':
      case 'frustrated':
      case 'sad':
        return 'from-rose-400/20 to-purple-500/20'; // Tense, moody
      default:
        return 'from-white/10 to-white/5'; // Neutral
    }
  };

  // Helper for relative time
  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Sometime in the past';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Mentioned today';
    if (diffDays === 1) return 'Mentioned yesterday';
    if (diffDays < 7) return `Mentioned ${diffDays} days ago`;
    if (diffDays < 30) return `Mentioned ${Math.floor(diffDays / 7)} weeks ago`;
    return `Mentioned ${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="w-full mt-10 mb-8 md:col-span-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-serif text-2xl text-[var(--c-text)]">People in Your Story</h3>
      </div>
      
      <p className="font-sans text-xs text-[var(--c-subtext)] mb-6 px-1 opacity-80 leading-relaxed">
        The individuals who shape your reflections and emotional journey.
      </p>

      {/* Horizontal Scrollable List */}
      <div className="flex overflow-x-auto pb-6 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide space-x-4">
        {peopleArr.map((person: any, index: number) => (
          <motion.div
            key={person.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
            onClick={() => setSelectedPerson(person.name)}
            className={`min-w-[280px] max-w-[280px] snap-center shrink-0 rounded-3xl p-5 cursor-pointer surface-glass border border-white/10 relative overflow-hidden group`}
          >
            {/* Background Gradient based on emotion */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getEmotionGradient(person)} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-serif text-xl text-[var(--c-text)]">{person.name}</h4>
                <div className="flex flex-col items-end">
                  <span className="font-sans text-[0.6rem] uppercase tracking-wider text-[var(--c-text)] opacity-60 font-medium">
                    {person.mentionCount} Mentions
                  </span>
                </div>
              </div>
              
              <p className="font-sans text-xs text-[var(--c-text)] opacity-80 leading-relaxed flex-grow italic mb-4">
                "{generateInsight(person)}"
              </p>
              
              <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="font-sans text-[0.6rem] uppercase tracking-widest text-[var(--c-subtext)] opacity-60">
                  {getRelativeTime(person.lastMentioned)}
                </span>
                <span className="font-sans text-[0.6rem] font-bold text-[var(--c-text)] opacity-50 group-hover:opacity-100 transition-opacity">
                  VIEW →
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedPerson && (
        <RelationshipDetailModal 
          personName={selectedPerson} 
          memoryProfile={memoryProfile}
          recentEntries={recentEntries}
          onClose={() => setSelectedPerson(null)} 
        />
      )}
    </div>
  );
};
