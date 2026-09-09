import React from 'react';
import { ArrowUpRight, TrendingUp, PieChart, Sparkles, Shield, ArrowUp } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';

interface IntroScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="w-full flex flex-col justify-between min-h-full py-6 px-4 sm:px-8">
      {/* Top Header with Brand Logo */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <img
            src={logoImg}
            alt="Centra"
            className="w-9 h-9 object-contain drop-shadow-sm select-none"
            draggable={false}
          />
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
            Centra
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.12] mb-3">
          Money that <br className="hidden sm:inline" />
          works for you
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 font-normal max-w-md leading-relaxed">
          Centra unifies your spending, budgets, and financial insights into a single intelligent dashboard.
        </p>
      </div>

      {/* Product Visual: Sleek Personal Finance Dashboard Card / Analytics Preview (NO credit cards) */}
      <div className="my-6 sm:my-8 w-full flex items-center justify-center">
        <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 bg-gradient-to-b from-[#131722] via-[#0f131d] to-[#0a0d14] border border-[#1e2638] shadow-2xl shadow-black/40 overflow-hidden text-white group">
          {/* Ambient glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top widget row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Financial Health
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +18.4% this month
            </span>
          </div>

          {/* Balance Tracker Display */}
          <div className="mb-5">
            <span className="text-xs text-gray-400 font-medium block">Net Savings Rate</span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5 flex items-baseline gap-1">
              <span>92.4</span>
              <span className="text-emerald-400 text-2xl font-bold">%</span>
              <span className="text-xs text-gray-400 font-normal ml-2">Score: Excellent</span>
            </div>
          </div>

          {/* Dynamic Visual: Multi-category Spend Distribution Bars */}
          <div className="space-y-2.5 pt-1 pb-3 border-y border-[#1e2638]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Budget Allocation
              </span>
              <span className="text-gray-400 font-semibold">Under Budget</span>
            </div>
            <div className="w-full h-3 bg-[#1e2638] rounded-full overflow-hidden flex gap-1 p-0.5">
              <div className="h-full bg-teal-400 rounded-full w-[45%]" />
              <div className="h-full bg-emerald-400 rounded-full w-[30%]" />
              <div className="h-full bg-amber-400 rounded-full w-[15%]" />
              <div className="h-full bg-indigo-400 rounded-full w-[10%]" />
            </div>
          </div>

          {/* Bottom Breakdown stats */}
          <div className="grid grid-cols-3 gap-2 pt-3 text-center">
            <div className="bg-[#1a2030]/70 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">Tracking</span>
              <span className="text-xs font-bold text-teal-300 flex items-center justify-center gap-0.5 mt-0.5">
                <PieChart className="w-3 h-3" /> Real-time
              </span>
            </div>
            <div className="bg-[#1a2030]/70 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">Security</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <Shield className="w-3 h-3" /> Encrypted
              </span>
            </div>
            <div className="bg-[#1a2030]/70 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">Insights</span>
              <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-0.5 mt-0.5">
                <Sparkles className="w-3 h-3" /> Automated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Area */}
      <div className="w-full max-w-md mx-auto space-y-3.5 pt-2">
        <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed px-4">
          By proceeding, you confirm that you have read and fully agree to the{' '}
          <span className="underline underline-offset-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
            Terms of Service
          </span>{' '}
          and{' '}
          <span className="underline underline-offset-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
            Privacy Policy
          </span>{' '}
          outlined on our website.
        </p>

        {/* Primary Get Started Button */}
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Get Started</span>
          <ArrowUpRight className="w-5 h-5" />
        </button>

        {/* Secondary Sign In Button */}
        <button
          type="button"
          onClick={onSignIn}
          className="w-full py-3.5 px-6 rounded-full bg-gray-100 dark:bg-[#131722] text-gray-800 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-[#1e2638] active:scale-[0.99] transition-all cursor-pointer text-center"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
