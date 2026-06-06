import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanionThemeType, COMPANION_THEMES, EmotionPalette } from '../theme';

interface ThemeContextValue {
  activeTheme: CompanionThemeType;
  setTheme: (theme: CompanionThemeType) => void;
  getPalette: (emotion: string) => EmotionPalette;
}

const ThemeContext = createContext<ThemeContextValue>({
  activeTheme: 'aurora',
  setTheme: () => {},
  getPalette: () => COMPANION_THEMES.aurora.calm,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<CompanionThemeType>('aurora');

  useEffect(() => {
    const saved = localStorage.getItem('companionTheme') as CompanionThemeType;
    if (saved && COMPANION_THEMES[saved]) {
      setActiveTheme(saved);
    }
  }, []);

  const setTheme = (theme: CompanionThemeType) => {
    setActiveTheme(theme);
    localStorage.setItem('companionTheme', theme);
  };

  const getPalette = (emotion: string): EmotionPalette => {
    const palettes = COMPANION_THEMES[activeTheme];
    // Cast emotion string to key, default to calm
    const validEmotion = emotion in palettes ? (emotion as keyof typeof palettes) : 'calm';
    return palettes[validEmotion];
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme, getPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
