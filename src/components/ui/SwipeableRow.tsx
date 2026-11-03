import React, { useState, useRef, TouchEvent, MouseEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { isNative } from '../../utils/platform';

export interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void | Promise<void>;
  deleteLabel?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_SWIPE_OFFSET = -84; // Reveal width of delete button

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteLabel = 'Delete',
  disabled = false,
  className = '',
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);

  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const startYRef = useRef<number | null>(null);

  // On Web, disable touch/mouse swipe-to-delete so rows never slide or rubber-band on click
  if (!isNative()) {
    return <div className={className}>{children}</div>;
  }

  const isOpen = translateX <= MAX_SWIPE_OFFSET / 2;

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || isCollapsing) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = translateX;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || startXRef.current === null || startYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    // Detect primary direction
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    // Calculate new offset clamped between MAX_SWIPE_OFFSET and 0
    let nextOffset = currentXRef.current + deltaX;
    if (nextOffset > 0) nextOffset = 0;
    if (nextOffset < MAX_SWIPE_OFFSET - 20) {
      nextOffset = MAX_SWIPE_OFFSET - 20 + (nextOffset - (MAX_SWIPE_OFFSET - 20)) * 0.2; // Rubber-band
    }
    setTranslateX(nextOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startXRef.current = null;
    startYRef.current = null;
    isHorizontalSwipeRef.current = null;

    // Snap to open or closed
    if (translateX < MAX_SWIPE_OFFSET / 2) {
      setTranslateX(MAX_SWIPE_OFFSET);
    } else {
      setTranslateX(0);
    }
  };

  const handleDeleteTrigger = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isCollapsing) return;

    // Smooth height collapse before committing deletion
    setIsCollapsing(true);
    setTimeout(async () => {
      try {
        await onDelete();
      } catch {
        setIsCollapsing(false);
        setTranslateX(0);
      }
    }, 280);
  };

  return (
    <div
      className={`relative overflow-hidden transition-all duration-280 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isCollapsing
          ? 'max-h-0 opacity-0 my-0 py-0 scale-95 pointer-events-none'
          : 'max-h-[300px] opacity-100'
      } ${className}`}
    >
      {/* Background action row (revealed when swiped left) */}
      {translateX < -2 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-1 z-0 select-none"
          style={{ width: `${Math.abs(MAX_SWIPE_OFFSET) + 12}px` }}
        >
          <button
            type="button"
            onClick={handleDeleteTrigger}
            aria-label={deleteLabel}
            style={{
              opacity: translateX < -4 ? Math.min(1, Math.abs(translateX) / 40) : 0,
              pointerEvents: translateX <= -40 ? 'auto' : 'none',
            }}
            className="w-16 h-[calc(100%-8px)] my-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md transition-transform active:scale-90 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span className="text-[10px] tracking-tight font-bold uppercase">{deleteLabel}</span>
          </button>
        </div>
      )}

      {/* Foreground Swipeable Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={e => {
          if (isOpen && translateX < 0) {
            e.stopPropagation();
            setTranslateX(0);
          }
        }}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.34, 1.35, 0.64, 1)',
        }}
        className="relative z-10 w-full bg-inherit select-none"
      >
        {children}
      </div>
    </div>
  );
};

