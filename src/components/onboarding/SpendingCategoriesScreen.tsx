import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoOnDark from '../../assets/brand/logo-on-dark.svg';
import logoOnLight from '../../assets/brand/logo-on-light.svg';
import { CornerGlow } from '../ui/CornerGlow';

interface SpendingCategoriesScreenProps {
  initialCategories?: string[];
  onDraftChange?: (patch: { selectedCategories: string[] }) => void;
  onBack: () => void;
  onFinish: (selectedCategories: string[]) => void;
}

const AVAILABLE_CATEGORIES = [
  'Groceries',
  'Shopping',
  'Transport',
  'Bills & Utilities',
  'Health & Wellness',
  'Entertainment',
  'Work & Freelance',
  'Savings & Investments',
  'Personal Care',
];

export const SpendingCategoriesScreen: React.FC<SpendingCategoriesScreenProps> = ({
  initialCategories,
  onDraftChange,
  onBack,
  onFinish,
}) => {
  const { user, saveOnboardingProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>(initialCategories || []);

  const toggleCategory = (cat: string) => {
    setSelected(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      onDraftChange?.({ selectedCategories: next });
      return next;
    });
  };

  const handleFinish = async () => {
    if (selected.length === 0) return;
    await saveOnboardingProfile({
      name: user?.name || '',
      categories: selected,
    });
    onFinish(selected);
  };

  return (
    <div
      className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col justify-between relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      <CornerGlow />

      <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto z-10 animate-fade-in">
        {/* Top Canvas Header: Separate Top Row (Back on left, Logo on right) */}
        <div className="px-6 pt-4 pb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-xs"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <img
              src={logoOnLight}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none rounded-xl dark:hidden"
              draggable={false}
            />
            <img
              src={logoOnDark}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none rounded-xl hidden dark:block"
              draggable={false}
            />
          </div>
        </div>

        {/* Elevated Bottom Sheet Card (07-onboarding-categories.png) */}
        <div className="w-full bg-white dark:bg-[#1D1D1D] rounded-t-[32px] md:rounded-[32px] border-t md:border border-black/5 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col transition-all">
          {/* Drag Handle */}
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-5" />

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18212F] dark:text-white mb-6">
            Choose spending<br />categories
          </h2>

          {/* Staggered category pill tags matching reference frames */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8 items-center justify-start">
            {AVAILABLE_CATEGORIES.map(category => {
              const isSelected = selected.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`min-h-[44px] py-2.5 px-5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer select-none flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] shadow-[0_0_16px_rgba(198,255,61,0.45)] border border-[#C6FF3D] scale-[1.03]'
                      : 'bg-[#F1F2F4] text-[#18212F] dark:bg-[#262626] dark:text-white hover:opacity-85 border border-transparent'
                  }`}
                >
                  <span>{category}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Finish Setup Button */}
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={handleFinish}
            className={`w-full py-4 px-6 rounded-full font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
              selected.length > 0
                ? 'bg-[#18212F] dark:bg-[#C6FF3D] text-white dark:text-[#0A0E1A] hover:opacity-90 active:scale-[0.99] cursor-pointer'
                : 'bg-gray-200 dark:bg-[#262626] text-gray-400 dark:text-gray-500 opacity-40 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Finish Setup ↗</span>
          </button>
        </div>
      </div>
    </div>
  );
};
