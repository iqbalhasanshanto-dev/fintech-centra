import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
  footer,
  isBottomSheet = true,
  maxWidth = 'max-w-md',
  hideHeader = false,
}) => {
  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const [translateY, setTranslateY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      touchDeltaY.current = delta;
      setTranslateY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaY.current > 70) {
      onClose();
    }
    setTranslateY(0);
    touchDeltaY.current = 0;
  };

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

  const modalNode = (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-fade-in z-[110]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Dialog Container */}
      <div
        className={`relative z-[111] w-full ${maxWidth} bg-white dark:bg-[#1D1D1D] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-black/5 dark:border-white/10 text-gray-900 dark:text-white transition-colors ${
          isBottomSheet ? 'animate-slide-up sm:animate-fade-in' : 'animate-fade-in'
        }`}
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: translateY === 0 ? 'transform 0.2s ease-out' : 'none',
          paddingBottom: 'env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px))',
          paddingLeft: 'env(safe-area-inset-left, var(--safe-area-inset-left, 0px))',
          paddingRight: 'env(safe-area-inset-right, var(--safe-area-inset-right, 0px))',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle Indicator with Drag Down to Close */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden w-full flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="w-12 h-1.5 bg-black/20 dark:bg-white/20 rounded-full" />
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
        <div className={`p-6 overflow-y-auto flex-1 overscroll-contain ${footer ? 'pb-4' : 'pb-8 sm:pb-6'}`}>
          {children}
        </div>

        {/* Docked Non-scrolling Footer */}
        {footer && (
          <div className="shrink-0 bg-white dark:bg-[#1D1D1D] border-t border-black/[0.06] dark:border-white/[0.08] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
