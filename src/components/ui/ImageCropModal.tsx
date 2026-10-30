import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useBackHandler } from '../../utils/backButton';

interface ImageCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  isCircular?: boolean;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  isCircular = true,
}) => {
  useBackHandler(isOpen, onClose);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset when opening with a new image
  const [prevModalState, setPrevModalState] = useState({ isOpen, imageSrc });
  if (prevModalState.isOpen !== isOpen || prevModalState.imageSrc !== imageSrc) {
    setPrevModalState({ isOpen, imageSrc });
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStartRef.current.x,
      y: touch.clientY - dragStartRef.current.y,
    });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleApplyCrop = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    // Viewport dimensions
    const viewportSize = 240;
    const outputSize = 512;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.imageSmoothingQuality = 'high';

    // Natural dimensions
    const natW = img.naturalWidth || 512;
    const natH = img.naturalHeight || 512;

    // Displayed dimensions on container
    const baseScale = Math.max(viewportSize / natW, viewportSize / natH);
    const renderW = natW * baseScale * scale;
    const renderH = natH * baseScale * scale;

    // Center offset relative to viewport
    const offsetX = (viewportSize - renderW) / 2 + position.x;
    const offsetY = (viewportSize - renderH) / 2 + position.y;

    // Scaling ratio to outputSize
    const multiplier = outputSize / viewportSize;

    ctx.drawImage(
      img,
      offsetX * multiplier,
      offsetY * multiplier,
      renderW * multiplier,
      renderH * multiplier
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop Image"
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-sm rounded-[32px] bg-white dark:bg-[#1D1D1D] border border-black/10 dark:border-white/10 p-5 shadow-2xl flex flex-col items-center gap-4 animate-scale-in">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Crop Avatar
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel crop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Frame with guide */}
        <div
          className={`relative w-[240px] h-[240px] overflow-hidden bg-black/90 ${
            isCircular ? 'rounded-full' : 'rounded-2xl'
          } border-2 border-[#C6FF3D] shadow-inner cursor-grab active:cursor-grabbing flex items-center justify-center touch-none`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Source preview"
            onLoad={() => setImageLoaded(true)}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            className="pointer-events-none select-none transition-transform duration-75"
            draggable={false}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
              Loading image...
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center -mt-1">
          Drag to reposition • Slide to zoom
        </p>

        {/* Zoom Controls */}
        <div className="w-full flex items-center gap-3 px-2">
          <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            className="w-full accent-[#C6FF3D] cursor-pointer h-1.5 rounded-lg bg-gray-200 dark:bg-[#333333]"
            aria-label="Zoom level"
          />
          <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="p-1 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            title="Reset pan and zoom"
            aria-label="Reset pan and zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="py-3 px-4 rounded-full bg-[#C6FF3D] text-black text-xs font-bold hover:bg-[#bbf532] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
