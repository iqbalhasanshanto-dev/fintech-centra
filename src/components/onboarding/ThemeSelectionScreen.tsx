import React, { useState } from 'react';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoOnDark from '../../assets/brand/logo-on-dark.svg';
import logoOnLight from '../../assets/brand/logo-on-light.svg';
import { CornerGlow } from '../ui/CornerGlow';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeSelectionScreenProps {
  initialTheme?: 'dark' | 'light';
  onDraftChange?: (patch: { theme: 'dark' | 'light' }) => void;
  onBack: () => void;
  onContinue: (theme: 'dark' | 'light') => void;
}

export const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({
  initialTheme,
  onDraftChange,
  onBack,
  onContinue,
}) => {
  const { user, saveOnboardingProfile } = useAuth();
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(initialTheme || 'dark');

  const handleSelectMode = (mode: ThemeMode) => {
    setSelectedMode(mode);
    let resolvedTheme: 'dark' | 'light' = 'dark';
    if (mode === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        document.documentElement.classList.add('dark');
        resolvedTheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        resolvedTheme = 'light';
      }
    } else if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      resolvedTheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      resolvedTheme = 'light';
    }
    onDraftChange?.({ theme: resolvedTheme });
  };

  const handleProceed = async () => {
    let resolvedTheme: 'dark' | 'light';
    if (selectedMode === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = isSystemDark ? 'dark' : 'light';
    } else {
      resolvedTheme = selectedMode;
    }

    await saveOnboardingProfile({
      name: user?.name || '',
      theme: resolvedTheme,
    });
    onContinue(resolvedTheme);
  };

  return (
    <div
      className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col justify-between relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      <CornerGlow />

      <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto z-10 animate-fade-in">
        {/* Top Canvas Header: Separate Top Row (Back on left, Logo on right) */}
        <div className="px-6 pt-4 pb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-xs"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <img
              src={logoOnLight}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none rounded-xl dark:hidden"
              draggable={false}
            />
            <img
              src={logoOnDark}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none rounded-xl hidden dark:block"
              draggable={false}
            />
          </div>
        </div>

        {/* Elevated Bottom Sheet Card (06-onboarding-appearance.png) */}
        <div className="w-full bg-white dark:bg-[#1D1D1D] rounded-t-[32px] md:rounded-[32px] border-t md:border border-black/5 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col transition-all">
          {/* Drag Handle */}
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-5" />

          <h2 className="text-3xl font-bold tracking-tight text-[#18212F] dark:text-white mb-1.5">
            Appearance
          </h2>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6">
            Mode
          </p>

          {/* 3-Column Mode Selector Cards (System, Light, Dark) */}
          <div className="grid grid-cols-3 gap-3.5 mb-8">
            {/* System Card */}
            <button
              type="button"
              onClick={() => handleSelectMode('system')}
              className={`h-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMode === 'system'
                  ? 'bg-[#18212F] text-white dark:bg-[#000000] dark:text-white ring-2 ring-black dark:ring-white shadow-md'
                  : 'bg-[#E8ECEF] text-gray-600 dark:bg-[#2A2A2A] dark:text-gray-400 hover:opacity-80'
              }`}
              aria-label="System mode"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18A9 9 0 0 0 12 3z" fill="currentColor" />
              </svg>
              <span className="text-xs font-bold">System</span>
            </button>

            {/* Light Card */}
            <button
              type="button"
              onClick={() => handleSelectMode('light')}
              className={`h-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMode === 'light'
                  ? 'bg-[#18212F] text-white dark:bg-[#000000] dark:text-white ring-2 ring-black dark:ring-white shadow-md'
                  : 'bg-[#E8ECEF] text-gray-600 dark:bg-[#2A2A2A] dark:text-gray-400 hover:opacity-80'
              }`}
              aria-label="Light mode"
            >
              <Sun className="w-7 h-7" />
              <span className="text-xs font-bold">Light</span>
            </button>

            {/* Dark Card */}
            <button
              type="button"
              onClick={() => handleSelectMode('dark')}
              className={`h-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMode === 'dark'
                  ? 'bg-[#18212F] text-white dark:bg-[#000000] dark:text-white ring-2 ring-black dark:ring-white shadow-md'
                  : 'bg-[#E8ECEF] text-gray-600 dark:bg-[#2A2A2A] dark:text-gray-400 hover:opacity-80'
              }`}
              aria-label="Dark mode"
            >
              <Moon className="w-7 h-7 fill-current" />
              <span className="text-xs font-bold">Dark</span>
            </button>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-4 px-6 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
