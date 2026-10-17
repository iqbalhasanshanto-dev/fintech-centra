import React, { useState, useContext } from 'react';
import { CloudOff, RefreshCw, LogOut } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';
import { AuthContext } from '../../context/AuthContext';

export interface SyncRetryScreenProps {
  onRetry: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
}

export const SyncRetryScreen: React.FC<SyncRetryScreenProps> = ({ onRetry, onSignOut }) => {
  const auth = useContext(AuthContext);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    } else if (auth?.logout) {
      await auth.logout();
    }
  };

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

        {/* Alert Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <CloudOff className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
          Unable to Sync Data
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
          We couldn't connect to download your financial data from the server. Check your network connection and try again.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3.5 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying Sync...' : 'Retry Sync'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 px-6 rounded-full border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-[#151D2E] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out instead</span>
          </button>
        </div>
      </div>
    </div>
  );
};
