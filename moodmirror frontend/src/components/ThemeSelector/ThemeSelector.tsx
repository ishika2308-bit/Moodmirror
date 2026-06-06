import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CompanionThemeType, COMPANION_THEMES } from '../../theme';
import MirrorCore from '../ui/MirrorCore';

interface ThemeSelectorProps {
  onClose: () => void;
}

const THEME_INFO: Record<CompanionThemeType, { name: string; desc: string; isDark: boolean }> = {
  aurora: { name: 'Aurora', desc: 'The original companion. Warm, gentle, and ethereal.', isDark: false },
  moonlight: { name: 'Moonlight', desc: 'Quiet and deep. A calming presence in the dark.', isDark: true },
  ocean: { name: 'Ocean', desc: 'Fluid and refreshing. Like a deep breath of sea air.', isDark: false },
  lavender: { name: 'Lavender', desc: 'Soft and soothing. A fragrant, peaceful mind.', isDark: false },
  sunset: { name: 'Sunset', desc: 'Warm and passionate. The golden hour of reflection.', isDark: false },
  forest: { name: 'Forest', desc: 'Grounded and organic. Rooted in nature.', isDark: false },
  cosmic: { name: 'Cosmic', desc: 'Infinite and mysterious. A journey through the stars.', isDark: true },
};

const THEMES = Object.keys(THEME_INFO) as CompanionThemeType[];

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { activeTheme, setTheme, getPalette } = useTheme();
  
  // Local state for the carousel
  const [currentIndex, setCurrentIndex] = useState(() => THEMES.indexOf(activeTheme));
  
  const currentKey = THEMES[currentIndex];
  const info = THEME_INFO[currentKey];
  const palette = COMPANION_THEMES[currentKey].calm; // preview using the 'calm' emotion

  const nextTheme = () => setCurrentIndex(i => (i + 1) % THEMES.length);
  const prevTheme = () => setCurrentIndex(i => (i - 1 + THEMES.length) % THEMES.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col transition-colors duration-1000"
      style={{
        background: palette.cardBg, // use the theme's background
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      <div className="absolute inset-0 opacity-40 transition-all duration-1000" style={{ background: palette.gradient }} />
      
      {/* Header */}
      <div className="relative z-10 p-6 flex justify-between items-center">
        <h2 className="font-serif text-2xl tracking-wide" style={{ color: palette.text }}>
          Companion Aura
        </h2>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
          style={{ color: palette.text }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Carousel */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-4">
        
        {/* Navigation Arrows */}
        <button 
          onClick={prevTheme}
          className="absolute left-6 w-12 h-12 rounded-full flex items-center justify-center z-20 hover:scale-110 transition-transform"
          style={{ background: palette.border, color: palette.text }}
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextTheme}
          className="absolute right-6 w-12 h-12 rounded-full flex items-center justify-center z-20 hover:scale-110 transition-transform"
          style={{ background: palette.border, color: palette.text }}
        >
          <ChevronRight size={24} />
        </button>

        {/* The Companion Orb */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentKey}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Fake a static 'calm' MirrorCore for preview purposes without triggering speech logic */}
              <MirrorCore
                state="idle"
                emotion="calm"
                audioLevel={0}
                volumeLevels={Array(24).fill(0)}
                // We pass an override palette directly so it previews the selected theme
                // rather than the currently active one globally
                overridePalette={palette} 
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Theme Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-sm"
          >
            <h3 className="font-serif text-4xl mb-4" style={{ color: palette.text }}>
              {info.name}
            </h3>
            <p className="font-sans text-sm md:text-base leading-relaxed font-medium" style={{ color: palette.subtext }}>
              {info.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Select Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setTheme(currentKey);
            onClose();
          }}
          className="mt-12 px-10 py-4 rounded-full font-sans text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-2"
          style={{
            background: activeTheme === currentKey ? palette.border : palette.text,
            color: activeTheme === currentKey ? palette.text : palette.cardBg,
          }}
        >
          {activeTheme === currentKey ? 'Active Aura' : 'Embrace Aura'}
          {activeTheme === currentKey && <Sparkles size={16} />}
        </motion.button>
        
      </div>
      
      {/* Pagination dots */}
      <div className="relative z-10 pb-12 flex justify-center gap-3">
        {THEMES.map((theme, idx) => (
          <button
            key={theme}
            onClick={() => setCurrentIndex(idx)}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{
              background: palette.text,
              opacity: currentIndex === idx ? 1 : 0.2,
              transform: currentIndex === idx ? 'scale(1.5)' : 'scale(1)'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
