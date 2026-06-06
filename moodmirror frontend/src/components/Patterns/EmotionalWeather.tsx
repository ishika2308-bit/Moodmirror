import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useRelatedMemories } from '../../hooks/useRelatedMemories';

interface EmotionalWeatherProps {
  data: any;
}

export default function EmotionalWeather({ data }: EmotionalWeatherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { getCompanionContext } = useRelatedMemories();
  const [memoryContext, setMemoryContext] = useState<any>(null);

  useEffect(() => {
    getCompanionContext().then(setMemoryContext);
  }, [getCompanionContext]);
  
  const recentScores = data?.stats?.recentScores || [];
  const avgRecent = recentScores.length ? recentScores.reduce((a:number,b:number)=>a+b,0)/recentScores.length : 50;
  const longTermScore = data?.stats?.averageMoodScore || 50;
  
  const isStable = Math.abs(avgRecent - longTermScore) < 15 && avgRecent >= 50;
  const weatherType = isStable ? 'clear' : 'shifting';
  
  // Ambient animation logic
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      if (weatherType === 'clear') {
        // Sunlight effect
        gsap.to('.sun-ray', {
          rotation: 360,
          duration: 20,
          repeat: -1,
          ease: 'none',
          transformOrigin: 'center center'
        });
      } else {
        // Fog/shifting effect
        gsap.to('.fog-layer', {
          x: 'random(-20, 20)',
          y: 'random(-10, 10)',
          opacity: 'random(0.3, 0.7)',
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.5
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [weatherType]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (weatherType === 'clear') {
      gsap.to(containerRef.current.querySelectorAll('.sun-ray'), {
        x: (x - rect.width / 2) * 0.05,
        y: (y - rect.height / 2) * 0.05,
        duration: 1,
        ease: 'power2.out'
      });
    } else {
      gsap.to(containerRef.current.querySelectorAll('.fog-layer'), {
        x: (i) => (x - rect.width / 2) * (0.02 * (i + 1)),
        y: (i) => (y - rect.height / 2) * (0.02 * (i + 1)),
        duration: 1.5,
        ease: 'power2.out'
      });
    }
  };

  return (
    <motion.div 
      onClick={() => setIsExpanded(true)}
      className="p-6 rounded-[2rem] cursor-pointer relative overflow-hidden h-full flex flex-col"
      style={{
        background: 'var(--c-card)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}
    >
      <div 
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="absolute inset-0 pointer-events-auto z-0"
      >
        {weatherType === 'clear' ? (
          <>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
            <div className="sun-ray absolute top-0 right-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4"
                 style={{ background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.05) 30deg, transparent 60deg, rgba(255,255,255,0.05) 120deg, transparent 150deg)' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-blue-900/5" />
            <div className="fog-layer absolute -inset-10 bg-white/5 blur-2xl rounded-full" />
            <div className="fog-layer absolute inset-0 bg-white/5 blur-3xl rounded-full translate-x-10 translate-y-10" />
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-4">
          Emotional Weather
        </h2>
        
        <div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg mb-4 backdrop-blur-md bg-white/10 border border-white/20">
            {weatherType === 'clear' ? '☀️' : '🌫️'}
          </div>
          <h3 className="font-serif text-2xl text-[var(--c-text)]">
            {weatherType === 'clear' ? 'Clearing Skies' : 'Heavy Fog'}
          </h3>
          <p className="font-sans text-sm text-[var(--c-subtext)] mt-2 opacity-80 leading-relaxed">
            {weatherType === 'clear' 
              ? 'Your emotional state has been highly stable.' 
              : 'You are experiencing frequent emotional shifts.'}
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
              className="w-full max-w-lg bg-[#FDFDFD]/95 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden"
            >
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-6 right-6 text-[var(--c-subtext)] hover:text-white transition-colors text-sm uppercase tracking-widest font-bold"
              >
                Close
              </button>
              
              <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] mb-2">
                Current Weather
              </h2>
              <h3 className="font-serif text-3xl text-[var(--c-text)] mb-6">
                {weatherType === 'clear' ? 'Clearing Skies' : 'Heavy Fog'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-[var(--c-subtext)] opacity-70 mb-2 font-bold">Reason</h4>
                  <p className="text-[var(--c-text)] font-sans text-sm leading-relaxed">
                    {weatherType === 'clear' 
                      ? 'Stress levels have consistently decreased over the last week.' 
                      : 'High variability in stress and focus levels detected in recent reflections.'}
                  </p>
                </div>
                
                {data?.moodProfile?.primaryDrivers?.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[var(--c-subtext)] opacity-70 mb-3 font-bold">
                      {weatherType === 'clear' ? 'Positive Influences' : 'Current Influences'}
                    </h4>
                    <ul className="space-y-2">
                      {data.moodProfile.primaryDrivers.slice(0,3).map((driver: string) => (
                        <li key={driver} className="flex items-center gap-3 text-[var(--c-text)] text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)]" />
                          <span className="capitalize">{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Memory Engine Observations */}
                {memoryContext && (memoryContext.recurringTopics?.length > 0 || memoryContext.recurringPeople?.length > 0) && (
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[var(--c-subtext)] opacity-70 mb-3 font-bold">
                      Memory Engine Observations
                    </h4>
                    <ul className="space-y-3">
                      {memoryContext.recurringPeople?.length > 0 && (
                        <li className="flex items-start gap-3 text-[var(--c-text)] text-sm leading-relaxed">
                          <span className="mt-0.5 text-[var(--theme-color)]">✦</span>
                          <span>You've been frequently mentioning <strong>{memoryContext.recurringPeople.join(', ')}</strong> recently.</span>
                        </li>
                      )}
                      {memoryContext.recurringTopics?.length > 0 && (
                        <li className="flex items-start gap-3 text-[var(--c-text)] text-sm leading-relaxed">
                          <span className="mt-0.5 text-[var(--theme-color)]">✦</span>
                          <span>Core recurring themes in your reflections: <strong>{memoryContext.recurringTopics.join(', ')}</strong>.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
