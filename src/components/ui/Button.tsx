import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#C6FF3D] hover:bg-[#B2E830] active:bg-[#9ECC27] text-[#0A0E1A] font-bold shadow-xs border border-transparent',
  secondary:
    'bg-[#F1F2F4] hover:bg-[#E5E7EB] active:bg-[#D1D5DB] dark:bg-[#262626] dark:hover:bg-[#333333] dark:active:bg-[#3d3d3d] text-[#18212F] dark:text-[#FFFFFF] border border-black/5 dark:border-white/10 font-semibold',
  ghost:
    'bg-transparent hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15 text-[#18212F] dark:text-gray-200 border border-transparent font-semibold',
  destructive:
    'bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs min-h-[38px] rounded-full gap-1.5',
  md: 'px-5 py-2.5 text-sm min-h-[44px] rounded-full gap-2',
  lg: 'px-6 py-3 text-base min-h-[48px] rounded-full gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
