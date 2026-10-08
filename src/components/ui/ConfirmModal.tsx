import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Info, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Dialog card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white/90 dark:bg-[#0D1220]/95 backdrop-blur-xl border border-gray-200 dark:border-[#1e263c] p-6 shadow-2xl animate-scale-up text-gray-900 dark:text-white transition-all">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10">
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
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-[#232c44] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
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
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer ${getButtonClass()}`}
            >
              {isAlertOnly ? 'OK' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
