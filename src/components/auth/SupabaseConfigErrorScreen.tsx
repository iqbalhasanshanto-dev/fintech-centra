import React from 'react';
import { AlertTriangle, KeyRound, Bot } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';
import { CornerGlow } from '../ui/CornerGlow';
import { useAuth } from '../../context/AuthContext';

export const SupabaseConfigErrorScreen: React.FC = () => {
  const { enterGuestMode } = useAuth();
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex items-center justify-center p-6 transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black">
      <CornerGlow />

      <div className="w-full max-w-md bg-white dark:bg-[#1D1D1D] rounded-[32px] p-8 sm:p-10 border border-black/5 dark:border-white/10 shadow-2xl animate-fade-in text-center z-10">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src={logoImg}
            alt="Centra"
            className="w-8 h-8 object-contain drop-shadow-sm select-none"
            draggable={false}
          />
          <span className="text-xl font-bold tracking-tight text-[#18212F] dark:text-white font-display">
            Centra
          </span>
        </div>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#18212F] dark:text-white mb-2">
          Configuration Required
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Centra requires a connected Supabase backend to authenticate users and sync data securely.
        </p>

        {/* Env instructions card */}
        <div className="bg-[#F7F8FA] dark:bg-[#262626] rounded-2xl p-4 border border-black/5 dark:border-white/5 text-left text-xs space-y-2 mb-6 font-mono text-gray-700 dark:text-gray-300">
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
            Configure these in your <code className="bg-gray-200 dark:bg-white/10 px-1 py-0.5 rounded">.env</code> file, then restart the application.
          </p>
        </div>

        {/* Development Fallback to Guest Mode */}
        {isDev && (
          <div className="pt-2">
            <button
              type="button"
              onClick={enterGuestMode}
              className="w-full py-4 px-6 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
            >
              <Bot className="w-4 h-4" />
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
