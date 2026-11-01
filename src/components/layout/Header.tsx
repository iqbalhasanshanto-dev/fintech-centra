import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Check, LogOut, Sun, Moon } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PeriodFilter } from '../../types';
import { ConfirmModal } from '../ui/ConfirmModal';
import { getGreeting } from '../../utils/greeting';
import { getUserInitials } from '../../utils/initials';

interface HeaderProps {
  onOpenNotifications: () => void;
  onNavigateToSettings: () => void;
  onOpenAddAction?: () => void;
  activeTab?: 'home' | 'report' | 'plan' | 'settings' | 'cards';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onNavigateToSettings,
  onOpenAddAction: _onOpenAddAction,
  activeTab = 'home',
}) => {
  const { periodFilter, setPeriodFilter, unreadNotificationsCount, syncStatus, updateSettings } = useFinance();
  const { user, isGuest, createAccountFromGuest, exitGuestMode } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);
  const [showExitDemoConfirm, setShowExitDemoConfirm] = useState(false);
  const [greeting, setGreeting] = useState(() => getGreeting());

  useEffect(() => {
    const update = () => setGreeting(getGreeting());

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        update();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', update);
    const timer = setInterval(update, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', update);
      clearInterval(timer);
    };
  }, []);

  const syncLabel = isGuest
    ? 'Local Demo'
    : syncStatus === 'synced'
      ? 'Synced'
      : syncStatus === 'syncing'
        ? 'Syncing...'
        : syncStatus === 'offline'
          ? 'Offline'
          : 'Sync Error';

  const syncColor = isGuest
    ? 'bg-gray-400'
    : syncStatus === 'synced'
      ? 'bg-emerald-500'
      : syncStatus === 'syncing'
        ? 'bg-blue-500 animate-pulse'
        : syncStatus === 'offline'
          ? 'bg-amber-500'
          : 'bg-rose-500';

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  const currentPeriodLabel = periods.find(p => p.id === periodFilter)?.label || 'This Month';

  return (
    <header
      id="header"
      className="border-b border-black/5 dark:border-white/10 bg-[#F7F8FA] dark:bg-[#000000] sticky top-0 z-40 w-full"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

        {/* Left: Dynamic Header Title */}
        <div className="flex flex-col justify-center min-w-0 pr-2">
          {activeTab === 'report' ? (
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#18212F] dark:text-white whitespace-nowrap truncate">
              Analytics
            </h1>
          ) : activeTab === 'plan' ? (
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#18212F] dark:text-white whitespace-nowrap truncate">
              Goals &amp; Budgets
            </h1>
          ) : (
            <>
              <span className="text-xs sm:text-sm font-normal text-[#667085] dark:text-[#9CA3AF] tracking-tight whitespace-nowrap truncate">
                {greeting}
              </span>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#18212F] dark:text-white mt-0.5 truncate max-w-[170px] sm:max-w-[240px]">
                {isGuest ? 'Demo User' : user.name || 'Adam James'}
              </span>
            </>
          )}
        </div>

        {/* Desktop center sync status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400" title={`Sync Status: ${syncLabel}`}>
          <span className={`w-2 h-2 rounded-full ${syncColor}`} />
          <span>{syncLabel}</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {/* Period Selector Dropdown (Desktop & Tablet) */}
          <div className="relative hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] rounded-full px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-expanded={showPeriodDropdown}
              aria-haspopup="listbox"
              aria-label={`Filter by period: ${currentPeriodLabel}`}
            >
              <span>{currentPeriodLabel}</span>
              <ChevronDown className={`ml-2 w-3.5 h-3.5 text-gray-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#1D1D1D] rounded-xl shadow-2xl border border-black/[0.06] dark:border-white/[0.08] py-1.5 z-50 origin-top-right-spring">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Select Period
                  </div>
                  {periods.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPeriodFilter(p.id);
                        setShowPeriodDropdown(false);
                      }}
                      aria-current={periodFilter === p.id ? 'true' : undefined}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-[#F1F2F4] dark:hover:bg-[#262626] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{p.label}</span>
                      {periodFilter === p.id && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Theme Toggle Button (Sun/Moon - Demo Mode only for rapid light/dark preview) */}
            {isGuest && (
              <button
                type="button"
                onClick={() => {
                  const currentlyDark = typeof document !== 'undefined'
                    ? document.documentElement.classList.contains('dark')
                    : isDark;
                  const nextTheme = currentlyDark ? 'light' : 'dark';
                  setTheme(nextTheme);
                  updateSettings({ theme: nextTheme });
                }}
                className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer shadow-xs shrink-0"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>
            )}

            {/* Notification Bell with Unread Indicator */}
            <button
              onClick={onOpenNotifications}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors relative cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white dark:bg-[#1D1D1D] border border-black/5 dark:border-white/10 shadow-xs shrink-0"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F97316] rounded-full" />
              )}
            </button>

            {/* Direct Exit Demo Button for Visitors */}
            {isGuest && (
              <button
                type="button"
                onClick={() => setShowExitDemoConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                title="Exit Demo Mode"
                aria-label="Exit Demo"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Demo</span>
              </button>
            )}

            {/* User Profile Avatar (or Guest badge) - only way to Settings */}
            <button
              onClick={isGuest ? () => setShowGuestConfirm(true) : onNavigateToSettings}
              className={`relative cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full focus:outline-none shrink-0 ${
                isGuest ? 'hidden sm:inline-flex' : ''
              }`}
              aria-label="Open settings"
            >
              {isGuest ? (
                <span className="hidden sm:inline-block px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Guest
                </span>
              ) : user.avatarUrl && !avatarLoadFailed ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setAvatarLoadFailed(true)}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-black/5 dark:border-white/10 object-cover hover:ring-2 hover:ring-[#C6FF3D] transition-all"
                />
              ) : (
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#C6FF3D] text-[#0A0E1A] font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs border border-black/10 dark:border-white/10 hover:ring-2 hover:ring-[#C6FF3D] transition-all select-none"
                  title={user.name || user.email || 'User'}
                >
                  {getUserInitials(user.name, user.email)}
                </div>
              )}
            </button>
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={showGuestConfirm}
        onClose={() => setShowGuestConfirm(false)}
        onConfirm={createAccountFromGuest}
        title="Create a Real Account"
        message="Create a real account? Your demo data will be discarded."
        type="warning"
        confirmText="Create Account"
      />

      <ConfirmModal
        isOpen={showExitDemoConfirm}
        onClose={() => setShowExitDemoConfirm(false)}
        onConfirm={exitGuestMode}
        title="Exit Demo Mode"
        message="Are you sure you want to exit demo mode and return to the login screen?"
        type="warning"
        confirmText="Exit Demo"
      />
    </header>
  );
};
