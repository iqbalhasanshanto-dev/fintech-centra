import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Plus, X, Target, SlidersHorizontal, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useBackHandler } from '../../utils/backButton';

export type TabType = 'home' | 'report' | 'plan' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddAction: (tab?: 'spend' | 'income' | 'transfer' | 'goal' | 'budget') => void;
}

// Custom Nav Icons matching 08-home.png
const NavHomeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const NavAnalyticsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7.5" />
    <path d="M16.5 16.5L21 21" />
    <path d="M9 8.5L6.5 11 9 13.5" />
    <path d="M13 8.5L15.5 11 13 13.5" />
  </svg>
);

const NavBudgetsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <polyline points="3 3 3 8 8 8" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <polyline points="21 21 21 16 16 16" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddAction,
}) => {
  const [viewportBottom, setViewportBottom] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const menuCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const closeMenuSmooth = (callback?: () => void) => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current);
    }
    setIsMenuClosing(true);
    callback?.();
    menuCloseTimerRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      menuCloseTimerRef.current = null;
    }, 180);
  };

  const handleToggleMenu = () => {
    if (isMenuOpen && !isMenuClosing) {
      closeMenuSmooth();
    } else {
      if (menuCloseTimerRef.current) {
        clearTimeout(menuCloseTimerRef.current);
        menuCloseTimerRef.current = null;
      }
      setIsMenuClosing(false);
      setIsMenuOpen(true);
    }
  };

  const handleQuickAction = (action: 'income' | 'spend' | 'goal' | 'budget' | 'transfer') => {
    closeMenuSmooth(() => {
      onOpenAddAction(action);
    });
  };

  // Close floating menu on Android hardware back
  useBackHandler(isMenuOpen && !isMenuClosing, () => {
    closeMenuSmooth();
  });

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current) {
        clearTimeout(menuCloseTimerRef.current);
      }
    };
  }, []);

  // Lock background scrolling when quick action menu is open
  useEffect(() => {
    if (!isMenuOpen || isMenuClosing) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevDocOverflow;
    };
  }, [isMenuOpen, isMenuClosing]);

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
    { id: 'home', label: 'Home', icon: NavHomeIcon },
    { id: 'report', label: 'Analytics', icon: NavAnalyticsIcon },
    { id: 'plan', label: 'Budgets', icon: NavBudgetsIcon },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  const mainTabs = tabs.slice(0, 3); // Home, Analytics, Budgets
  const activeIndex = mainTabs.findIndex(t => t.id === activeTab);

  return (
    <>
      {/* Full-screen blurred backdrop when Floating '+' Quick Action Menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => closeMenuSmooth()}
          onTouchMove={e => e.preventDefault()}
          className={`fixed inset-0 backdrop-blur-md bg-black/50 z-40 transition-opacity duration-180 select-none touch-none ${
            isMenuClosing ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-fade-in pointer-events-auto'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Subtle Background Gradient Scrim behind the Floating Capsule Dock */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#F7F8FA] via-[#F7F8FA]/90 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-30 md:hidden ${
          isInputFocused ? 'hidden' : ''
        }`}
      />

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
          className="max-w-md mx-auto flex items-center justify-between gap-3 pointer-events-auto relative"
          aria-label="Main Navigation Bar"
        >
          {/* Floating Capsule Dock: Home, Analytics, Budgets */}
          <div className="relative flex-1 bg-white/95 dark:bg-[#1D1D1D]/95 backdrop-blur-md rounded-full border border-black/5 dark:border-white/10 p-1.5 shadow-xl">
            <div className="relative grid grid-cols-3 w-full items-center">
              {/* Sliding Active Tab Pill Indicator */}
              <div
                className={`absolute inset-y-0 left-0 w-1/3 rounded-full bg-[#18212F] dark:bg-[#C6FF3D] transition-transform transition-all duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] shadow-xs pointer-events-none ${
                  activeIndex >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{
                  transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
                }}
              />
              {mainTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`relative z-10 w-full min-h-[44px] px-2 py-1.5 rounded-full flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'text-white dark:text-[#0A0E1A] font-bold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
                    }`}
                    aria-label={tab.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating '+' Action Button with Quick Action Menu */}
          <div className="relative shrink-0">
            {/* Quick-Action Menu Popup (11-home-add-menu.png) */}
            {isMenuOpen && (
              <div
                className={`absolute bottom-16 right-0 mb-2 w-64 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.08] dark:border-white/[0.12] p-3 shadow-2xl z-50 flex flex-col gap-1 ${
                  isMenuClosing
                    ? 'transition-all duration-180 ease-out opacity-0 scale-90 translate-y-4 pointer-events-none'
                    : 'pointer-events-auto origin-bottom-right-spring'
                }`}
                role="menu"
                aria-label="Quick Actions"
              >
                <button
                  onClick={() => handleQuickAction('income')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#22C55E]/15 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Income</span>
                </button>

                <button
                  onClick={() => handleQuickAction('spend')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#F43F5E]/15 text-[#E11D48] dark:text-[#F43F5E] flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Spend</span>
                </button>

                <button
                  onClick={() => handleQuickAction('goal')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#F97316]/15 text-[#EA580C] dark:text-[#FB923C] flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Goals</span>
                </button>

                <button
                  onClick={() => handleQuickAction('budget')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] flex items-center justify-center shrink-0">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Budget</span>
                </button>

                <button
                  onClick={() => handleQuickAction('transfer')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Transfer</span>
                </button>
              </div>
            )}

            <button
              onClick={handleToggleMenu}
              className={`shrink-0 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full font-bold shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer ${
                isMenuOpen && !isMenuClosing
                  ? 'bg-white/90 dark:bg-[#262626] text-[#18212F] dark:text-white border border-black/10 dark:border-white/15'
                  : 'bg-[#C6FF3D] text-[#0A0E1A]'
              }`}
              aria-label="New Transaction, Transfer or Budget"
            >
              <Plus
                className={`w-6 h-6 stroke-[2.5] ${isMenuOpen && !isMenuClosing ? 'rotate-45' : 'rotate-0'}`}
                style={{
                  transform: isMenuOpen && !isMenuClosing ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};
