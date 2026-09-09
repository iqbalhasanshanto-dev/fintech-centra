import React from 'react';
import { ArrowUpRight, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { CentraLogo } from '../CentraLogo';

interface IntroStepProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const IntroStep: React.FC<IntroStepProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="flex flex-col justify-between min-h-full w-full py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-6">
          <CentraLogo size="sm" showGlow />
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Centra
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-3">
          Money that <br className="hidden sm:inline" />
          works for you
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 font-normal max-w-md leading-relaxed">
          Centra consolidates your cards, spending, and finances into a single intelligent dashboard.
        </p>
      </div>

      {/* Product Visual: Sleek Personal Finance Dashboard Card / Preview (Not a card, finance tracker visual) */}
      <div className="my-8 sm:my-10 w-full flex items-center justify-center">
        <div className="relative w-full max-w-sm rounded-3xl p-6 bg-gradient-to-b from-[#131722] to-[#0b0d14] border border-[#1e2638] shadow-2xl shadow-black/40 overflow-hidden group">
          {/* Subtle ambient light effect */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top widget row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Balance
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +14.8%
            </span>
          </div>

          {/* Big Amount Display */}
          <div className="mb-5">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ৳128,450<span className="text-gray-400 text-2xl font-semibold">.00</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Across 4 connected accounts</p>
          </div>

          {/* Mini Sparkline Chart Preview */}
          <div className="h-14 w-full flex items-end gap-1.5 pt-2 pb-1 border-b border-[#1e2638]">
            {[35, 45, 40, 60, 52, 75, 68, 85, 92, 78, 95, 100].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-t-sm transition-all duration-500 ${
                  i === 11
                    ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-sm shadow-emerald-400/50'
                    : 'bg-[#1e2638] hover:bg-[#6366f1]/60'
                }`}
              />
            ))}
          </div>

          {/* Bottom Breakdown stats */}
          <div className="grid grid-cols-3 gap-2 pt-4 text-center">
            <div className="bg-[#1a2030]/60 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">Income</span>
              <span className="text-xs font-bold text-emerald-400">৳78,500</span>
            </div>
            <div className="bg-[#1a2030]/60 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">Spent</span>
              <span className="text-xs font-bold text-rose-400">৳24,120</span>
            </div>
            <div className="bg-[#1a2030]/60 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">Saved</span>
              <span className="text-xs font-bold text-indigo-400">৳54,380</span>
            </div>
          </div>

          {/* Floating badge */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 bg-[#0b0d14]/80 rounded-xl px-3 py-1.5 border border-white/5">
            <span className="flex items-center gap-1.5 text-gray-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Smart Budget on track
            </span>
            <span className="text-emerald-400 font-semibold">92%</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Area matching reference image 2 */}
      <div className="w-full max-w-md mx-auto space-y-4 pt-2">
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
