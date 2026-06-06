import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { MemoryProfileData, MemoryArtifact } from '../../hooks/useDashboard';

interface RelationshipDetailModalProps {
  personName: string;
  memoryProfile: MemoryProfileData;
  recentEntries?: any[];
  onClose: () => void;
}

export const RelationshipDetailModal: React.FC<RelationshipDetailModalProps> = ({ 
  personName, 
  memoryProfile,
  recentEntries,
  onClose 
}) => {
  const { currentUser } = useAuth();
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const personData = memoryProfile.people?.[personName] || {};

  useEffect(() => {
    // Scroll to top when opened
    modalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const fetchMemories = async () => {
      if (!currentUser) return;
      try {
        let personMemories = [];

        // Check if we can build it client-side first
        if (recentEntries && recentEntries.length > 0) {
          const nameRegex = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b/g;
          const commonStopwords = new Set([
            "I", "Today", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
            "The", "A", "An", "My", "He", "She", "They", "It", "We", "You", "This", "That", "But", "If", "And", "In", "On", "At", "To",
            "Firebase", "React", "Google", "Apple", "Amazon", "Microsoft", "Javascript", "Typescript", "Node", "App", "Website",
            "Yesterday", "Tomorrow", "Morning", "Afternoon", "Evening", "Night", "So", "Then", "Because", "When", "While", "Where",
            "There", "Here", "Why", "How", "What", "Who"
          ]);

          personMemories = recentEntries
            .filter(entry => {
              const text = entry.text || "";
              const matches = text.match(nameRegex) || [];
              const people = new Set<string>();
              for (const match of matches) {
                if (!commonStopwords.has(match)) people.add(match);
              }
              return people.has(personName);
            })
            .map(entry => {
              const hasPhotos = entry.analysis?.attachments && entry.analysis.attachments.length > 0;
              const moodScore = entry.analysis?.moodScore ?? 50;
              const emotionIntensity = Math.abs(50 - moodScore) / 50;
              const lengthScore = Math.min(30, ((entry.text || "").length / 600) * 30);
              const importanceScore = Math.round(lengthScore + emotionIntensity * 30) + (hasPhotos ? 25 : 0);
              return {
                id: entry.id,
                entryId: entry.id,
                metrics: { importanceScore, emotionIntensity, hasPhotos, savedToStory: false },
                createdAt: {
                  toDate: () => new Date(entry.date),
                  toMillis: () => new Date(entry.date).getTime()
                }
              };
            });
        }

        // If client-side parsing didn't find any, try database as fallback
        if (personMemories.length === 0) {
          const graphRef = collection(db, 'users', currentUser.uid, 'memory_graph');
          const q = query(graphRef, orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          
          const allMemories = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          personMemories = allMemories.filter(m => 
            m.connections?.people?.includes(personName)
          );
        }
        
        setMemories(personMemories);
      } catch (err) {
        console.error("Failed to fetch memories for person", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [currentUser, personName, recentEntries]);

  // Derived sections
  const mostImportantMemory = memories.length > 0 
    ? [...memories].sort((a, b) => (b.metrics?.importanceScore || 0) - (a.metrics?.importanceScore || 0))[0]
    : null;

  const evolutionTimeline = memories.length > 0 
    ? [...memories].sort((a, b) => {
        const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
        const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : new Date(b.createdAt?.toDate?.() || b.createdAt).getTime();
        return timeA - timeB;
      }) // oldest first
    : [];

  const firstMention = evolutionTimeline[0];
  const mostRecentMention = evolutionTimeline[evolutionTimeline.length - 1];

  // Get milestone artifacts for this person (simulated from profile for now, or if we had memoryArtifacts passed down)
  const isMilestoneReached = personData.mentionCount >= 5;

  const getEmotionGradient = (person: any) => {
    const emotions = Object.entries(person.commonEmotions || {}).sort((a: any, b: any) => b[1] - a[1]);
    const topEmotion = emotions.length > 0 ? (emotions[0][0] as string).toLowerCase() : '';
    
    switch (topEmotion) {
      case 'hopeful':
      case 'happy':
      case 'joyful':
      case 'optimistic':
      case 'excited':
        return 'from-yellow-400 to-orange-500'; 
      case 'calm':
      case 'peaceful':
      case 'relaxed':
      case 'content':
        return 'from-teal-400 to-emerald-500'; 
      case 'reflective':
      case 'nostalgic':
      case 'thoughtful':
        return 'from-blue-400 to-indigo-500'; 
      case 'stressed':
      case 'anxious':
      case 'overwhelmed':
      case 'frustrated':
      case 'sad':
        return 'from-rose-400 to-purple-500'; 
      default:
        return 'from-white/20 to-white/10'; 
    }
  };

  const gradientClass = getEmotionGradient(personData);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6" ref={modalRef}>
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
        {/* Header Background */}
        <div 
          className={`absolute top-0 left-0 w-full h-56 bg-gradient-to-b ${gradientClass} opacity-25`} 
          style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}
        />
        
        {/* Header */}
        <div className="relative pt-8 pb-6 px-6 border-b border-white/10 flex justify-between items-start shrink-0">
          <div>
            <span className="font-sans text-[0.6rem] uppercase tracking-widest text-[var(--c-text)] opacity-70 mb-2 block">
              Relationship Profile
            </span>
            <h2 className="font-serif text-3xl text-[var(--c-text)]">{personName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-[var(--c-text)] opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          {/* Top Stats & Tags */}
          <div className="flex flex-wrap gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-wider opacity-60 mb-1">Mentions</span>
              <span className="font-serif text-2xl">{personData.mentionCount}</span>
            </div>
            
            {personData.relationshipImportance > 0 && (
              <div className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col">
                <span className="text-[0.65rem] uppercase tracking-wider opacity-60 mb-1">Bond Score</span>
                <span className="font-serif text-2xl">{personData.relationshipImportance}</span>
              </div>
            )}
            
            {isMilestoneReached && (
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 flex flex-col justify-center items-center">
                <span className="text-xs">🏆 Bond Milestone</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center opacity-50 text-sm">Gathering memories...</div>
          ) : (
            <>
              {/* Most Important Memory */}
              {mostImportantMemory && (
                <div className="space-y-4">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-[var(--c-text)] opacity-60">Most Important Memory</h3>
                  <div className="p-6 rounded-3xl surface-glass border border-white/10 relative overflow-hidden shadow-lg">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-20`} />
                    <div className="relative z-10">
                      <p className="font-serif text-lg leading-relaxed text-[var(--c-text)] italic mb-4">
                        "Reflected on {personName} in a high-impact moment."
                      </p>
                      <div className="flex justify-between items-center text-[0.65rem] uppercase tracking-widest opacity-60">
                        <span>{new Date(mostImportantMemory.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                        <span>Score: {mostImportantMemory.metrics?.importanceScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Evolution Timeline */}
              {evolutionTimeline.length > 1 && (
                <div className="space-y-6">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-[var(--c-text)] opacity-60">Relationship Evolution</h3>
                  
                  <div className="relative pl-6 space-y-6 border-l border-white/10 ml-2">
                    {/* First Mention */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white/20 border-2 border-[var(--bg-color)]" />
                      <div className="text-[0.6rem] uppercase tracking-widest opacity-50 mb-1">
                        First Mention • {new Date(firstMention.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                      </div>
                      <p className="font-serif text-sm opacity-90">
                        The beginning of {personName}'s presence in your journal.
                      </p>
                    </div>
                    
                    {/* Recent Mention */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-gradient-to-r ${gradientClass} border-2 border-[var(--bg-color)]`} />
                      <div className="text-[0.6rem] uppercase tracking-widest opacity-50 mb-1">
                        Recent Mention • {new Date(mostRecentMention.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                      </div>
                      <p className="font-serif text-sm opacity-90">
                        Your latest reflection connecting with {personName}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
