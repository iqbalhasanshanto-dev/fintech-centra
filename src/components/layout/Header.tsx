import React, { useState } from 'react';
import { Bell, ChevronDown, Check, Sparkles, Eye, EyeOff } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-30 w-full px-5 py-3.5 glass-panel border-b border-gray-200/50 dark:border-gray-800/50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Brand Wordmark / Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/25">
            <span className="text-white font-bold font-display text-base tracking-wider">C</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black font-display tracking-tight text-ink dark:text-white">
                CENTRA
              </span>
              {user.isPro && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 rounded-md uppercase tracking-wider">
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Actions: Period Selector & Notifications & Avatar */}
        <div className="flex items-center space-x-2">
          {/* Period Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-white dark:bg-surface-darkCard text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 shadow-xs hover:border-brand-400 transition-all"
              aria-expanded={showPeriodDropdown}
            >
              <span>{currentPeriodLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-surface-darkCard rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Select Period
                  </div>
                  {periods.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPeriodFilter(p.id);
                        setShowPeriodDropdown(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between text-gray-700 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                    >
                      <span>{p.label}</span>
                      {periodFilter === p.id && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Privacy Mode Quick Toggle */}
          <button
            onClick={togglePrivacy}
            className="p-2 rounded-full text-gray-500 hover:text-brand-600 hover:bg-white dark:hover:bg-surface-darkCard border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
            title={settings.privacyMode ? "Disable Privacy Mask" : "Enable Privacy Mask"}
            aria-label="Toggle privacy mask"
          >
            {settings.privacyMode ? <EyeOff className="w-4 h-4 text-brand-600" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Notification Bell with Badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-brand-600 hover:bg-white dark:hover:bg-surface-darkCard border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white shadow-xs animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onNavigateToSettings}
            className="relative rounded-full ring-2 ring-brand-500/30 hover:ring-brand-500 transition-all"
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
