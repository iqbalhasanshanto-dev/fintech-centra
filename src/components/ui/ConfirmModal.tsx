import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20';
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20';
      default:
        return 'bg-[#C6FF3D] hover:bg-[#b8f52e] text-black shadow-[#C6FF3D]/20';
    }
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
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
        onTouchMove={e => e.preventDefault()}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in z-[110] touch-none"
      />

      {/* Dialog card */}
      <div className="relative z-[111] w-full max-w-sm rounded-[28px] bg-white dark:bg-[#171717] border border-black/[0.08] dark:border-white/[0.10] p-6 shadow-2xl animate-scale-up text-gray-900 dark:text-white transition-all">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <h3 className="text-base font-bold tracking-tight mb-2 text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-line">
            {message}
          </p>

          <div className="w-full flex items-center gap-3">
            {!isAlertOnly && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 min-h-[44px] rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-[#F1F2F4] dark:bg-[#262626] hover:bg-[#E5E7EB] dark:hover:bg-[#333333] transition-all cursor-pointer"
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
              className={`flex-1 py-3 px-4 min-h-[44px] rounded-full text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md ${getButtonClass()}`}
            >
              {isAlertOnly ? 'OK' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
