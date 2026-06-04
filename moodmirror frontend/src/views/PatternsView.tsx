import React, { useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboard } from '../hooks/useDashboard';

function BentoCard({ children, className = '' }: { children: ReactNode, className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Set custom properties for MagicBento hover effect
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`bento-card ${className}`}
    >
      <div className="bento-spotlight" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
function ConstellationNode({ cx, cy, label, size = 1, delay = 0 }: { cx: number, cy: number, label: string, size?: number, delay?: number }) {
  return (
    <motion.g 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 1.5 }}
    >
      <circle cx={cx} cy={cy} r={size * 4} fill="var(--c-text)" />
      <circle cx={cx} cy={cy} r={size * 12} fill="var(--c-text)" opacity={0.1} />
      <text x={cx} y={cy + 20} fill="var(--c-subtext)" fontSize="9" textAnchor="middle" className="font-sans font-medium tracking-wide uppercase">
        {label}
      </text>
    </motion.g>
  );
}

function ConstellationLine({ x1, y1, x2, y2, delay = 0 }: { x1: number, y1: number, x2: number, y2: number, delay?: number }) {
  return (
    <motion.line 
      x1={x1} y1={y1} x2={x2} y2={y2} 
      stroke="var(--c-border)" 
      strokeWidth="1.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay, duration: 2, ease: "easeInOut" }}
    />
  );
}

export default function PatternsView() {
  const { data, isLoading } = useDashboard();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-6 pt-16 pb-24 h-full overflow-y-auto"
    >
      <h1 className="font-serif text-3xl text-[var(--c-text)] mb-8">Patterns</h1>

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
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12"
          >
            {/* Weekly Reflection (Hero 2x2 or spanning on mobile) */}
            {data.latestWeeklyReport && (
              <BentoCard className="md:col-span-2 p-8 flex flex-col justify-center min-h-[220px]">
                <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-4">Weekly Reflection</h2>
                <h3 className="font-serif text-2xl text-[var(--c-text)] leading-snug">"{data.latestWeeklyReport.letter}"</h3>
                {data.latestWeeklyReport.recommendations && data.latestWeeklyReport.recommendations.length > 0 && (
                  <p className="font-sans text-sm text-[var(--c-subtext)] mt-4 max-w-[90%] leading-relaxed">
                    {data.latestWeeklyReport.recommendations[0]}
                  </p>
                )}
              </BentoCard>
            )}

            {/* Emotional Weather */}
            <BentoCard className="p-6 min-h-[200px]">
              <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-4">Weather</h2>
              <div className="flex flex-col h-full justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--c-text)] text-white/90 shadow-sm mix-blend-multiply opacity-80 mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v2"></path><path d="M12 20v2"></path>
                    <path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path>
                    <path d="M2 12h2"></path><path d="M20 12h2"></path>
                    <path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path>
                  </svg>
                </div>
                <h3 className="font-serif text-lg text-[var(--c-text)]">
                  {data.moodProfile && data.moodProfile.consistency > 70 ? 'Clear Skies' : 'Shifting Winds'}
                </h3>
                <p className="font-sans text-xs text-[var(--c-subtext)] mt-1">
                  Consistency score: {data.moodProfile?.consistency || 0}/100
                </p>
              </div>
            </BentoCard>

            {/* MoodDNA */}
            {data.moodProfile && (
              <BentoCard className="p-6 min-h-[200px] flex flex-col">
                <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-4">MoodDNA</h2>
                <div className="flex-1 flex items-center justify-center relative w-full h-full mt-[-20px]">
                  <svg width="100%" height="100%" viewBox="0 0 300 220" className="opacity-90 absolute scale-75">
                    {/* Connections */}
                    <ConstellationLine x1={150} y1={60} x2={80} y2={110} delay={0.5} />
                    <ConstellationLine x1={150} y1={60} x2={220} y2={100} delay={0.7} />
                    <ConstellationLine x1={80} y1={110} x2={120} y2={170} delay={0.9} />
                    <ConstellationLine x1={220} y1={100} x2={180} y2={160} delay={1.1} />
                    <ConstellationLine x1={120} y1={170} x2={180} y2={160} delay={1.3} />
                    <ConstellationLine x1={80} y1={110} x2={220} y2={100} delay={1.5} />

                    {/* Nodes (scaled by out-of-100 scores converted to out-of-2 approx) */}
                    <ConstellationNode cx={150} cy={60} label="Optimism" delay={0.2} size={(data.moodProfile.optimism / 50) || 1} />
                    <ConstellationNode cx={80} cy={110} label="Resilience" delay={0.4} size={(data.moodProfile.resilience / 50) || 1} />
                    <ConstellationNode cx={220} cy={100} label="Consistency" delay={0.6} size={(data.moodProfile.consistency / 50) || 1} />
                    <ConstellationNode cx={120} cy={170} label="Openness" delay={0.8} />
                    <ConstellationNode cx={180} cy={160} label="Critique" delay={1.0} size={0.7} />
                  </svg>
                </div>
              </BentoCard>
            )}

            {/* Triggers (Wide) */}
            {data.moodProfile && data.moodProfile.primaryDrivers && data.moodProfile.primaryDrivers.length > 0 && (
              <BentoCard className="md:col-span-2 p-6 min-h-[160px]">
                <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-2">Primary Drivers</h2>
                <div className="flex flex-wrap gap-2 mt-4">
                  {data.moodProfile.primaryDrivers.map((driver, index) => (
                    <span 
                      key={driver} 
                      className={`px-3 py-1 text-xs font-medium rounded-full ${index === 0 ? 'bg-[var(--c-text)] text-[var(--c-card)] opacity-80' : 'bg-[var(--c-border)] text-[var(--c-text)]'}`}
                    >
                      {driver}
                    </span>
                  ))}
                </div>
              </BentoCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
