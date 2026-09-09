import React from 'react';
import { ArrowLeft, Moon, Sun, TrendingUp, Sparkles } from 'lucide-react';
import { CentraLogo } from '../CentraLogo';

interface ThemeSelectionStepProps {
  selectedTheme: 'dark' | 'light';
  onSelectTheme: (theme: 'dark' | 'light') => void;
  onBack: () => void;
  onContinue: () => void;
}

export const ThemeSelectionStep: React.FC<ThemeSelectionStepProps> = ({
  selectedTheme,
  onSelectTheme,
  onBack,
  onContinue,
}) => {
  const isDark = selectedTheme === 'dark';

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
            Step 4/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 80% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-300 w-[80%]" />
        </div>

        {/* Headings matching reference image 6 */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Choose your theme
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Pick the theme that matches your style. You can change this anytime.
          </p>
        </div>

        {/* Main Theme Live Preview Area (Structured like Reference Image 6) */}
        <div className="w-full max-w-sm mx-auto my-4">
          <div
            onClick={() => onSelectTheme(isDark ? 'light' : 'dark')}
            className={`w-full rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-2xl cursor-pointer border relative overflow-hidden select-none ${
              isDark
                ? 'bg-[#0b0d14] border-[#1e2638] text-white shadow-black/60 ring-2 ring-white/20'
                : 'bg-white border-gray-200 text-gray-900 shadow-gray-200/80 ring-2 ring-black/10'
            }`}
          >
            {/* Top brand & indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CentraLogo size="sm" />
                <span className="text-xs font-bold tracking-wider uppercase">Centra App</span>
              </div>
              <span
                className={`p-1.5 rounded-full ${
                  isDark ? 'bg-[#131722] text-amber-400' : 'bg-gray-100 text-indigo-600'
                }`}
              >
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </span>
            </div>

            {/* Mini Dashboard Content */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Overview Balance
                </span>
                <div className="text-2xl font-extrabold tracking-tight">৳64,250.00</div>
              </div>

              {/* Mini Sparkline Bar Grid */}
              <div className="flex items-end gap-1.5 h-10 pt-1 border-b border-gray-100 dark:border-white/10 pb-2">
                {[40, 65, 55, 80, 70, 95, 85].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-xs transition-all ${
                      i === 5
                        ? isDark
                          ? 'bg-emerald-400 shadow-sm'
                          : 'bg-indigo-600 shadow-sm'
                        : isDark
                        ? 'bg-[#1e2638]'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Sample Transaction Row */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#131722] border-[#1e2638]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    🛒
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">Groceries</p>
                    <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Today, 2:30 PM</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-500">-৳1,240</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Title, Description & Radio Dots matching reference image 6 */}
        <div className="text-center mt-6 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isDark ? 'Centra Dark' : 'Centra Light'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {isDark
                ? 'A sleek, clean matte-dark design built for everyday spending needs.'
                : 'A crisp, clean daylight minimalist layout with high contrast.'}
            </p>
          </div>

          {/* 3 Selector Dots matching reference image 6 */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {/* Dark Mode Dot */}
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isDark ? 'ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-[#0b0d14]' : 'opacity-70 hover:opacity-100'
              }`}
              title="Dark Mode"
            >
              <div className="w-7 h-7 rounded-full bg-[#0b0d14] border border-gray-600 flex items-center justify-center shadow-md">
                <Moon className="w-3.5 h-3.5 text-white" />
              </div>
            </button>

            {/* Light Mode Dot */}
            <button
              type="button"
              onClick={() => onSelectTheme('light')}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                !isDark ? 'ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-[#0b0d14]' : 'opacity-70 hover:opacity-100'
              }`}
              title="Light Mode"
            >
              <div className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md">
                <Sun className="w-3.5 h-3.5 text-gray-800" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-8">
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer text-center"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
