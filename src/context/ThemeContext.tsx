import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CentraDB } from '../db/storage';
import { updateNativeStatusBar } from '../utils/nativeApp';

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

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const isDark = theme === 'dark' ? true : theme === 'light' ? false : systemIsDark;

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

    try {
      localStorage.setItem('centra_theme_hint', dark ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }

    // Update theme-color meta tags
    const themeColorMetas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    const color = dark ? '#0A0E1A' : '#FAFAFA';
    themeColorMetas.forEach(meta => {
      meta.setAttribute('content', color);
    });

    updateNativeStatusBar(dark).catch(() => {});
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);

    try {
      const currentSettings = CentraDB.getSettings();
      CentraDB.saveSettings({
        ...currentSettings,
        theme: newTheme,
      });
    } catch (err) {
      console.warn('Failed to persist theme setting:', err);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // Sync DOM and meta with effective theme
  useEffect(() => {
    applyThemeToDOM(isDark);
  }, [isDark, applyThemeToDOM]);

  // Sync with system preference if in 'system' mode
  useEffect(() => {
    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        setSystemIsDark(e.matches);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

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
