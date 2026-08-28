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
    <header id="header" className="border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white fill-white/20" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CENTRA</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-6">
          
          {/* Period Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center bg-gray-900 border border-gray-800 rounded-full px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              aria-expanded={showPeriodDropdown}
            >
              <span>{currentPeriodLabel}</span>
              <ChevronDown className={`ml-2 w-3 h-3 text-gray-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-[#171717] rounded-xl shadow-2xl border border-gray-800 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Select Period
                  </div>
                  {periods.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPeriodFilter(p.id);
                        setShowPeriodDropdown(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <span>{p.label}</span>
                      {periodFilter === p.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-4 border-l border-gray-800 pl-4 sm:pl-6">
            {/* Privacy Mask Toggle */}
            <button
              onClick={togglePrivacy}
              className="text-gray-400 hover:text-white transition-colors"
              title={settings.privacyMode ? "Disable Privacy Mask" : "Enable Privacy Mask"}
              aria-label="Toggle privacy mask"
            >
              {settings.privacyMode ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-gray-400 hover:text-white transition-colors"
              title={settings.theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Notification Bell with Red Dot */}
            <button
              onClick={onOpenNotifications}
              className="text-gray-400 hover:text-white transition-colors relative"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={onNavigateToSettings}
              className="relative cursor-pointer"
              aria-label="Open user settings"
            >
              <img
                src={user.avatarUrl || "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg"}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-gray-700 object-cover hover:border-gray-500 transition-colors"
              />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
