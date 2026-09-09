import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SpendingCategoriesScreenProps {
  onBack: () => void;
  onFinish: (selectedCategories: string[]) => void;
}

const AVAILABLE_CATEGORIES = [
  'Groceries',
  'Food & Drinks',
  'Bills & Utilities',
  'Shopping',
  'Travel',
  'Entertainment',
  'Work & Freelance',
  'Transport',
  'Subscriptions',
];

export const SpendingCategoriesScreen: React.FC<SpendingCategoriesScreenProps> = ({
  onBack,
  onFinish,
}) => {
  const { saveOnboardingProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>(['Shopping', 'Entertainment']);

  const toggleCategory = (cat: string) => {
    setSelected(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleFinish = async () => {
    // Skipping or choosing does not block progress
    await saveOnboardingProfile({
      name: '',
      categories: selected,
    });
    onFinish(selected);
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-full py-4 px-4 sm:px-8">
      {/* Top Header & Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
            Step 5/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 100% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 w-[100%]" />
        </div>

        {/* Headings matching reference image 8 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Choose spending categories
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            We'll tailor insights based on what matters to you.
          </p>
        </div>

        {/* Staggered category pill tags matching reference image 8 */}
        <div className="flex flex-wrap gap-3 sm:gap-3.5 my-8 items-center justify-start sm:justify-center max-w-md mx-auto">
          {AVAILABLE_CATEGORIES.map(category => {
            const isSelected = selected.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`py-3 px-5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/25 dark:shadow-white/10 scale-105 ring-2 ring-black dark:ring-white'
                    : 'bg-white text-gray-600 dark:bg-[#131722] dark:text-gray-400 border border-gray-200 dark:border-[#232c44] hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                <span>{category}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
          You can change these anytime in Settings.
        </p>
      </div>

      {/* Bottom Finish Setup Button matching reference */}
      <div className="pt-8">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Finish setup</span>
        </button>
      </div>
    </div>
  );
};
