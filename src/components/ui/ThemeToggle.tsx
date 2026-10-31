import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  className = '',
}) => {
  const { settings, updateSettings } = useFinance();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSettings({
      theme: isDark ? 'light' : 'dark',
    });
  };

  return (
    <div
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 cursor-pointer select-none group ${className}`}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateSettings({ theme: isDark ? 'light' : 'dark' });
        }
      }}
    >
      {showLabel && (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline-block">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}

      {/* Carbon Switch Track */}
      <div
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out border ${
          isDark
            ? 'bg-[#C6FF3D] border-[#C6FF3D]'
            : 'bg-[#E5E7EB] border-[#D1D5DB] dark:bg-[#262626] dark:border-white/[0.12]'
        }`}
      >
        <span
          className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full shadow-xs transition-transform duration-200 ease-in-out ${
            isDark ? 'translate-x-5 bg-[#18212F] text-[#C6FF3D]' : 'translate-x-0 bg-white text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-[#C6FF3D]" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500" />
          )}
        </span>
      </div>
    </div>
  );
};
