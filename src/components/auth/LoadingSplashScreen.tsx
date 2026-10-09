import React from 'react';
import logoImg from '../../assets/brand/logo.png';
import { Loader2 } from 'lucide-react';

export const LoadingSplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 transition-colors">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#131722] p-2.5 shadow-xl border border-gray-200/80 dark:border-[#1e2638] flex items-center justify-center">
            <img
              src={logoImg}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none"
              draggable={false}
            />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
          Centra
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
          <span>Starting Centra...</span>
        </div>
      </div>
    </div>
  );
};
