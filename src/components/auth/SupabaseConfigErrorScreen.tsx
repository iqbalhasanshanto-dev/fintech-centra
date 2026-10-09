import React from 'react';
import { AlertTriangle, KeyRound, Sparkles } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';
import { useAuth } from '../../context/AuthContext';

export const SupabaseConfigErrorScreen: React.FC = () => {
  const { enterGuestMode } = useAuth();
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#0D1220] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#1e263c] shadow-2xl animate-fade-in text-center">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src={logoImg}
            alt="Centra"
            className="w-8 h-8 object-contain drop-shadow-sm select-none"
            draggable={false}
          />
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white font-display">
            Centra
          </span>
        </div>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
          Configuration Required
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Centra requires a connected Supabase backend to authenticate users and sync data securely.
        </p>

        {/* Env instructions card */}
        <div className="bg-gray-50 dark:bg-[#131722] rounded-2xl p-4 border border-gray-200/80 dark:border-[#1e2638] text-left text-xs space-y-2 mb-6 font-mono text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-sans font-semibold text-[11px] uppercase tracking-wider mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Missing Environment Variables</span>
          </div>
          <p className="font-mono text-[11px] text-rose-500 dark:text-rose-400">
            • VITE_SUPABASE_URL
          </p>
          <p className="font-mono text-[11px] text-rose-500 dark:text-rose-400">
            • VITE_SUPABASE_ANON_KEY
          </p>
          <p className="font-sans text-[11px] text-gray-500 dark:text-gray-400 pt-1">
            Configure these in your <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">.env</code> file, then restart the application.
          </p>
        </div>

        {/* Development Fallback to Guest Mode */}
        {isDev && (
          <div className="pt-2">
            <button
              type="button"
              onClick={enterGuestMode}
              className="w-full py-3.5 px-4 rounded-full bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span>Explore Guest Mode (Dev Only)</span>
            </button>
            <p className="text-[10px] text-gray-400 mt-2">
              Guest mode stores demo data locally on this browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
