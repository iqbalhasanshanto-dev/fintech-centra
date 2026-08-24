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
      <div className="px-4 pb-4 pt-3">
        <div className="relative w-full h-[64px] filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
          {/* SVG Arched & Notched Dock Background */}
          <svg
            viewBox="0 0 360 64"
            fill="none"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path
              d="M 22 0 
                 L 138 0 
                 C 150 0, 154 28, 180 28 
                 C 206 28, 210 0, 222 0 
                 L 338 0 
                 A 22 22 0 0 1 360 22 
                 L 360 42 
                 A 22 22 0 0 1 338 64 
                 L 22 64 
                 A 22 22 0 0 1 0 42 
                 L 0 22 
                 A 22 22 0 0 1 22 0 Z"
              className="fill-white/95 dark:fill-[#131722]/95 stroke-gray-200/90 dark:stroke-[#1e2638] transition-colors"
              strokeWidth="1.5"
            />
          </svg>

          {/* Floating Centered '+' Button sitting inside the circular notch cutout */}
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-20 pointer-events-auto">
            <button
              onClick={onOpenAddAction}
              className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white shadow-float hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-brand-400/40"
              aria-label="Add transaction, transfer, or goal"
            >
              <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Nav Items Container */}
          <nav className="relative z-10 w-full h-full flex items-center justify-between px-2 pointer-events-auto">
            {/* Left Pair: Home & Report */}
            <div className="flex-1 flex items-center justify-around pr-4">
              {/* Home */}
              <button
                onClick={() => onSelectTab('home')}
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  activeTab === 'home'
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-gray-400 dark:text-[#64748b] hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                aria-label="Home"
              >
                <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
              </button>

              {/* Report */}
              <button
                onClick={() => onSelectTab('report')}
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  activeTab === 'report'
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-gray-400 dark:text-[#64748b] hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                aria-label="Report"
              >
                <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'report' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">Report</span>
              </button>
            </div>

            {/* Middle Spacer for the notch cutout */}
            <div className="w-12 h-full shrink-0" aria-hidden="true" />

            {/* Right Pair: Plan & Settings */}
            <div className="flex-1 flex items-center justify-around pl-4">
              {/* Plan */}
              <button
                onClick={() => onSelectTab('plan')}
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  activeTab === 'plan'
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-gray-400 dark:text-[#64748b] hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                aria-label="Plan"
              >
                <Target className={`w-5 h-5 transition-transform ${activeTab === 'plan' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">Plan</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => onSelectTab('settings')}
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  activeTab === 'settings'
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-gray-400 dark:text-[#64748b] hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                aria-label="Settings"
              >
                <SlidersHorizontal className={`w-5 h-5 transition-transform ${activeTab === 'settings' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">Settings</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};
