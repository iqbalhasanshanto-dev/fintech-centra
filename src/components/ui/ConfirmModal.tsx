import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useBackHandler } from '../../utils/backButton';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isAlertOnly?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isAlertOnly = false,
}) => {
  // Register with hardware back button (priority 10 so it closes before any underlying modal)
  useBackHandler(isOpen, onClose, 10);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (onConfirm && !isAlertOnly) {
          onConfirm();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isAlertOnly]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      default:
        return <Info className="w-6 h-6 text-brand-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20';
      default:
        return 'bg-black dark:bg-white text-white dark:text-black shadow-black/20 dark:shadow-white/10';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, var(--safe-area-inset-left, 0px)))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right, var(--safe-area-inset-right, 0px)))',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Dialog card */}
      <div className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/5 dark:border-white/10 p-6 shadow-2xl animate-scale-up text-gray-900 dark:text-white transition-all">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-black/5 dark:border-white/10">
            {getIcon()}
          </div>

          <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-line">
            {message}
          </p>

          <div className="w-full flex items-center gap-3">
            {!isAlertOnly && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 min-h-[44px] rounded-full border border-black/5 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-[#F1F2F4] dark:bg-[#262626] hover:bg-[#E5E7EB] dark:hover:bg-[#333333] transition-all cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onConfirm && !isAlertOnly) {
                  onConfirm();
                }
                onClose();
              }}
              className={`flex-1 py-3 px-4 min-h-[44px] rounded-full text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${getButtonClass()}`}
            >
              {isAlertOnly ? 'OK' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
