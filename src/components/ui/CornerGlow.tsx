import React from 'react';
import glowDark from '../../assets/brand/glow-corner.svg';
import glowLight from '../../assets/brand/glow-corner-on-light.svg';

interface CornerGlowProps {
  className?: string;
}

/**
 * Decorative Corner Glow component (top-right ambient accent light).
 * aria-hidden, pointer-events-none, absolute positioning, no layout or scrolling impact.
 * Renders static <img> assets to prevent SVG filter re-rasterization on low-end devices.
 */
export const CornerGlow: React.FC<CornerGlowProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute top-0 right-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
    >
      {/* Light mode corner glow */}
      <img
        src={glowLight}
        alt=""
        draggable={false}
        className="block dark:hidden w-[320px] sm:w-[412px] h-auto object-contain object-top-right transform translate-x-6 -translate-y-6 select-none"
      />
      {/* Dark mode corner glow */}
      <img
        src={glowDark}
        alt=""
        draggable={false}
        className="hidden dark:block w-[320px] sm:w-[412px] h-auto object-contain object-top-right transform translate-x-6 -translate-y-6 select-none"
      />
    </div>
  );
};
