import { useState, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Circle, PenLine, Orbit, User, Layers } from 'lucide-react';
import type { ViewState, EmotionState } from './types';
import { themes } from './theme';

// Views
import ReflectionView from './views/ReflectionView';
import JournalView from './views/JournalView';
import PatternsView from './views/PatternsView';
import SelfView from './views/SelfView';
import WeeklyReflection from './views/WeeklyReflection';
import ArchiveView from './views/ArchiveView';

function BottomNav({ active, onChange }: { active: ViewState, onChange: (v: ViewState) => void }) {
  const navItems: { id: ViewState; icon: ReactNode }[] = [
    { id: 'reflection', icon: <Circle size={22} strokeWidth={active === 'reflection' ? 2.5 : 1.5} /> },
    { id: 'journal', icon: <PenLine size={22} strokeWidth={active === 'journal' ? 2.5 : 1.5} /> },
    { id: 'patterns', icon: <Orbit size={22} strokeWidth={active === 'patterns' ? 2.5 : 1.5} /> },
    { id: 'archive', icon: <Layers size={22} strokeWidth={active === 'archive' ? 2.5 : 1.5} /> },
    { id: 'self', icon: <User size={22} strokeWidth={active === 'self' ? 2.5 : 1.5} /> }
  ];

  return (
    <div className="absolute bottom-0 w-full px-6 pb-8 pt-4 z-40 pointer-events-none">
      <div 
        className="pointer-events-auto flex items-center justify-around rounded-full p-2 max-w-[280px] mx-auto shadow-sm"
        style={{
          background: 'var(--c-card)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--c-border)'
        }}
      >
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ease-in-out"
              style={{
                color: isActive ? 'var(--c-text)' : 'var(--c-subtext)',
                backgroundColor: isActive ? 'var(--c-border)' : 'transparent',
                opacity: isActive ? 1 : 0.6
              }}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('reflection');
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>('calm');

  // Establish base mood based on tab if not in journal
  useEffect(() => {
    if (activeView === 'reflection') setCurrentEmotion('calm');
    else if (activeView === 'patterns') setCurrentEmotion('reflective');
    else if (activeView === 'archive') setCurrentEmotion('calm');
    else if (activeView === 'self') setCurrentEmotion('neutral');
  }, [activeView]);

  const getBentoSpotlight = (emotion: EmotionState) => {
    switch(emotion) {
      case 'hopeful': return 'rgba(255, 215, 0, 0.15)';
      case 'calm': return 'rgba(176, 224, 230, 0.1)';
      case 'reflective': return 'rgba(230, 230, 250, 0.15)';
      case 'stressed': return 'rgba(255, 191, 0, 0.15)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const getBentoBorder = (emotion: EmotionState) => {
    switch(emotion) {
      case 'hopeful': return 'rgba(255, 218, 185, 0.6)';
      case 'calm': return 'rgba(0, 128, 128, 0.6)';
      case 'reflective': return 'rgba(230, 230, 250, 0.6)';
      case 'stressed': return 'rgba(220, 20, 60, 0.6)';
      default: return 'rgba(255, 255, 255, 0.4)';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#EAEAEA] items-center justify-center overflow-hidden font-sans relative">
      {/* Mobile Constraint Container */}
      <motion.div 
        className="relative w-full h-full max-w-md md:rounded-[2.5rem] md:h-[90vh] md:border border-white/20 md:shadow-[0_20px_40px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col"
        animate={{
          background: themes[currentEmotion].gradient,
          color: themes[currentEmotion].text
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait">
          {activeView === 'reflection' && <ReflectionView key="reflection" onEmotionChange={setCurrentEmotion} />}
          {activeView === 'journal' && <JournalView key="journal" onEmotionChange={setCurrentEmotion} />}
          {activeView === 'patterns' && <PatternsView key="patterns" />}
          {activeView === 'archive' && <ArchiveView key="archive" onEmotionChange={setCurrentEmotion} />}
          {activeView === 'self' && <SelfView key="self" onOpenReflection={() => setShowWeeklyReflection(true)} />}
        </AnimatePresence>

        <BottomNav active={activeView} onChange={setActiveView} />

        <AnimatePresence>
          {showWeeklyReflection && (
            <WeeklyReflection key="weekly" onClose={() => setShowWeeklyReflection(false)} />
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* CSS Vars synchronizer */}
      <style>{`
        :root {
          --c-text: ${themes[currentEmotion].text};
          --c-subtext: ${themes[currentEmotion].subtext};
          --c-card: ${themes[currentEmotion].cardBg};
          --c-border: ${themes[currentEmotion].border};
          --bento-spotlight: ${getBentoSpotlight(currentEmotion)};
          --bento-border: ${getBentoBorder(currentEmotion)};
        }
      `}</style>
    </div>
  );
}

