import { useState, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Circle, PenLine, Orbit, User, Layers } from 'lucide-react';
import type { ViewState, EmotionState, AnalysisResult } from './types';
import { useTheme } from './context/ThemeContext';

// Views
import ReflectionView from './views/ReflectionView';
import PatternsView from './views/PatternsView';
import SelfView from './views/SelfView';
import WeeklyReflection from './views/WeeklyReflection';
import ArchiveView from './views/ArchiveView';
import LoginView from './views/LoginView';
import { OnboardingView } from './views/OnboardingView';
import SpotifyCallback from './views/SpotifyCallback';
import { HeroOrbs } from './components/ui/HeroOrbs';
import { useAuth } from './context/AuthContext';
import { useDashboard } from './hooks/useDashboard';
import { App as CapacitorApp } from '@capacitor/app';

function BottomNav({ active, onChange }: { active: ViewState, onChange: (v: ViewState) => void }) {
  const navItems: { id: ViewState; icon: ReactNode }[] = [
    { id: 'home', icon: <Circle size={22} strokeWidth={active === 'home' ? 2.5 : 1.5} /> },
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
  const { currentUser, userProfile, refreshProfile, loading, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>('calm');
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [latestTranscript, setLatestTranscript] = useState<string>('');
  const { getPalette, activeTheme } = useTheme();
  const currentPalette = getPalette(currentEmotion);
  const [loginFlowCompleted, setLoginFlowCompleted] = useState(false);
  const [spotifyDeepLinkUrl, setSpotifyDeepLinkUrl] = useState<string | null>(
    window.location.pathname === '/spotify-callback' ? window.location.href : null
  );

  useEffect(() => {
    // Listen for custom URL scheme routing (Capacitor)
    if (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()) {
      CapacitorApp.addListener('appUrlOpen', data => {
        if (data.url.includes('spotify-callback')) {
          setSpotifyDeepLinkUrl(data.url);
        }
      });
    }
  }, []);

  // If user logs out or loading finishes without user, reset flow
  useEffect(() => {
    if (!loading && !currentUser) {
      setLoginFlowCompleted(false);
    }
  }, [currentUser, loading]);

  const { data: dashboardData } = useDashboard();

  // Establish base mood from a blend of latest mood (70%) and 7-day average (30%)
  useEffect(() => {
    // If currently actively journaling or reflecting, let those components manage the emotion
    if (activeView === 'home') return;

    if (dashboardData?.stats?.recentScores?.length) {
      const latest = dashboardData.stats.recentScores[0];
      const avg = dashboardData.stats.averageMoodScore;
      const blended = (latest * 0.7) + (avg * 0.3);
      
      let baseEmotion: EmotionState = 'calm';
      if (blended < 40) baseEmotion = 'stressed';
      else if (blended < 60) baseEmotion = 'reflective';
      else if (blended < 80) baseEmotion = 'calm';
      else baseEmotion = 'hopeful';
      
      setCurrentEmotion(baseEmotion);
    } else {
      setCurrentEmotion('neutral');
    }
  }, [activeView, dashboardData]);

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

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center p-8 relative overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, #f1f3f8 0%, #e6e9f0 50%, #d8dde8 100%)' }}>
        <HeroOrbs />
      </div>
    );
  }

  if (spotifyDeepLinkUrl) {
    return <SpotifyCallback customUrl={spotifyDeepLinkUrl} />;
  }

  if (!currentUser || !loginFlowCompleted) {
    return <LoginView onComplete={() => setLoginFlowCompleted(true)} />;
  }

  const renderContent = () => {
    if (userProfile && !userProfile.onboardingCompleted) {
      return <OnboardingView onComplete={refreshProfile} />;
    }

    if (activeView === 'home') {
      return (
        <ReflectionView 
          key="home" 
          onEmotionChange={setCurrentEmotion} 
          currentEmotion={currentEmotion}
          initialAnalysis={latestAnalysis}
          initialTranscript={latestTranscript}
          onClearAnalysis={() => { setLatestAnalysis(null); setLatestTranscript(''); }}
          onNavigateToArchive={() => setActiveView('archive')}
        />
      );
    }
    if (activeView === 'patterns') {
      return <PatternsView key="patterns" />;
    }
    if (activeView === 'archive') {
      return <ArchiveView key="archive" onEmotionChange={setCurrentEmotion} />;
    }
    if (activeView === 'self') {
      return <SelfView key="self" onOpenReflection={() => setShowWeeklyReflection(true)} onLogout={logout} />;
    }
    return null;
  };

  return (
    <div className="flex h-screen w-full bg-[#EAEAEA] items-center justify-center overflow-hidden font-sans relative">
      <style>{`
        :root {
          --c-text: ${currentPalette.text};
          --c-subtext: ${currentPalette.subtext};
          --c-card: ${currentPalette.cardBg};
          --c-border: ${currentPalette.border};
          --c-bg: ${currentPalette.cardBg};
          --theme-color: ${currentPalette.gradient.split(',')[1]?.trim().split(' ')[0] || currentPalette.text};
          --theme-gradient: ${currentPalette.gradient};
        }
      `}</style>
      
      {/* Mobile Constraint Container */}
      <motion.div 
        className="relative w-full h-full max-w-md md:rounded-[2.5rem] md:h-[90vh] md:border border-white/20 md:shadow-[0_20px_40px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col"
        animate={{
          background: currentPalette.gradient,
          color: currentPalette.text
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>

        {!(userProfile && !userProfile.onboardingCompleted) && (
          <BottomNav active={activeView} onChange={setActiveView} />
        )}

        <AnimatePresence>
          {showWeeklyReflection && (
            <WeeklyReflection key="weekly" onClose={() => setShowWeeklyReflection(false)} />
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* CSS Vars synchronizer */}
      <style>{`
        :root {
          --c-text: ${currentPalette.text};
          --c-subtext: ${currentPalette.subtext};
          --c-card: ${currentPalette.cardBg};
          --c-border: ${currentPalette.border};
          --bento-spotlight: ${getBentoSpotlight(currentEmotion)};
          --bento-border: ${getBentoBorder(currentEmotion)};
          --theme-color: ${currentPalette.coreColors[0]};
          --theme-color-light: ${currentPalette.coreColors[1]};
        }
      `}</style>
    </div>
  );
}

