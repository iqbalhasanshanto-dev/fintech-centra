import React from 'react';
import { Home, PieChart, Plus, Target, SlidersHorizontal } from 'lucide-react';

export type TabType = 'home' | 'report' | 'plan' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddAction,
}) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Analytics', icon: PieChart },
    { id: 'plan', label: 'Budgets', icon: Target },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] sm:max-w-md pointer-events-none select-none">
      {/* Glassmorphic Unified Floating Bottom Dock */}
      <nav 
        className="relative px-4 sm:px-6 py-2.5 rounded-full bg-white/90 dark:bg-[#161B26]/80 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-xl dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex items-center justify-between space-x-2 sm:space-x-4 pointer-events-auto"
        aria-label="Main Navigation Dock"
      >
        {/* Left Nav Pair: Home & Analytics */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {tabs.slice(0, 2).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative px-3 sm:px-3.5 py-1.5 rounded-full flex flex-col items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60'
                    : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-800 dark:hover:text-[#E2E8F0] hover:bg-gray-100/60 dark:hover:bg-white/5'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Elevated Raised '+' Action Button (Clean Indigo Primary CTA) */}
        <div className="relative -top-3 px-1">
          <button
            onClick={onOpenAddAction}
            className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-md border-2 border-white dark:border-[#161B26] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="New Transaction or Transfer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Nav Pair: Budgets & Settings */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {tabs.slice(2, 4).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative px-3 sm:px-3.5 py-1.5 rounded-full flex flex-col items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60'
                    : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-800 dark:hover:text-[#E2E8F0] hover:bg-gray-100/60 dark:hover:bg-white/5'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

      </nav>
    </div>
  );
};
