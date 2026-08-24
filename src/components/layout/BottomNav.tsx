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
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
      <div className="px-4 pb-4 pt-1">
        <nav className="pointer-events-auto relative flex items-center justify-between px-3 py-2 bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-xl rounded-full shadow-xl border border-gray-200/80 dark:border-gray-800 transition-colors">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'home'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Home"
          >
            <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </button>

          {/* Tab 2: Report */}
          <button
            onClick={() => onSelectTab('report')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'report'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Report"
          >
            <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'report' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Report</span>
          </button>

          {/* Floating Centered Plus Action Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              onClick={onOpenAddAction}
              className="group relative flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white shadow-float hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-brand-400/40"
              aria-label="Add transaction, transfer, or goal"
            >
              <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Tab 3: Plan */}
          <button
            onClick={() => onSelectTab('plan')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'plan'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Plan"
          >
            <Target className={`w-5 h-5 transition-transform ${activeTab === 'plan' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Plan</span>
          </button>

          {/* Tab 4: Settings */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'settings'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Settings"
          >
            <SlidersHorizontal className={`w-5 h-5 transition-transform ${activeTab === 'settings' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </button>

        </nav>
      </div>
    </div>
  );
};
