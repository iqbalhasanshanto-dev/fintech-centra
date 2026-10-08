import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CentraDB } from '../db/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const settings = CentraDB.getSettings();
      return settings?.theme || 'light';
    } catch {
      return 'light';
    }
  });

  const getEffectiveIsDark = useCallback((mode: ThemeMode): boolean => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() => getEffectiveIsDark(theme));

  const applyThemeToDOM = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const dark = getEffectiveIsDark(newTheme);
    setIsDark(dark);
    applyThemeToDOM(dark);

    try {
      const currentSettings = CentraDB.getSettings();
      CentraDB.saveSettings({
        ...currentSettings,
        theme: newTheme,
      });
    } catch (err) {
      console.warn('Failed to persist theme setting:', err);
    }
  }, [getEffectiveIsDark, applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // Sync with system preference if in 'system' mode
  useEffect(() => {
    const dark = getEffectiveIsDark(theme);
    setIsDark(dark);
    applyThemeToDOM(dark);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        applyThemeToDOM(e.matches);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme, getEffectiveIsDark, applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
