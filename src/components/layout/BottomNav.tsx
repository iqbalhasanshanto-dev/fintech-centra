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
      {/* Carbon Unified Floating Bottom Dock */}
      <nav 
        className="relative px-4 sm:px-6 py-2.5 rounded-full bg-[#171717]/90 backdrop-blur-md border border-gray-800 shadow-2xl flex items-center justify-between space-x-2 sm:space-x-4 pointer-events-auto"
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
                    ? 'text-indigo-400 font-bold bg-gray-800/80'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
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
            className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold shadow-lg border-2 border-[#171717] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    ? 'text-indigo-400 font-bold bg-gray-800/80'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
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
