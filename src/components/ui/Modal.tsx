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
        className="fixed inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in z-[100]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Dialog Container */}
      <div
        className={`relative z-[101] w-full ${maxWidth} bg-white dark:bg-[#131722] rounded-t-4xl sm:rounded-4xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-100 dark:border-[#1e2638] ${
          isBottomSheet ? 'animate-slide-up sm:animate-fade-in' : 'animate-fade-in'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#1e2638] rounded-full" />
        </div>

        {/* Header */}
        {!hideHeader && (
          <div className="px-6 pt-4 pb-3 flex items-start justify-between border-b border-gray-100 dark:border-[#1e2638] shrink-0">
            <div>
              {title && (
                <h3 className="text-xl font-bold font-display text-ink dark:text-[#f8fafc]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-[#64748b] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-[#f8fafc] hover:bg-gray-100 dark:hover:bg-[#1e2638] rounded-full transition-colors"
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
