import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  isBottomSheet?: boolean;
  maxWidth?: string;
  hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  isBottomSheet = true,
  maxWidth = 'max-w-md',
  hideHeader = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const openDialogs = document.querySelectorAll('[role="dialog"]');
      if (openDialogs.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-fade-in z-[100]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Dialog Container */}
      <div
        className={`relative z-[101] w-full ${maxWidth} bg-white dark:bg-[#1D1D1D] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-black/5 dark:border-white/10 text-gray-900 dark:text-white transition-colors ${
          isBottomSheet ? 'animate-slide-up sm:animate-fade-in' : 'animate-fade-in'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px))',
          paddingLeft: 'env(safe-area-inset-left, var(--safe-area-inset-left, 0px))',
          paddingRight: 'env(safe-area-inset-right, var(--safe-area-inset-right, 0px))',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        {!hideHeader && (
          <div className="px-6 pt-4 pb-3 flex items-start justify-between border-b border-black/5 dark:border-white/10 shrink-0">
            <div>
              {title && (
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain pb-8 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};
