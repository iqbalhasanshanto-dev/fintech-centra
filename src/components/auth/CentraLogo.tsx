import React from 'react';
import logoOnDark from '../../assets/brand/logo-on-dark.svg';
import logoOnLight from '../../assets/brand/logo-on-light.svg';

interface CentraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showGlow?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
};

export const CentraLogo: React.FC<CentraLogoProps> = ({
  className = '',
  size = 'md',
  showGlow = false,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 bg-gradient-to-tr from-emerald-500/40 via-[#C6FF3D]/30 to-amber-300/40 -z-10 animate-pulse"
        />
      )}
      <img
        src={logoOnLight}
        alt="Centra"
        className={`${sizeMap[size]} object-contain select-none drop-shadow-sm rounded-xl dark:hidden`}
        draggable={false}
      />
      <img
        src={logoOnDark}
        alt="Centra"
        className={`${sizeMap[size]} object-contain select-none drop-shadow-sm rounded-xl hidden dark:block`}
        draggable={false}
      />
    </div>
  );
};
