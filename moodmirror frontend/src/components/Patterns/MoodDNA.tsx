import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';

interface MoodDNAProps {
  data: any;
}

export default function MoodDNA({ data }: MoodDNAProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ambient rotation
  useEffect(() => {
    if (!orbRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(orbRef.current, {
        rotationY: 360,
        rotationX: 10,
        duration: 20,
        repeat: -1,
        ease: 'none'
      });
    }, orbRef);
    return () => ctx.revert();
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!orbRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.1;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.1;
    
    gsap.to(orbRef.current, {
      x,
      y,
      rotationX: -y,
      rotationY: x,
      duration: 1,
      ease: 'power2.out'
    });
  };

  const handlePointerLeave = () => {
    if (!orbRef.current) return;
    gsap.to(orbRef.current, {
      x: 0,
      y: 0,
      rotationX: 0,
      duration: 1.5,
      ease: 'power2.out'
    });
  };

  const profile = data?.moodProfile || {
    resilience: 70, optimism: 60, consistency: 75, depth: 80
  };

  return (
    <motion.div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={() => setIsExpanded(true)}
      className="p-6 rounded-[2rem] cursor-pointer relative overflow-hidden h-full flex flex-col justify-between"
      style={{
        background: 'var(--c-card)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}
    >
      {/* 3D Orb Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 overflow-hidden">
        <div 
          ref={orbRef}
          className="w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, var(--theme-color-light), var(--theme-color) 40%, transparent 80%)',
            filter: 'blur(8px)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Fractal/DNA rings inside orb */}
          {[1,2,3].map(i => (
            <div key={i} className="absolute inset-0 rounded-full border border-white/20" 
                 style={{ transform: `rotateX(${i*45}deg) rotateY(${i*30}deg) scale(${1 - i*0.1})` }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-6">
          MoodDNA
        </h2>
        
        <div className="mt-auto space-y-3">
          <p className="font-sans text-sm text-[var(--c-text)] leading-relaxed line-clamp-2">
            <span className="font-semibold opacity-60 mr-2">Recovery</span>
            {profile.resilience > 60 ? 'You bounce back quickly after stressful days.' : 'You need more time to recover after intense stress.'}
          </p>
          <p className="font-sans text-sm text-[var(--c-text)] leading-relaxed line-clamp-2">
            <span className="font-semibold opacity-60 mr-2">Outlook</span>
            {profile.optimism > 60 ? 'You naturally lean towards hopeful perspectives.' : 'You tend to view situations with cautious realism.'}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#FDFDFD]/95 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-col"
            >
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-6 right-6 text-[var(--c-subtext)] hover:text-white transition-colors text-sm uppercase tracking-widest font-bold z-10"
              >
                Close
              </button>
              
              <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-2 relative z-10">
                Emotional Fingerprint
              </h2>
              <h3 className="font-serif text-3xl text-[var(--c-text)] mb-8 relative z-10">
                MoodDNA Insights
              </h3>

              {/* Big interactive orb inside detail view */}
              <div className="absolute top-0 right-0 w-64 h-64 -translate-y-1/4 translate-x-1/4 opacity-20 pointer-events-none">
                <div className="w-full h-full rounded-full animate-spin" style={{ animationDuration: '30s', background: 'radial-gradient(circle, var(--theme-color), transparent 70%)', filter: 'blur(20px)' }} />
              </div>
              
              <div className="space-y-6 relative z-10 overflow-y-auto max-h-[60vh] pr-2">
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-[var(--c-subtext)] opacity-70 mb-3 font-bold">Narrative Insights</h4>
                  <ul className="space-y-4">
                    <li className="font-serif italic text-lg text-[var(--c-text)] border-l-2 border-[var(--theme-color)] pl-4">
                      {profile.resilience > 60 ? 'You recover quickly after difficult days.' : 'You absorb emotions deeply and take time to reset.'}
                    </li>
                    {data?.moodProfile?.primaryDrivers?.length > 0 && (
                      <li className="font-serif italic text-lg text-[var(--c-text)] border-l-2 border-[var(--theme-color)] pl-4">
                        <span className="capitalize">{data.moodProfile.primaryDrivers[0]}</span> appears frequently in emotionally intense reflections.
                      </li>
                    )}
                    <li className="font-serif italic text-lg text-[var(--c-text)] border-l-2 border-[var(--theme-color)] pl-4">
                      {profile.consistency > 60 ? 'Your strongest emotional stabilizer is consistency.' : 'You thrive on varied emotional experiences.'}
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-xs uppercase tracking-widest text-[var(--c-subtext)] opacity-70 mb-4 font-bold">DNA Evolution (This Month vs Last)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl flex flex-col">
                      <span className="font-sans text-xs uppercase tracking-widest text-[var(--c-subtext)] mb-1">Optimism</span>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl text-[var(--c-text)]">Rising</span>
                        <span className="text-green-400 text-lg">↑</span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl flex flex-col">
                      <span className="font-sans text-xs uppercase tracking-widest text-[var(--c-subtext)] mb-1">Stress</span>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl text-[var(--c-text)]">Falling</span>
                        <span className="text-blue-400 text-lg">↓</span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl flex flex-col">
                      <span className="font-sans text-xs uppercase tracking-widest text-[var(--c-subtext)] mb-1">Consistency</span>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl text-[var(--c-text)]">Stable</span>
                        <span className="text-gray-400 text-lg">→</span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl flex flex-col">
                      <span className="font-sans text-xs uppercase tracking-widest text-[var(--c-subtext)] mb-1">Depth</span>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl text-[var(--c-text)]">Deepening</span>
                        <span className="text-purple-400 text-lg">↑</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
