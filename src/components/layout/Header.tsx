import React, { useState } from 'react';
import { Bell, ChevronDown, Check, Eye, EyeOff, Shield, Moon, Sun } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { PeriodFilter } from '../../types';

interface HeaderProps {
  onOpenNotifications: () => void;
  onNavigateToSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onNavigateToSettings,
}) => {
  const { periodFilter, setPeriodFilter, unreadNotificationsCount, settings, updateSettings } = useFinance();
  const { user } = useAuth();
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  const currentPeriodLabel = periods.find(p => p.id === periodFilter)?.label || 'This Month';

  const togglePrivacy = () => {
    updateSettings({ privacyMode: !settings.privacyMode });
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 sm:px-6 md:px-8 py-3 bg-white/90 dark:bg-[#161B26]/85 backdrop-blur-md border-b border-gray-200/80 dark:border-white/10 transition-colors select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Wordmark (clean, no Pro badge) */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4 h-4 fill-white/20 stroke-[2.4]" />
          </div>
          <span className="text-base sm:text-lg font-black font-display tracking-tight text-gray-900 dark:text-[#FFFFFF]">
            CENTRA
          </span>
        </div>

        {/* Right Toolbar: Period Selector, Theme Toggle, Privacy Toggle, Notifications & Profile Avatar */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Period Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1E2536] text-xs font-semibold text-gray-700 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-indigo-500 transition-colors"
              aria-expanded={showPeriodDropdown}
            >
              <span>{currentPeriodLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-[#94A3B8] transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#161B26] rounded-xl shadow-xl border border-gray-200/80 dark:border-white/10 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wider">
                    Select Period
                  </div>
                  {periods.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPeriodFilter(p.id);
                        setShowPeriodDropdown(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-700 dark:text-[#E2E8F0] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <span>{p.label}</span>
                      {periodFilter === p.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Quick Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-[#FFFFFF] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title={settings.theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* Privacy Mask Quick Toggle */}
          <button
            onClick={togglePrivacy}
            className="p-2 rounded-xl text-gray-500 dark:text-[#94A3B8] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title={settings.privacyMode ? "Disable Privacy Mask" : "Enable Privacy Mask"}
            aria-label="Toggle privacy mask"
          >
            {settings.privacyMode ? <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Notification Bell with Badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-gray-500 dark:text-[#94A3B8] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onNavigateToSettings}
            className="relative rounded-full ring-2 ring-indigo-500/20 hover:ring-indigo-500/50 transition-all ml-1"
            aria-label="Open user settings"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>

        </div>
      </div>
    </header>
  );
};
