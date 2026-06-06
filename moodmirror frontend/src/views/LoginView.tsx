import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { HeroOrbs } from '../components/ui/HeroOrbs';

// -------------- GOOGLE BUTTON -------------- //

const GoogleButton = ({ onClick, disabled }: { onClick: () => void, disabled: boolean }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 15px 35px -10px rgba(255, 255, 255, 0.4), 0 10px 20px -5px rgba(0,0,0,0.1), inset 0 0 15px rgba(255, 255, 255, 0.8)",
        background: "rgba(255, 255, 255, 0.4)" 
      }}
      whileTap={{ scale: 0.97, boxShadow: "0 5px 15px -5px rgba(0,0,0,0.1)" }}
      className="relative w-full max-w-[280px] mx-auto flex items-center justify-center gap-4 py-4 px-6 rounded-3xl overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05), inset 0 0 10px rgba(255,255,255,0.4)',
      }}
    >
      {disabled ? (
        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-sm">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      <span className="font-sans font-medium text-gray-700 tracking-wide">
        {disabled ? 'Connecting...' : 'Continue with Google'}
      </span>
    </motion.button>
  );
};

// -------------- ONBOARDING -------------- //

const SUGGESTIONS = ['Mira', 'Lumi', 'Nova', 'Echo', 'Atlas'];

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { refreshProfile } = useAuth();
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const finalName = selected || custom.trim();

  const handleSave = async () => {
    if (!finalName) {
      setError('Please choose a name or type your own.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { companionName: finalName }, { merge: true });
      await refreshProfile();
      onComplete(); // Move to transition
    } catch (e) {
      console.error('Failed to save companion name:', e);
      setError('Something went wrong. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto flex flex-col items-center text-center z-10"
    >
      <h2 className="font-serif text-3xl text-gray-800 mb-3 leading-tight tracking-tight">
        Meet your companion
      </h2>
      <p className="font-sans text-sm text-gray-600 mb-10 leading-relaxed max-w-[280px]">
        Give your reflection companion a name. They'll be here every time you want to talk.
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {SUGGESTIONS.map((name) => (
          <motion.button
            key={name}
            onClick={() => { setSelected(name); setCustom(''); setError(''); }}
            whileTap={{ scale: 0.94 }}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
            style={{
              background: selected === name ? 'rgba(80, 90, 110, 0.8)' : 'rgba(255, 255, 255, 0.3)',
              color: selected === name ? '#fff' : '#4b5563',
              boxShadow: selected === name ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              border: '1px solid rgba(255,255,255,0.4)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {name}
          </motion.button>
        ))}
      </div>

      {/* Custom name input */}
      <div className="w-full max-w-[240px] mb-4">
        <input
          type="text"
          placeholder="Or type a custom name…"
          value={custom}
          maxLength={32}
          onChange={(e) => { setCustom(e.target.value); setSelected(''); setError(''); }}
          className="w-full px-5 py-3 rounded-full text-sm text-center bg-white/20 border border-white/50 text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-white/80 transition-all backdrop-blur-md"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-4">{error}</p>
      )}

      <motion.button
        onClick={handleSave}
        disabled={isSaving}
        whileHover={{ scale: 1.02, background: 'rgba(50, 60, 80, 0.95)' }}
        whileTap={{ scale: 0.96 }}
        className="mt-6 w-full max-w-[200px] py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest text-white transition-all shadow-lg"
        style={{
          background: 'rgba(80, 90, 110, 0.9)',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {isSaving ? 'Saving…' : `Let's go${finalName ? `, ${finalName}` : ''}`}
      </motion.button>
    </motion.div>
  );
};


// -------------- MAIN LOGIN VIEW -------------- //

export default function LoginView({ onComplete }: { onComplete?: () => void }) {
  const { login, bypassLogin, currentUser, userProfile } = useAuth();
  
  // Parallax tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  type Step = 'assembling' | 'floating' | 'login' | 'onboarding' | 'transitioning';
  const [step, setStep] = useState<Step>(() => {
    return localStorage.getItem('hasSeenIntro') === 'true' ? 'login' : 'assembling';
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Cinematic Intro Timer sequence
  useEffect(() => {
    if (step === 'assembling') {
      const t1 = setTimeout(() => {
        setStep('floating');
      }, 3000); // 3 seconds to assemble in the center
      return () => clearTimeout(t1);
    } else if (step === 'floating') {
      const t2 = setTimeout(() => {
        setStep('login');
      }, 1500); // 1.5 seconds to float up before text appears
      return () => clearTimeout(t2);
    } else if (step === 'login') {
      localStorage.setItem('hasSeenIntro', 'true');
    }
  }, [step]);
  
  // Watch for auth changes
  useEffect(() => {
    if (currentUser && userProfile !== null && step !== 'assembling' && step !== 'floating') {
      if (!userProfile.companionName && step === 'login') {
        setStep('onboarding');
      } else if (userProfile.companionName && step !== 'transitioning') {
        startTransition();
      }
    }
  }, [currentUser, userProfile, step]);

  const handleLoginClick = async () => {
    try {
      setIsAuthenticating(true);
      await login();
      // The useEffect above will handle the next step once userProfile loads
    } catch (err: any) {
      console.error(err);
      setIsAuthenticating(false);
    }
  };

  const startTransition = () => {
    setStep('transitioning');
    // Delay 1000ms max for the orb convergence animation before unmounting
    setTimeout(() => {
      onComplete?.();
    }, 1000);
  };

  return (
    <motion.div 
      className="flex flex-col h-screen min-h-[600px] w-full items-center justify-center p-8 relative overflow-hidden"
      // Ambient background CSS animation
      style={{
        background: 'radial-gradient(circle at 50% 50%, #f1f3f8 0%, #e6e9f0 50%, #d8dde8 100%)',
      }}
      animate={{
        background: step === 'transitioning' 
          ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f3f8 50%, #e6e9f0 100%)' 
          : 'radial-gradient(circle at 50% 50%, #f1f3f8 0%, #e6e9f0 50%, #d8dde8 100%)'
      }}
      transition={{ duration: 1 }}
    >
      <HeroOrbs 
        isTransitioning={step === 'transitioning'} 
        introStage={
          step === 'assembling' ? 'assembling' :
          step === 'floating' ? 'floating' : 'done'
        } 
      />

      <AnimatePresence mode="wait">
        {step === 'login' && (
          <motion.div
            key="login-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="z-10 w-full max-w-sm flex flex-col items-center mt-8"
          >
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.5 }}
              className="font-sans text-5xl font-light mb-2 tracking-wide text-center"
              style={{
                color: '#3B2B4A', // Deep engraved purple
                textShadow: '0px 1px 1px rgba(255,255,255,0.8), 0px -1px 1px rgba(0,0,0,0.2)',
                letterSpacing: '0.02em',
              }}
            >
              MoodMirror
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex items-center justify-center gap-3 mb-3 w-full"
            >
              <div className="h-[1px] w-12 bg-[#3B2B4A] opacity-40"></div>
              <div className="w-2 h-2 rotate-45 bg-[#3B2B4A] opacity-70" style={{ boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.5)' }}></div>
              <div className="h-[1px] w-12 bg-[#3B2B4A] opacity-40"></div>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="font-sans text-[0.85rem] font-medium tracking-[0.15em] uppercase mb-12 text-center max-w-[240px]"
              style={{ color: '#3B2B4A', opacity: 0.85 }}
            >
              See yourself clearly.
            </motion.p>

            <GoogleButton onClick={handleLoginClick} disabled={isAuthenticating} />

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-8 font-serif italic text-xs text-gray-400 text-center"
            >
              Your reflections belong to you.
            </motion.p>
          </motion.div>
        )}

        {step === 'onboarding' && (
          <Onboarding key="onboarding-content" onComplete={startTransition} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
