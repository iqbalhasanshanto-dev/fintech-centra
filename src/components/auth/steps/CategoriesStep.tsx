import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CategoriesStepProps {
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  onBack: () => void;
  onFinish: () => void;
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
  'Health & Wellness',
  'Savings & Investments',
  'Personal Care',
];

export const CategoriesStep: React.FC<CategoriesStepProps> = ({
  selectedCategories,
  onToggleCategory,
  onBack,
  onFinish,
}) => {
  return (
    <div className="flex flex-col justify-between min-h-full w-full py-4 px-4 sm:px-6">
      {/* Top Section */}
      <div>
        {/* Progress Bar & Back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            Step 5/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 100% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-300 w-full" />
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

        {/* Pill/Chip Cloud matching reference image 8 */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 py-4 max-w-md mx-auto items-center justify-center sm:justify-start">
          {AVAILABLE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onToggleCategory(cat)}
                className={`px-5 py-3 rounded-full text-sm transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-lg shadow-black/25 scale-[1.03] ring-1 ring-black dark:ring-white'
                    : 'bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-700 dark:text-gray-300 font-medium hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-[#1e2638]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6">
          Optional • You can adjust and add categories at any time in Settings.
        </p>
      </div>

      {/* Bottom Button */}
      <div className="pt-8">
        <button
          type="button"
          onClick={onFinish}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer text-center"
        >
          Finish setup
        </button>
      </div>
    </div>
  );
};
