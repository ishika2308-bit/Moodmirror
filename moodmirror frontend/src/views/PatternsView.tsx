import React, { useRef, ReactNode, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useDashboard } from '../hooks/useDashboard';
import { RelationshipReflection } from '../components/Patterns/RelationshipReflection';
import { EmotionalGoals } from '../components/Patterns/EmotionalGoals';
import EmotionalWeather from '../components/Patterns/EmotionalWeather';
import MoodDNA from '../components/Patterns/MoodDNA';
import MoodSnapshotGenerator from '../components/Patterns/MoodSnapshotGenerator';
import { MoodBoard } from '../components/Patterns/MoodBoard';
import { YearbookExperience } from '../components/Yearbook/YearbookExperience';
import { Camera, Sparkles, Flame } from 'lucide-react';

// ── Daily Streak Calculator ──
function calculateStreak(entries: any[]): number {
  if (!entries || entries.length === 0) return 0;
  
  // Sort entries by date descending
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Map to distinct local dates (YYYY-MM-DD)
  const days = Array.from(new Set(sorted.map(e => new Date(e.date).toLocaleDateString('en-CA'))));
  
  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  
  if (days[0] !== today && days[0] !== yesterday) {
    return 0; // Streak broken
  }
  
  let streak = 1;
  let currentDate = new Date(days[0]);
  
  for (let i = 1; i < days.length; i++) {
    const prevDate = new Date(days[i]);
    const diff = (currentDate.getTime() - prevDate.getTime()) / 86400000;
    
    // Allow for timezone fuzziness across day boundaries (difference should be roughly 1 day)
    if (Math.round(diff) === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
}

// ── Animated Daily Streak Card ──
function AnimatedStreakCard({ entries }: { entries: any[] }) {
  const streak = calculateStreak(entries);
  
  return (
    <BentoCard className="md:col-span-2 p-0 flex flex-col justify-center min-h-[140px] cursor-pointer hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden group border border-white/5 shadow-2xl">
      {/* Animated Deep Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b05] via-[#2a110a] to-[#0a0503] opacity-90" />
      
      {/* Moving Light Rays */}
      <motion.div 
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 120, 50, 0.4) 0%, transparent 60%)',
          backgroundSize: '200% 200%'
        }}
      />
      
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-black/20 z-0" />

      <div className="flex items-center gap-6 relative z-10 p-6 px-8">
        
        {/* Glowing Flame Orb */}
        <div className="relative flex items-center justify-center">
          {/* Outer diffuse glow */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-24 h-24 rounded-full bg-orange-600/30 blur-2xl"
          />
          
          {/* Progress Ring */}
          <svg className="absolute w-20 h-20 transform -rotate-90">
            <circle cx="40" cy="40" r="38" stroke="rgba(255,160,100,0.1)" strokeWidth="2" fill="none" />
            <motion.circle 
              cx="40" cy="40" r="38" 
              stroke="url(#orange-grad)" 
              strokeWidth="2" 
              fill="none"
              strokeDasharray="238"
              initial={{ strokeDashoffset: 238 }}
              animate={{ strokeDashoffset: Math.max(0, 238 - (streak * 10)) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7b00" />
                <stop offset="100%" stopColor="#ffea00" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner Flame Container */}
          <motion.div 
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400/20 to-red-600/20 shadow-inner border border-orange-500/40 backdrop-blur-md"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame size={28} className="text-orange-400 drop-shadow-[0_0_10px_rgba(255,120,0,0.8)]" fill="currentColor" />
            </motion.div>
          </motion.div>
        </div>

        {/* Typography & Stats */}
        <div className="flex flex-col">
          <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-orange-300 mb-1 flex items-center gap-2">
            <Sparkles size={10} className="text-orange-400" /> Daily Streak
          </h2>
          <div className="flex items-baseline gap-2 mt-1">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              className="font-serif text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-200 via-white to-orange-100"
            >
              {streak}
            </motion.span>
            <span className="font-sans text-sm tracking-wide text-orange-200/60 uppercase">Days</span>
          </div>
          <p className="font-sans text-xs text-orange-100/50 mt-1 font-light tracking-wide">
            {streak === 0 ? "The beginning of a new journey." : streak < 3 ? "Building momentum." : "You're unstoppable."}
          </p>
        </div>

        {/* Ambient background particles */}
        <div className="absolute right-0 top-0 bottom-0 w-32 overflow-hidden pointer-events-none opacity-30 mask-image:linear-gradient(to_left,black,transparent)">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-orange-400 rounded-full"
              initial={{ 
                x: 100 + Math.random() * 50, 
                y: Math.random() * 100,
                opacity: 0 
              }}
              animate={{ 
                x: -50,
                y: Math.random() * 100,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </div>
    </BentoCard>
  );
}

// ── MagicBento spotlight (adapted to blend with existing theme) ──
const SPOTLIGHT_RADIUS = 350;

function useSpotlight(containerRef: React.RefObject<HTMLDivElement | null>) {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spotlight = document.createElement('div');
    spotlight.style.cssText = `
      position: fixed;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        var(--bento-spotlight) 0%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !container) return;
      const rect = container.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (!inside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });

        container.querySelectorAll<HTMLElement>('.bento-card').forEach(card => {
          card.style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.08, ease: 'power2.out' });

      let minDist = Infinity;
      container.querySelectorAll<HTMLElement>('.bento-card').forEach(card => {
        const cr = card.getBoundingClientRect();
        const cx = cr.left + cr.width / 2;
        const cy = cr.top + cr.height / 2;
        const dist = Math.max(0, Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(cr.width, cr.height) / 2);
        minDist = Math.min(minDist, dist);

        const relX = ((e.clientX - cr.left) / cr.width) * 100;
        const relY = ((e.clientY - cr.top) / cr.height) * 100;
        const glow = dist <= SPOTLIGHT_RADIUS * 0.5 ? 1 : dist <= SPOTLIGHT_RADIUS * 0.75 ? (SPOTLIGHT_RADIUS * 0.75 - dist) / (SPOTLIGHT_RADIUS * 0.25) : 0;
        card.style.setProperty('--glow-x', `${relX}%`);
        card.style.setProperty('--glow-y', `${relY}%`);
        card.style.setProperty('--glow-intensity', glow.toString());
      });

      const opacity = minDist <= SPOTLIGHT_RADIUS * 0.5 ? 0.8 : minDist <= SPOTLIGHT_RADIUS * 0.75 ? ((SPOTLIGHT_RADIUS * 0.75 - minDist) / (SPOTLIGHT_RADIUS * 0.25)) * 0.8 : 0;
      gsap.to(spotlightRef.current, { opacity, duration: opacity > 0 ? 0.15 : 0.4, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [containerRef]);
}

// ── Enhanced BentoCard with border glow + tilt ──
function BentoCard({ children, className = '', onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    // Subtle tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    gsap.to(cardRef.current, { rotateX, rotateY, duration: 0.15, ease: 'power2.out', transformPerspective: 1000 });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`bento-card patterns-bento-card ${className}`}
      style={{ '--glow-x': '50%', '--glow-y': '50%', '--glow-intensity': '0', ...style } as React.CSSProperties}
    >
      {/* MagicBento border glow pseudo (handled via CSS) */}
      <div className="bento-spotlight" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

// ── Helpers for Calendar ──
function getPastDays(days: number) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function getMoodColor(score: number | undefined) {
  if (score === undefined) return 'var(--c-border)';
  if (score < 40) return '#D96677';
  if (score < 60) return '#A8B2C1';
  if (score < 80) return '#7BA8A8';
  return '#E6C280';
}

function getMoodIntensity(score: number | undefined) {
  if (score === undefined) return 0.2;
  return 0.4 + (score / 100) * 0.6;
}

// ── Mood Calendar ──
function MoodCalendar({ entries }: { entries: any[] }) {
  const [selectedEntry, setSelectedEntry] = React.useState<any>(null);
  const days = getPastDays(35);

  const entryMap = new Map();
  entries.forEach(e => {
    const dateKey = e.date.split('T')[0];
    if (!entryMap.has(dateKey) || entryMap.get(dateKey).analysis?.moodScore < e.analysis?.moodScore) {
      entryMap.set(dateKey, e);
    }
  });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <BentoCard className="md:col-span-2 p-6 mb-2">
      <div className="flex justify-between items-end mb-5">
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)]">Mood Calendar</h2>
        <span className="font-sans text-[0.6rem] uppercase tracking-wider text-[var(--c-subtext)] opacity-60">Last 35 days</span>
      </div>

      {/* Week day labels */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 justify-items-center">
        {weekDays.map((d, i) => (
          <span key={i} className="text-[0.55rem] uppercase tracking-wider text-[var(--c-subtext)] opacity-40 font-semibold">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 justify-items-center mb-4">
        {days.map(dateKey => {
          const entry = entryMap.get(dateKey);
          const score = entry?.analysis?.moodScore;
          return (
            <motion.button
              key={dateKey}
              onClick={() => entry && setSelectedEntry(entry)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              className="w-5 h-5 md:w-7 md:h-7 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--c-text)] focus:ring-offset-1 shadow-sm"
              style={{
                backgroundColor: getMoodColor(score),
                opacity: getMoodIntensity(score),
                boxShadow: score !== undefined ? `0 2px 8px ${getMoodColor(score)}40` : 'none'
              }}
              title={entry ? `${dateKey}: ${entry.analysis.primaryEmotion}` : dateKey}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-2">
        {[
          { color: '#D96677', label: 'Stressed' },
          { color: '#A8B2C1', label: 'Reflective' },
          { color: '#7BA8A8', label: 'Calm' },
          { color: '#E6C280', label: 'Hopeful' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-[0.5rem] uppercase tracking-wider text-[var(--c-subtext)] opacity-60 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-[var(--c-border)]">
              <div className="flex justify-between items-start mb-2">
                <span className="font-serif text-lg text-[var(--c-text)]">
                  {new Date(selectedEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[var(--c-border)] text-[var(--c-text)]">
                  {selectedEntry.analysis?.primaryEmotion || 'Reflective'}
                </span>
              </div>
              <p className="font-serif italic text-sm text-[var(--c-text)] opacity-80 leading-relaxed">
                "{selectedEntry.analysis?.summary || 'No summary available.'}"
              </p>
              <button
                onClick={() => setSelectedEntry(null)}
                className="mt-3 text-[0.6rem] uppercase tracking-widest text-[var(--c-subtext)] opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BentoCard>
  );
}

// ── Floating Particle Effect ──
function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const particles: HTMLDivElement[] = [];
    const container = containerRef.current;

    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: absolute;
        width: ${3 + Math.random() * 4}px;
        height: ${3 + Math.random() * 4}px;
        border-radius: 50%;
        background: var(--theme-color);
        opacity: 0;
        pointer-events: none;
      `;
      container.appendChild(p);
      particles.push(p);

      gsap.set(p, {
        x: Math.random() * container.offsetWidth,
        y: Math.random() * container.offsetHeight,
      });

      gsap.to(p, {
        opacity: 0.3 + Math.random() * 0.3,
        duration: 1 + Math.random(),
        delay: i * 0.2,
        ease: 'power2.out',
      });

      gsap.to(p, {
        x: `+=${(Math.random() - 0.5) * 80}`,
        y: `+=${(Math.random() - 0.5) * 80}`,
        duration: 4 + Math.random() * 4,
        ease: 'none',
        repeat: -1,
        yoyo: true,
      });

      gsap.to(p, {
        opacity: 0.15,
        duration: 2 + Math.random() * 2,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
      });
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />;
}

export default function PatternsView() {
  const { data, isLoading } = useDashboard();
  const gridRef = useRef<HTMLDivElement>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showYearbook, setShowYearbook] = useState(false);
  useSpotlight(gridRef);
  
  // Calculate Account Age (days since first entry)
  let accountAgeInDays = 0;
  if (data?.recentEntries && data.recentEntries.length > 0) {
    const sorted = [...data.recentEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstEntryDate = new Date(sorted[0].date);
    accountAgeInDays = Math.floor((Date.now() - firstEntryDate.getTime()) / 86400000);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-6 pt-16 pb-32 h-full overflow-y-auto"
    >
      <div className="flex items-end justify-between mb-8">
        <h1 className="font-serif text-3xl text-[var(--c-text)]">Patterns</h1>
        <span className="text-[0.55rem] uppercase tracking-widest text-[var(--c-subtext)] opacity-50 font-bold">Emotional Intelligence</span>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center min-h-[400px]"
          >
            <p className="font-serif text-[var(--c-text)] italic opacity-50 animate-pulse">Analyzing patterns...</p>
          </motion.div>
        ) : !data || (!data.moodProfile && !data.latestWeeklyReport) ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center min-h-[400px]"
          >
            <p className="font-sans text-sm text-[var(--c-subtext)] opacity-70">Not enough data to analyze patterns yet. Keep journaling!</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12 w-full bento-section"
          >
            {/* Animated Daily Streak */}
            {data.recentEntries && (
              <AnimatedStreakCard entries={data.recentEntries} />
            )}

            {/* Mood Calendar – Hero Feature */}
            {data.recentEntries && data.recentEntries.length > 0 && (
              <MoodCalendar entries={data.recentEntries} />
            )}

            {/* Mood Snapshot Entry Point */}
            <BentoCard 
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const hasEntryToday = data.recentEntries?.some((e: any) => e.date.startsWith(today));
                if (hasEntryToday) {
                  setShowSnapshotModal(true);
                } else {
                  alert("Nothing to reflect yet. Start a reflection or journal entry today first.");
                }
              }}
              className="md:col-span-2 p-6 flex flex-col justify-center min-h-[140px] cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(29, 185, 84, 0.05) 100%)',
                borderColor: 'rgba(29, 185, 84, 0.2)'
              }}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                  <Camera size={24} />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-[var(--c-text)] mb-1">✨ Mood Snapshot</h2>
                  <p className="font-sans text-sm text-[var(--c-subtext)] opacity-80">
                    Generate a personalized, shareable emotional card for today.
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* Weekly Reflection */}
            {data.latestWeeklyReport && accountAgeInDays >= 7 && (
              <BentoCard className="md:col-span-2 p-8 flex flex-col justify-center min-h-[220px] cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative">
                  <FloatingParticles />
                  <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-4 relative z-10">Weekly Reflection</h2>
                  <h3 className="font-serif text-2xl text-[var(--c-text)] leading-snug relative z-10">"{data.latestWeeklyReport.letter}"</h3>
                  {data.latestWeeklyReport.recommendations && data.latestWeeklyReport.recommendations.length > 0 && (
                    <p className="font-sans text-sm text-[var(--c-subtext)] mt-4 max-w-[90%] leading-relaxed relative z-10">
                      {data.latestWeeklyReport.recommendations[0]}
                    </p>
                  )}
                </div>
              </BentoCard>
            )}

            {/* Emotional Weather */}
            <div className="min-h-[200px]">
              <EmotionalWeather data={data} />
            </div>

            {/* MoodDNA */}
            {data.moodProfile && (
              <div className="min-h-[200px]">
                <MoodDNA data={data} />
              </div>
            )}
            
            {/* Relationship Reflection */}
            <RelationshipReflection memoryProfile={data.memoryProfile} recentEntries={data.recentEntries} />

            {/* Emotional Goals */}
            <EmotionalGoals recentEntries={data.recentEntries} />

            {/* Mood Board */}
            <BentoCard className="md:col-span-2 p-6 min-h-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)]">Mood Board</h2>
              </div>
              <div className="flex-1 min-h-0 relative">
                <MoodBoard />
              </div>
            </BentoCard>

            {/* Primary Drivers */}
            {data.moodProfile && data.moodProfile.primaryDrivers && data.moodProfile.primaryDrivers.length > 0 && (
              <BentoCard className="md:col-span-2 p-6 min-h-[160px] cursor-pointer">
                <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-2">Primary Drivers</h2>
                <p className="font-sans text-xs text-[var(--c-subtext)] opacity-70 mb-4">These themes appear most often in your story.</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.moodProfile.primaryDrivers.map((driver: string, index: number) => (
                    <span
                      key={driver}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm"
                      style={{
                        background: index === 0 ? 'linear-gradient(135deg, var(--theme-color), var(--theme-color-light))' : 'var(--c-border)',
                        color: index === 0 ? 'white' : 'var(--c-text)',
                      }}
                    >
                      {driver}
                    </span>
                  ))}
                </div>
              </BentoCard>
            )}

            {/* Yearbook Experience Launcher */}
            {accountAgeInDays >= 180 && (
              <BentoCard 
                onClick={() => setShowYearbook(true)}
                className="md:col-span-2 p-6 min-h-[120px] cursor-pointer flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <h2 className="font-serif text-2xl mb-2 flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={20} />
                  2026 Yearbook
                </h2>
                <p className="font-sans text-xs uppercase tracking-widest opacity-60">Relive Your Year in Review</p>
              </BentoCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSnapshotModal && (
          <MoodSnapshotGenerator 
            onClose={() => setShowSnapshotModal(false)}
            latestEntry={data?.recentEntries?.[0]} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showYearbook && (
          <YearbookExperience onClose={() => setShowYearbook(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
