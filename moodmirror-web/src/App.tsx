import { useEffect, useState, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { AwakeningScene } from './components/AwakeningScene';

import { MemoryJourney } from './components/MemoryJourney';
import { CompanionIntelligence } from './components/CompanionIntelligence';
import { EarnedCTA } from './components/EarnedCTA';

const BubbleLogo = () => (
  <div className="relative w-32 h-32 mb-6 drop-shadow-md">
    {/* Large Bubble */}
    <div className="absolute bottom-2 left-0 w-20 h-20 rounded-full bg-gradient-to-br from-[#BFA6D8]/50 to-[#E6C280]/30 backdrop-blur-md border border-[#5A4A35]/20 shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.05),inset_5px_5px_20px_rgba(255,255,255,0.7)] overflow-hidden">
      <div className="absolute top-2 left-3 w-8 h-4 bg-white/90 rounded-[100%] blur-[2px] rotate-[-30deg]" />
    </div>
    {/* Medium Bubble */}
    <div className="absolute top-2 right-2 w-14 h-14 rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-400/20 backdrop-blur-md border border-[#5A4A35]/20 shadow-[inset_-3px_-3px_15px_rgba(0,0,0,0.05),inset_3px_3px_15px_rgba(255,255,255,0.7)] overflow-hidden">
      <div className="absolute top-1 left-2 w-5 h-2 bg-white/90 rounded-[100%] blur-[2px] rotate-[-30deg]" />
    </div>
    {/* Small Bubble */}
    <div className="absolute bottom-4 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#E6C280]/50 to-pink-400/20 backdrop-blur-md border border-[#5A4A35]/20 shadow-[inset_-2px_-2px_10px_rgba(0,0,0,0.05),inset_2px_2px_10px_rgba(255,255,255,0.7)] overflow-hidden">
      <div className="absolute top-1 left-1 w-3 h-1 bg-white/90 rounded-[100%] blur-[1px] rotate-[-30deg]" />
    </div>
  </div>
);

import SplashCursor from './components/SplashCursor';

function App() {
  const [isAwake, setIsAwake] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    // Lock scrolling initially
    if (!isAwake) {
      lenis.stop();
    }

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [isAwake]);

  const handleAwake = () => {
    setIsAwake(true);
    // Unlock scrolling after the awakening animation (give it a few seconds)
    setTimeout(() => {
      if (lenisRef.current) {
        lenisRef.current.start();
      }
    }, 2000);
  };

  const { scrollYProgress } = useScroll();
  
  // Fade out the instruction text when scrolling down
  const instructionOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  return (
    <div className="relative w-full min-h-screen text-[#5A4A35] overflow-hidden bg-transparent">
      
      <SplashCursor />

      {/* 3D Scene Layer (Fixed in background during the hero, then fades or moves with scroll if needed) */}
      <div className="fixed inset-0 z-0 pointer-events-auto h-screen">
        <AwakeningScene isAwake={isAwake} onAwake={handleAwake} />
      </div>

      {/* Hero UI Overlay */}
      <div className="relative z-10 w-full h-screen pointer-events-none flex flex-col items-center justify-center">
        <AnimatePresence>
          {!isAwake && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              transition={{ duration: 1 }}
              className="absolute bottom-20 flex flex-col items-center gap-2 pointer-events-auto cursor-pointer"
              onClick={handleAwake}
            >
              <div className="px-6 py-3 rounded-full bg-[#5A4A35]/10 border border-[#5A4A35]/20 backdrop-blur-sm animate-pulse">
                <p className="font-sans tracking-[0.3em] text-sm uppercase text-[#5A4A35] font-medium">
                  Touch to enter
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAwake && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.3, delayChildren: 1.5 }
                }
              }}
              style={{ opacity: instructionOpacity }}
              className="absolute bottom-10 flex flex-col items-center"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }
                }}
              >
                <BubbleLogo />
              </motion.div>
              
              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="font-serif text-5xl md:text-7xl font-medium tracking-tight mb-4 text-[#5A4A35]"
              >
                MoodMirror
              </motion.h1>

              <motion.p
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 0.6, transition: { duration: 1.5 } }
                }}
                className="font-sans text-lg max-w-md text-center text-[#8B7B69]"
              >
                A companion for the thoughts you don't always say out loud.
              </motion.p>
              
              <motion.div
                variants={{
                  hidden: { height: 0, opacity: 0 },
                  visible: { height: 96, opacity: 1, transition: { duration: 2 } }
                }}
                className="w-[1px] bg-gradient-to-b from-[#5A4A35]/30 to-transparent mt-12 animate-pulse"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The Journey Content (unlocked after scrolling) */}
      <div className={`relative z-10 w-full transition-opacity duration-1000 ${isAwake ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <MemoryJourney />
        <CompanionIntelligence />
        <EarnedCTA />
      </div>

    </div>
  );
}

export default App;
