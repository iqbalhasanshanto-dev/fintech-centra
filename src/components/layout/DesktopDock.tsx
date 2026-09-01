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
        className="px-3 py-2 rounded-full bg-white/90 dark:bg-[#171717]/90 backdrop-blur-md border border-[#E5E5E5] dark:border-[#404040] shadow-xl flex items-center space-x-2 pointer-events-auto transition-colors"
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
                  ? 'bg-gradient-to-r from-[#2F6FED] to-[#16A34A] text-white dark:!bg-[#C6FF3D] dark:!text-[#171717] font-bold shadow-xs'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] font-medium'
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
