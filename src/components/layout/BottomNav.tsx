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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] sm:max-w-md pointer-events-none select-none md:hidden">
      {/* Mobile Unified Floating Bottom Dock */}
      <nav 
        className="relative px-4 sm:px-6 py-2.5 rounded-full bg-white/90 dark:bg-[#121A2C]/90 backdrop-blur-md border border-gray-200 dark:border-[#232C45] shadow-2xl flex items-center justify-between space-x-2 sm:space-x-4 pointer-events-auto transition-colors"
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
                    ? 'text-brand-600 dark:text-brand-400 font-bold bg-gray-100 dark:bg-[#0A0E1A]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Primary '+' Action Button */}
        <div className="relative -top-3 px-1">
          <button
            onClick={onOpenAddAction}
            className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold shadow-float border-2 border-white dark:border-[#121A2C] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
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
                    ? 'text-brand-600 dark:text-brand-400 font-bold bg-gray-100 dark:bg-[#0A0E1A]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
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
