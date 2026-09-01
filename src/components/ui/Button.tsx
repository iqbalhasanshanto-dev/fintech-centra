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
    'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold shadow-xs dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52e] dark:text-[#171717] border border-transparent',
  secondary:
    'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-[#171717] dark:hover:bg-[#262626] dark:active:bg-[#333333] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#404040] font-semibold',
  ghost:
    'bg-transparent hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-[#262626] dark:active:bg-[#333333] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-transparent font-semibold',
  destructive:
    'bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20 hover:border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px] rounded-xl gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm min-h-[40px] rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base min-h-[44px] rounded-xl gap-2.5',
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
