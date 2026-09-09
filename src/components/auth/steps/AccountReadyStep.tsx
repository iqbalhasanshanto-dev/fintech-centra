import React, { useEffect } from 'react';
import { CentraLogo } from '../CentraLogo';

interface AccountReadyStepProps {
  onComplete: () => void;
}

export const AccountReadyStep: React.FC<AccountReadyStepProps> = ({ onComplete }) => {
  useEffect(() => {
    // Auto-navigate to dashboard after 2.4 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] sm:min-h-[80vh] w-full px-4 text-center select-none">
      {/* Animated Centra Brand Icon & Typography */}
      <div className="flex flex-col items-center justify-center space-y-4 mb-8">
        <div className="relative">
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/30 via-teal-400/30 to-amber-300/30 blur-2xl animate-pulse" />
          <div className="transform hover:scale-105 transition-transform duration-500 animate-bounce">
            <CentraLogo size="xl" showGlow />
          </div>
        </div>

        {/* Brand Name with subtle shimmer animation */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white">
          CENTRA
        </h2>
      </div>

      {/* Title matching user prompt and reference image 9 */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
        Your account is ready
      </h1>

      {/* Subtext with animated dots */}
      <div className="flex items-center justify-center gap-1.5 text-base text-gray-400 dark:text-gray-500">
        <span>Setting things up for you</span>
        <span className="inline-flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '400ms' }} />
        </span>
      </div>

      {/* Subtle bottom progress spinner */}
      <div className="mt-8 w-44 h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 via-emerald-500 to-amber-400 rounded-full animate-[shimmer_1.5s_infinite] w-full" />
      </div>

      {/* Instant access button */}
      <div className="mt-8 w-full max-w-xs">
        <button
          type="button"
          onClick={onComplete}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer"
        >
          Open Dashboard →
        </button>
      </div>
    </div>
  );
};
