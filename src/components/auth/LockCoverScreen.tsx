import React from 'react';
import logoImg from '../../assets/brand/logo.png';

/**
 * Opaque cover screen rendered instead of financial screens when the app
 * is backgrounded or during the resume lock evaluation frame.
 */
export const LockCoverScreen: React.FC = () => {
  return (
    <div
      data-testid="lock-cover-screen"
      className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#131722] p-2.5 shadow-xl border border-gray-200/80 dark:border-[#1e2638] flex items-center justify-center mb-3">
        <img
          src={logoImg}
          alt="Centra"
          className="w-10 h-10 object-contain drop-shadow-sm select-none"
          draggable={false}
        />
      </div>
      <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
        Centra
      </span>
    </div>
  );
};
