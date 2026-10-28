import React, { useState, useEffect } from 'react';
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
  const [viewportBottom, setViewportBottom] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const isFormField = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.getAttribute('contenteditable') === 'true';
    };

    const handleFocusIn = () => {
      if (isFormField(document.activeElement)) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (!isFormField(document.activeElement)) {
          setIsInputFocused(false);
        }
      }, 50);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const updatePosition = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height)));
      setViewportBottom(prev => (prev !== offset ? offset : prev));
    };

    window.visualViewport.addEventListener('resize', updatePosition);
    window.visualViewport.addEventListener('scroll', updatePosition);

    return () => {
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
    };
  }, []);

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Analytics', icon: PieChart },
    { id: 'plan', label: 'Budgets', icon: Target },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  const mainTabs = tabs.slice(0, 3); // Home, Analytics, Budgets

  return (
    <div 
      className={`fixed left-0 right-0 z-40 w-full px-4 select-none md:hidden pointer-events-none ${isInputFocused ? 'hidden' : ''}`}
      style={{
        bottom: `${isInputFocused ? 0 : viewportBottom}px`,
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, var(--safe-area-inset-left, 0px)))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, var(--safe-area-inset-right, 0px)))',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    >
      {/* Floating Bottom Nav Container */}
      <nav 
        className="max-w-md mx-auto flex items-center justify-between gap-3 pointer-events-auto"
        aria-label="Main Navigation Bar"
      >
        {/* Floating Capsule Dock: Home, Analytics, Budgets */}
        <div className="flex-1 flex items-center justify-between bg-white/95 dark:bg-[#1D1D1D]/95 backdrop-blur-md rounded-full border border-black/5 dark:border-white/10 p-1.5 shadow-xl">
          {mainTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 min-h-[44px] px-2 py-1.5 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#171717] font-bold shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separate Floating Circular '+' Action Button */}
        <button
          onClick={onOpenAddAction}
          className="shrink-0 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#171717] font-bold shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
          aria-label="New Transaction, Transfer or Budget"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </nav>
    </div>
  );
};
