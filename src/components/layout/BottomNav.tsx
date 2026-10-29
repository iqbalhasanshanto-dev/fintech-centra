import React, { useState, useEffect } from 'react';
import { Home, PieChart, Plus, X, Target, SlidersHorizontal, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useBackHandler } from '../../utils/backButton';
import { useFinance } from '../../context/FinanceContext';

export type TabType = 'home' | 'report' | 'plan' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddAction: (tab?: 'spend' | 'income' | 'transfer' | 'goal' | 'budget') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddAction,
}) => {
  const finance = useFinance();
  const hasMultipleAccounts = (finance?.accounts?.length ?? 0) >= 2;

  const [viewportBottom, setViewportBottom] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close floating menu on Android hardware back
  useBackHandler(isMenuOpen, () => setIsMenuOpen(false));

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
    <>
      {/* Full-screen blurred backdrop when Floating '+' Quick Action Menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 backdrop-blur-md bg-black/50 z-40 animate-fade-in pointer-events-auto select-none"
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
                      ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold shadow-xs'
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

          {/* Floating '+' Action Button with Quick Action Menu */}
          <div className="relative shrink-0">
            {/* Quick-Action Menu Popup (11-home-add-menu.png) */}
            {isMenuOpen && (
              <div
                className="absolute bottom-16 right-0 mb-2 w-64 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.08] dark:border-white/[0.12] p-3 shadow-2xl z-50 flex flex-col gap-1 pointer-events-auto animate-scale-in"
                role="menu"
                aria-label="Quick Actions"
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAddAction('income');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#22C55E]/15 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Income</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAddAction('spend');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#F43F5E]/15 text-[#E11D48] dark:text-[#F43F5E] flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Spend</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAddAction('goal');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#F97316]/15 text-[#EA580C] dark:text-[#FB923C] flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Goals</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAddAction('budget');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <div className="w-9 h-9 rounded-full bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] flex items-center justify-center shrink-0">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#18212F] dark:text-white">Budget</span>
                </button>

                {hasMultipleAccounts && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAddAction('transfer');
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-[#18212F] dark:text-white">Transfer</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className={`shrink-0 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full font-bold shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer ${
                isMenuOpen
                  ? 'bg-white/90 dark:bg-[#262626] text-[#18212F] dark:text-white border border-black/10 dark:border-white/15'
                  : 'bg-[#C6FF3D] text-[#0A0E1A]'
              }`}
              aria-label="New Transaction, Transfer or Budget"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Plus className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};
