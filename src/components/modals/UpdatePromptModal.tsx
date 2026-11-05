import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles } from 'lucide-react';
import { AppUpdateInfo, triggerSafeAppUpdate } from '../../utils/updateChecker';
import { useBackHandler } from '../../utils/backButton';

export interface UpdatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Close with hardware back button if not currently updating
  useBackHandler(isOpen && !isUpdating, onClose, 15);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevDocOverflow;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || isUpdating) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleLater();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUpdating, updateInfo]);

  if (!isOpen || !updateInfo) {
    return null;
  }

  const handleLater = () => {
    if (isUpdating) return;
    if (updateInfo.latestVersion && typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(`centra_dismissed_update_${updateInfo.latestVersion}`, '1');
    }
    onClose();
  };

  const handleUpdateNow = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await triggerSafeAppUpdate(updateInfo);
    } catch (err) {
      console.error('Failed to trigger update:', err);
    } finally {
      setIsUpdating(false);
      onClose();
    }
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, var(--safe-area-inset-left, 0px)))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right, var(--safe-area-inset-right, 0px)))',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleLater}
        onTouchMove={(e) => e.preventDefault()}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in z-[200] touch-none"
      />

      {/* Centered Modal Card */}
      <div className="relative z-[201] rounded-[32px] bg-white dark:bg-[#181818] border border-black/10 dark:border-white/12 p-6 shadow-2xl max-w-md w-full flex flex-col items-center text-center space-y-4 animate-scale-up text-gray-900 dark:text-white transition-all">
        {/* Close Button */}
        {!isUpdating && (
          <button
            type="button"
            onClick={handleLater}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 dark:bg-[#C6FF3D]/10 text-[#16A34A] dark:text-[#C6FF3D] flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            New Update Available
          </h3>
          {/* Version pill badge */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200">
              <span>v{updateInfo.installedVersion}</span>
              <span className="text-gray-400 dark:text-gray-500">→</span>
              <span className="text-[#16A34A] dark:text-[#C6FF3D] font-bold">
                v{updateInfo.latestVersion}
              </span>
            </span>
          </div>
        </div>

        {/* Reassurance badge */}
        <div className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#16A34A]/10 dark:bg-[#C6FF3D]/10 border border-[#16A34A]/20 dark:border-[#C6FF3D]/20 text-xs text-[#16A34A] dark:text-[#C6FF3D] font-medium text-left">
          <span className="font-bold text-sm leading-none shrink-0">✓</span>
          <span className="leading-snug">
            Your accounts, transactions, and login session will be preserved.
          </span>
        </div>

        {/* What's New List */}
        {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
          <div className="w-full text-left space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              What's New
            </p>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              {updateInfo.releaseNotes.map((note, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="text-[#16A34A] dark:text-[#C6FF3D] font-bold text-sm leading-none mt-0.5 shrink-0">
                    •
                  </span>
                  <span className="leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleLater}
            className="flex-1 py-3 px-4 min-h-[44px] rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-[#F1F2F4] dark:bg-[#262626] hover:bg-[#E5E7EB] dark:hover:bg-[#333333] transition-all cursor-pointer disabled:opacity-50"
          >
            Later
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleUpdateNow}
            className="flex-1 py-3 px-4 min-h-[44px] rounded-full text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md bg-[#C6FF3D] hover:bg-[#b8f52e] text-[#0A0E1A] shadow-[#C6FF3D]/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing &amp; Updating...</span>
              </>
            ) : (
              <span>Update Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};

