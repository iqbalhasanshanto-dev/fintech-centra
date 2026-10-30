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
      className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 select-none"
      style={{
        paddingTop: 'calc(1.5rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
        paddingLeft: 'calc(1.5rem + env(safe-area-inset-left, var(--safe-area-inset-left, 0px)))',
        paddingRight: 'calc(1.5rem + env(safe-area-inset-right, var(--safe-area-inset-right, 0px)))',
      }}
    >
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1D1D1D] p-2.5 shadow-xl border border-black/5 dark:border-white/10 flex items-center justify-center mb-3">
        <img
          src={logoImg}
          alt="Centra"
          className="w-10 h-10 object-contain drop-shadow-sm select-none rounded-xl"
          draggable={false}
        />
      </div>
      <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
        Centra
      </span>
    </div>
  );
};
