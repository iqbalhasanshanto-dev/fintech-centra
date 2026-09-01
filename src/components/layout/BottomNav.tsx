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
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-[#121A2C]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#232C45] px-3 py-1.5 md:hidden shadow-lg select-none">
      {/* Mobile Bottom Fixed Nav Bar */}
      <nav 
        className="max-w-md mx-auto flex items-center justify-between"
        aria-label="Main Navigation Bar"
      >
        {/* Left Nav Pair: Home & Analytics */}
        <div className="flex items-center justify-around flex-1">
          {tabs.slice(0, 2).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[44px] min-w-[48px] px-3 py-1.5 rounded-xl flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? 'text-brand-600 dark:!text-[#171717] font-bold bg-brand-50 dark:!bg-[#C6FF3D]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A233A]'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Primary '+' Action Button */}
        <div className="px-2">
          <button
            onClick={onOpenAddAction}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-brand-600 dark:!bg-[#C6FF3D] text-white dark:!text-[#171717] font-bold shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
            aria-label="New Transaction or Transfer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Nav Pair: Budgets & Settings */}
        <div className="flex items-center justify-around flex-1">
          {tabs.slice(2, 4).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[44px] min-w-[48px] px-3 py-1.5 rounded-xl flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? 'text-brand-600 dark:!text-[#171717] font-bold bg-brand-50 dark:!bg-[#C6FF3D]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A233A]'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

      </nav>
    </div>
  );
};
