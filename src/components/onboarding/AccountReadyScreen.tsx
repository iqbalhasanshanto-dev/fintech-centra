import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/brand/logo.png';
import { CornerGlow } from '../ui/CornerGlow';

export const AccountReadyScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();

  useEffect(() => {
    // Launch celebratory confetti with brand neon-lime
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#C6FF3D', '#4D6E18', '#18212F', '#F59E0B', '#10B981'],
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
    <div className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col items-center justify-center relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black p-6">
      <CornerGlow />

      <div className="w-full max-w-md bg-white dark:bg-[#1D1D1D] rounded-[32px] p-8 sm:p-10 border border-black/5 dark:border-white/10 shadow-2xl flex flex-col items-center text-center animate-fade-in z-10">
        {/* Centered Brand Mark & Animated Checkmark badge */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#F7F8FA] dark:bg-[#262626] border border-black/5 dark:border-white/10 shadow-xl flex items-center justify-center p-5 relative">
            <img
              src={logoImg}
              alt="Centra"
              className="w-full h-full object-contain select-none animate-bounce-subtle"
              draggable={false}
            />

            {/* Success Check Badge in Neon Lime */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#C6FF3D] text-black flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1D1D1D]">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18212F] dark:text-white mb-2">
          Your account is ready
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#18212F] dark:text-[#C6FF3D]" />
          <span>Setting things up for you...</span>
        </p>
      </div>
    </div>
  );
};
