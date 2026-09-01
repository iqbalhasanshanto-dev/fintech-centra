import React, { useState } from 'react';
import { Bell, ChevronDown, Check, Shield, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { PeriodFilter } from '../../types';
import { ThemeToggle } from '../ui/ThemeToggle';

interface HeaderProps {
  onOpenNotifications: () => void;
  onNavigateToSettings: () => void;
  onOpenAddAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onNavigateToSettings,
  onOpenAddAction,
}) => {
  const { periodFilter, setPeriodFilter, unreadNotificationsCount } = useFinance();
  const { user, isGuest } = useAuth();
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  const currentPeriodLabel = periods.find(p => p.id === periodFilter)?.label || 'This Month';

  return (
    <header id="header" className="border-b border-gray-200 dark:border-[#232C45] bg-white/80 dark:bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-40 transition-colors w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo & Wordmark (Visible on mobile/tablet below lg where sidebar is hidden) */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-white fill-white/20" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">CENTRA</span>
        </div>

        {/* Desktop left header spacer or page indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Live Financial Sync</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Period Selector Dropdown (Desktop & Tablet) */}
          <div className="relative hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center bg-gray-100 dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-full px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
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
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#121A2C] rounded-xl shadow-2xl border border-gray-200 dark:border-[#232C45] py-1.5 z-50 animate-fade-in">
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
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
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
          <div className="flex items-center gap-3 sm:gap-4 border-l border-gray-200 dark:border-[#232C45] pl-3 sm:pl-4">
            {/* Theme Toggle Switch */}
            <ThemeToggle showLabel={false} />

            {/* Notification Bell with Unread Indicator */}
            <button
              onClick={onOpenNotifications}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121A2C]"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>

            {/* User Profile Avatar (or Guest badge) */}
            <button
              onClick={onNavigateToSettings}
              className="relative cursor-pointer flex items-center gap-2"
              aria-label="Open user settings"
            >
              {isGuest ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300/60 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Guest
                </span>
              ) : (
                <img
                  src={user.avatarUrl || "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg"}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-[#232C45] object-cover hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
