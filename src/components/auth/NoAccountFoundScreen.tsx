import React from 'react';
import { UserX, ArrowRight, LogOut } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';
import { CornerGlow } from '../ui/CornerGlow';
import { useAuth } from '../../context/AuthContext';

export const NoAccountFoundScreen: React.FC = () => {
  const { setAuthView, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex items-center justify-center p-6 transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black">
      <CornerGlow />

      <div className="w-full max-w-md bg-white dark:bg-[#1D1D1D] rounded-[32px] p-8 sm:p-10 border border-black/5 dark:border-white/10 shadow-2xl animate-fade-in text-center z-10">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src={logoImg}
            alt="Centra"
            className="w-8 h-8 object-contain drop-shadow-sm select-none rounded-xl"
            draggable={false}
          />
          <span className="text-xl font-bold tracking-tight text-[#18212F] dark:text-white font-display">
            Centra
          </span>
        </div>

        {/* User Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <UserX className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#18212F] dark:text-white mb-2">
          No Centra account found
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
          We couldn't find an existing Centra account for this login. Would you like to create a new account or sign in with a different account?
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setAuthView('onboarding')}
            className="w-full py-4 px-6 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Create account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-3.5 px-4 rounded-full bg-[#E8ECEF] dark:bg-[#262626] hover:opacity-85 text-[#18212F] dark:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Use a different account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
