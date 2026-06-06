import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = ['Mira', 'Lumi', 'Nova', 'Echo', 'Atlas'];

const CompanionNameModal: React.FC = () => {
  const { refreshProfile, userProfile } = useAuth();
  const [step, setStep] = useState<'pick' | 'saving'>('pick');
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');

  const finalName = selected || custom.trim();

  const handleSave = async () => {
    if (!finalName) {
      setError('Please choose a name or type your own.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setStep('saving');
    try {
      await setDoc(doc(db, 'users', user.uid), { companionName: finalName }, { merge: true });
      await refreshProfile();
    } catch (e) {
      console.error('Failed to save companion name:', e);
      setStep('pick');
      setError('Something went wrong. Please try again.');
    }
  };

  // If profile already has a companion name, don't show the modal
  if (userProfile && userProfile.companionName) return null;
  // Don't show until profile is loaded
  if (!userProfile) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="companion-modal-backdrop"
        className="absolute inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key="companion-modal-card"
          className="w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center"
          style={{
            background: 'var(--c-card)',
            border: '1px solid var(--c-border)',
            boxShadow: '0 30px 60px -10px rgba(0,0,0,0.2)',
          }}
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        >
          {/* Orb */}
          <motion.div
            className="w-16 h-16 rounded-full mb-6"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(200,180,255,0.9), rgba(100,160,255,0.6))',
              boxShadow: '0 0 40px rgba(160,140,255,0.5)',
            }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <h2 className="font-serif text-2xl text-[var(--c-text)] mb-2 leading-tight">
            Meet your companion
          </h2>
          <p className="font-sans text-sm text-[var(--c-subtext)] opacity-80 mb-6 leading-relaxed">
            Give your reflection companion a name. They'll be here every time you want to talk.
          </p>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {SUGGESTIONS.map((name) => (
              <motion.button
                key={name}
                onClick={() => { setSelected(name); setCustom(''); setError(''); }}
                whileTap={{ scale: 0.94 }}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  background: selected === name ? 'var(--c-text)' : 'var(--c-border)',
                  color: selected === name ? 'var(--c-card)' : 'var(--c-text)',
                  border: '1px solid var(--c-border)',
                }}
              >
                {name}
              </motion.button>
            ))}
          </div>

          {/* Custom name input */}
          <input
            type="text"
            placeholder="Or type a custom name…"
            value={custom}
            maxLength={32}
            onChange={(e) => { setCustom(e.target.value); setSelected(''); setError(''); }}
            className="w-full px-4 py-2.5 rounded-full text-sm text-center bg-transparent border border-[var(--c-border)] text-[var(--c-text)] placeholder:text-[var(--c-subtext)] placeholder:opacity-50 outline-none focus:ring-1 focus:ring-[var(--c-text)]/30 mb-2"
          />

          {error && (
            <p className="text-xs text-red-400 mb-2">{error}</p>
          )}

          <motion.button
            id="companion-save-btn"
            onClick={handleSave}
            disabled={step === 'saving'}
            whileTap={{ scale: 0.96 }}
            className="mt-4 w-full py-3 rounded-full text-sm font-semibold uppercase tracking-wider transition-all"
            style={{
              background: 'var(--c-text)',
              color: 'var(--c-card)',
              opacity: step === 'saving' ? 0.6 : 1,
            }}
          >
            {step === 'saving' ? 'Saving…' : `Let's go${finalName ? `, ${finalName}` : ''}`}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompanionNameModal;
