import React, { useState } from 'react';
import { AlertTriangle, X, CloudOff, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';

export const GuestBanner: React.FC = () => {
  const { isGuest, createAccountFromGuest, exitGuestMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Not a guest, or dismissed for this session — render nothing
  if (!isGuest || dismissed) return null;

  return (
    <>
      <div
        role="alert"
        className="w-full border border-amber-300/50 dark:border-amber-500/20 bg-amber-500/10 dark:bg-amber-950/20 rounded-2xl px-4 py-3 flex items-start gap-3 backdrop-blur-xs"
      >
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Guest Mode (Local Demo)
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
            Your data is stored <strong>only on this device</strong> and is not backed up to the
            cloud. Clearing browser data, reinstalling the app, or switching devices will
            permanently lose your data.{' '}
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="font-bold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors cursor-pointer"
            >
              Create account to enable cloud sync.
            </button>
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>

        {/* Dismiss (session-only) */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss guest banner"
          className="shrink-0 p-1 rounded-lg text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={createAccountFromGuest}
        title="Create a Real Account"
        message="Create a real account? Your demo data will be discarded."
        type="warning"
        confirmText="Create Account"
      />

      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={exitGuestMode}
        title="Exit Demo Mode"
        message="Are you sure you want to exit demo mode and return to the login screen?"
        type="warning"
        confirmText="Exit Demo"
      />
    </>
  );
};
