import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/brand/logo.png';

export const AccountReadyScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0d9488', '#14b8a6', '#5eead4', '#f59e0b', '#10b981'],
      });
    } catch {
      // Ignore if confetti fails in headless env
    }

    // Auto-navigate into Dashboard after ~1.5s
    const timer = setTimeout(() => {
      completeOnboarding();
    }, 1600);

    return () => clearTimeout(timer);
  }, [completeOnboarding]);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-full py-12 px-6 text-center animate-fade-in">
      {/* Centered Brand Mark & Animated Checkmark badge (NO credit card!) */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-teal-500/20 via-emerald-400/20 to-amber-300/15 blur-2xl -z-10 animate-pulse" />

        {/* Logo container */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-[#121826] border border-gray-200 dark:border-[#222c44] shadow-2xl flex items-center justify-center p-5 relative">
          <img
            src={logoImg}
            alt="Centra"
            className="w-full h-full object-contain select-none animate-bounce-subtle"
            draggable={false}
          />

          {/* Success Check Badge */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#121826]">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Headings matching reference image 7 */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
        Your account is ready
      </h1>
      <p className="text-base text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
        <span>Setting things up for you...</span>
      </p>
    </div>
  );
};
