import React from 'react';
import logoImg from '../../assets/brand/logo.png';
import { Loader2 } from 'lucide-react';
import { CornerGlow } from '../ui/CornerGlow';

export const LoadingSplashScreen: React.FC = () => {
  return (
    <div className="relative overflow-hidden min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 transition-colors select-none">
      <CornerGlow />
      <div className="flex flex-col items-center gap-4 animate-fade-in relative z-10">
        <div className="relative flex items-center justify-center">
          <div className="w-18 h-18 rounded-3xl bg-white dark:bg-[#1D1D1D] p-3 shadow-2xl border border-black/5 dark:border-white/10 flex items-center justify-center">
            <img
              src={logoImg}
              alt="Centra"
              className="w-12 h-12 object-contain drop-shadow-sm select-none"
              draggable={false}
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
          Centra
        </h1>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#18212F] dark:text-[#C6FF3D]" />
          <span>Starting Centra...</span>
        </div>
      </div>
    </div>
  );
};
