import React, { useState } from 'react';
import { ArrowLeft, Moon, Sun, TrendingUp, PieChart, Sparkles, Shield, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/brand/logo.png';

interface ThemeSelectionScreenProps {
  onBack: () => void;
  onContinue: (theme: 'dark' | 'light') => void;
}

export const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const { saveOnboardingProfile } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark');

  const handleSelectTheme = (theme: 'dark' | 'light') => {
    setSelectedTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleProceed = async () => {
    await saveOnboardingProfile({
      name: '',
      theme: selectedTheme,
    });
    onContinue(selectedTheme);
  };

  const isDark = selectedTheme === 'dark';

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
            Step 4/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 80% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 w-[80%]" />
        </div>

        {/* Headings */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Choose your theme
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Pick the interface look that matches your style. You can change this anytime.
          </p>
        </div>

        {/* Live Miniature Dashboard Preview in Selected Theme */}
        <div className="my-6 w-full flex items-center justify-center">
          <div
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl transition-all duration-300 ${
              isDark
                ? 'bg-[#111624] border-[#222c44] text-white shadow-black/50'
                : 'bg-white border-gray-200 text-gray-900 shadow-gray-200/80'
            }`}
          >
            {/* Miniature Dashboard Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={logoImg}
                  alt="Centra"
                  className="w-5 h-5 object-contain select-none"
                  draggable={false}
                />
                <span
                  className={`text-xs font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  CENTRA
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                ● Active
              </span>
            </div>

            {/* Miniature Balance Display */}
            <div className="mb-4">
              <span
                className={`text-[10px] font-medium block uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Total Net Worth
              </span>
              <div className="text-2xl font-extrabold tracking-tight mt-0.5 flex items-baseline gap-1">
                <span>$24,850</span>
                <span className="text-xs text-emerald-500 font-semibold">+12.4%</span>
              </div>
            </div>

            {/* Miniature Analytics Sparklines */}
            <div
              className={`h-12 w-full flex items-end gap-1.5 p-1 rounded-xl mb-3 ${
                isDark ? 'bg-[#0b0e17]' : 'bg-gray-50'
              }`}
            >
              {[40, 65, 50, 78, 62, 90, 85, 100].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-sm transition-all duration-300 ${
                    i === 7
                      ? 'bg-teal-500'
                      : isDark
                      ? 'bg-[#1f283d]'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Miniature Category Spend Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-2 rounded-xl text-left border ${
                  isDark
                    ? 'bg-[#171e2e] border-white/5'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <span className="text-[10px] text-gray-400 block">Monthly Budget</span>
                <span className="text-xs font-bold text-teal-400">74% Spent</span>
              </div>
              <div
                className={`p-2 rounded-xl text-left border ${
                  isDark
                    ? 'bg-[#171e2e] border-white/5'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <span className="text-[10px] text-gray-400 block">Savings Goal</span>
                <span className="text-xs font-bold text-emerald-400">$1,450/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Description */}
        <div className="text-center mb-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {isDark ? 'Centra Dark' : 'Centra Light'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1">
            {isDark
              ? 'A sleek, high-contrast matte dark theme built for focus and low-light comfort.'
              : 'A crisp, clean minimalist light theme with high legibility for daylight clarity.'}
          </p>
        </div>

        {/* Theme Selectors matching reference design circular swatches */}
        <div className="flex items-center justify-center gap-5 mb-4">
          {/* Dark Swatch */}
          <button
            type="button"
            onClick={() => handleSelectTheme('dark')}
            className={`flex flex-col items-center gap-1.5 p-1.5 rounded-2xl transition-all cursor-pointer ${
              isDark ? 'ring-2 ring-black dark:ring-white scale-105' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-black border-2 border-gray-600 flex items-center justify-center shadow-md">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-semibold text-gray-900 dark:text-white">Dark</span>
          </button>

          {/* Light Swatch */}
          <button
            type="button"
            onClick={() => handleSelectTheme('light')}
            className={`flex flex-col items-center gap-1.5 p-1.5 rounded-2xl transition-all cursor-pointer ${
              !isDark ? 'ring-2 ring-black dark:ring-white scale-105' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-md">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[11px] font-semibold text-gray-900 dark:text-white">Light</span>
          </button>
        </div>
      </div>

      {/* Bottom Continue Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleProceed}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue</span>
        </button>
      </div>
    </div>
  );
};
