import React from 'react';
import { Home, PieChart, Target, SlidersHorizontal } from 'lucide-react';
import { TabType } from './BottomNav';

interface DesktopDockProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const DesktopDock: React.FC<DesktopDockProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'report', label: 'Analytics', icon: PieChart },
    { id: 'plan', label: 'Budgets', icon: Target },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center select-none pointer-events-none">
      <nav
        className="px-3 py-2 rounded-full bg-white/90 dark:bg-[#121A2C]/90 backdrop-blur-md border border-gray-200 dark:border-[#232C45] shadow-xl flex items-center space-x-2 pointer-events-auto transition-colors"
        aria-label="Desktop Navigation Dock"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold border border-brand-200/70 dark:border-brand-900/50 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1E293B] font-medium'
              }`}
              aria-label={tab.label}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
