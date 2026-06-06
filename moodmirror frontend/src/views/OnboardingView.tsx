import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ThemeSelector } from '../components/ThemeSelector/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Camera, Check, Orbit, Heart, Zap } from 'lucide-react';
import { HeroOrbs } from '../components/ui/HeroOrbs';
import { ProfilePictureUpload } from '../components/ui/ProfilePictureUpload';
import MirrorCore from '../components/ui/MirrorCore';

export function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const { activeTheme, setTheme, getPalette } = useTheme();
  const currentPalette = getPalette('calm');
  
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState(userProfile?.displayName || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(userProfile?.photoURL || null);
  const [companionName, setCompanionName] = useState('Mira');
  const [language, setLanguage] = useState('English');
  const [saving, setSaving] = useState(false);
  
  // Ceremonial delays
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    setShowNext(false);
    const timer = setTimeout(() => setShowNext(true), 1500);
    return () => clearTimeout(timer);
  }, [step]);

  const nextStep = () => setStep(prev => prev + 1);

  const completeOnboarding = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: preferredName,
        photoURL: photoUrl,
        companionName: companionName,
        onboardingCompleted: true,
        preferences: {
          ...userProfile?.preferences,
          language: language,
        }
      }, { merge: true });
      
      await refreshProfile();
      onComplete();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      // 0: Welcome
      case 0:
        return (
          <motion.div 
            key="step0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 2 }}
            className="flex flex-col items-center justify-center text-center max-w-sm w-full h-full"
          >
            <HeroOrbs isTransitioning={false} introStage="floating" />
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 2 }}
              className="font-serif text-5xl mb-6 text-white tracking-tight"
            >
              Sanctuary
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 2 }}
              className="font-sans text-[0.8rem] text-white/70 tracking-widest uppercase mb-16 leading-relaxed"
            >
              A private space for your thoughts,<br/>memories, and emotions.
            </motion.p>
            <AnimatePresence>
              {showNext && (
                <motion.button 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={nextStep}
                  className="px-10 py-4 rounded-full bg-white/10 border border-white/20 text-white font-bold tracking-widest uppercase text-[0.6rem] hover:bg-white/20 hover:scale-105 transition-all backdrop-blur-md"
                >
                  Awaken
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        );

      // 1: Name & Avatar
      case 1:
        return (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <h2 className="font-serif text-3xl mb-8 text-white/90">Who is stepping inside?</h2>
            
            <div className="mb-12">
              <ProfilePictureUpload 
                currentPhotoUrl={photoUrl} 
                onPhotoUploaded={setPhotoUrl} 
                size="xl" 
              />
            </div>

            <p className="font-sans text-[0.6rem] text-white/50 mb-4 tracking-widest uppercase">
              How should you be addressed?
            </p>
            <input
              type="text"
              value={preferredName}
              onChange={e => setPreferredName(e.target.value)}
              placeholder="Your name"
              className="w-full text-center bg-transparent border-b border-white/20 focus:border-white py-4 text-3xl font-serif text-white focus:outline-none mb-12 transition-colors placeholder:text-white/20"
            />
            
            <motion.button 
              animate={{ opacity: preferredName.trim() ? 1 : 0 }}
              disabled={!preferredName.trim()}
              onClick={nextStep}
              className="px-10 py-4 rounded-full bg-white text-black font-bold tracking-widest uppercase text-[0.6rem] transition-all"
            >
              Continue
            </motion.button>
          </motion.div>
        );

      // 2: Companion Naming
      case 2:
        return (
          <motion.div 
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <div className="h-[200px] flex items-center justify-center mb-8">
              <MirrorCore 
                emotion="calm" 
                state={companionName.length > 2 ? 'listening' : 'idle'} 
                audioLevel={companionName.length > 2 ? 0.3 : 0} 
              />
            </div>

            <h2 className="font-serif text-3xl mb-4 text-white/90">A listener awakens.</h2>
            <p className="font-sans text-[0.6rem] text-white/60 mb-8 tracking-widest uppercase leading-relaxed">
              Name your companion.<br/>They will remember what matters to you.
            </p>
            
            <input
              type="text"
              value={companionName}
              onChange={e => setCompanionName(e.target.value)}
              placeholder="e.g. Mira, Leo, Echo"
              className="w-full text-center bg-transparent border-b border-white/20 focus:border-white py-4 text-3xl font-serif text-white focus:outline-none mb-12 transition-colors placeholder:text-white/20"
            />
            
            <motion.button 
              animate={{ opacity: companionName.trim() ? 1 : 0 }}
              disabled={!companionName.trim()}
              onClick={nextStep}
              className="px-10 py-4 rounded-full bg-white text-black font-bold tracking-widest uppercase text-[0.6rem] transition-all"
            >
              Breathe Life
            </motion.button>
          </motion.div>
        );

      // 3: Aura / Theme
      case 3:
        return (
          <motion.div 
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center text-center max-w-lg w-full h-full justify-center pb-10"
          >
            <h2 className="font-serif text-3xl mb-4 text-white">Choose an Aura</h2>
            <p className="font-sans text-[0.6rem] text-white/60 mb-8 tracking-widest uppercase">
              The aesthetic soul of {companionName}
            </p>
            
            <div className="w-full flex-1">
              <ThemeSelector onClose={nextStep} />
            </div>
            
            <button 
              onClick={nextStep}
              className="mt-8 px-10 py-4 rounded-full bg-white/10 border border-white/20 text-white font-bold tracking-widest uppercase text-[0.6rem] backdrop-blur-md"
            >
              Skip for now
            </button>
          </motion.div>
        );

      // 4: Language
      case 4:
        return (
          <motion.div 
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <h2 className="font-serif text-3xl mb-4 text-white">The Voice</h2>
            <p className="font-sans text-[0.6rem] text-white/60 mb-12 tracking-widest uppercase">
              How does {companionName} speak?
            </p>
            
            <div className="flex flex-col gap-4 w-full mb-12">
              {['English', 'Hindi', 'Hinglish'].map(lang => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setTimeout(nextStep, 500); }}
                  className={`p-6 rounded-3xl border backdrop-blur-md transition-all duration-500 ${
                    language === lang 
                      ? 'border-white bg-white/10 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}
                >
                  <span className="font-serif text-2xl">{lang}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      // 5: Introduction
      case 5:
        return (
          <motion.div 
            key="step5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="flex flex-col items-center text-center max-w-sm w-full justify-center h-full"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 3, ease: "easeOut" }}
              className="mb-12"
            >
              <MirrorCore emotion="calm" state="reflecting" />
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 2 }}
              className="font-serif text-4xl mb-6 text-white"
            >
              Hello, {preferredName}.
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5, duration: 2 }}
              className="font-serif text-xl text-white/80 mb-16 leading-relaxed italic"
            >
              "I am {companionName}. I'm here to listen, to remember, and to walk alongside you."
            </motion.p>

            <AnimatePresence>
              {showNext && (
                <motion.button 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={nextStep}
                  className="px-10 py-4 rounded-full bg-white text-black font-bold tracking-widest uppercase text-[0.6rem] transition-all"
                >
                  Enter the Sanctuary
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        );

      // 6: Tutorial Discovery
      case 6:
        return (
          <motion.div 
            key="step6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <h2 className="font-serif text-3xl mb-12 text-white">Your Space</h2>
            
            <div className="flex flex-col gap-8 text-left w-full mb-16">
              {[
                { icon: <Orbit className="text-white" size={20}/>, title: "Mirror", desc: `Speak or type. ${companionName} will listen without judgment.` },
                { icon: <Heart className="text-white" size={20}/>, title: "Memory Engine", desc: "Every emotion, person, and goal is mapped to your journey." },
                { icon: <Zap className="text-white" size={20}/>, title: "Time Capsules", desc: "Write to your future self and lock it away in time." }
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 + 0.5, duration: 1 }}
                  className="flex items-start gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              onClick={completeOnboarding}
              disabled={saving}
              className="w-full py-5 rounded-full bg-white text-black font-bold tracking-widest uppercase text-xs hover:scale-105 transition-transform disabled:opacity-50"
            >
              {saving ? 'Preparing...' : 'Begin'}
            </motion.button>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-white">
      {/* Immersive Theme Gradient */}
      <div 
        className="absolute inset-0 opacity-80 transition-all duration-3000 ease-in-out"
        style={{
          background: activeTheme !== 'system' && activeTheme !== 'light' 
            ? currentPalette.gradient 
            : 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        }}
      />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-screen" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Ethereal Progress Indicators */}
        {step > 0 && step < 6 && (
          <div className="fixed bottom-12 left-0 right-0 flex justify-center gap-3 z-20">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-1000 ${
                  step === i ? 'bg-white w-6 shadow-[0_0_10px_white]' : 
                  step > i ? 'bg-white/40 w-2' : 'bg-white/10 w-2'
                }`} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
