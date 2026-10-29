import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 border transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C6FF3D]/40 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked
          ? 'bg-[#C6FF3D] border-[#C6FF3D]'
          : 'bg-[#E5E7EB] border-[#D1D5DB] dark:bg-[#262626] dark:border-white/[0.12]'
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-xs transition-transform duration-200 ease-in-out ${
          checked
            ? 'translate-x-5 bg-[#18212F] dark:bg-[#0A0E1A]'
            : 'translate-x-0 bg-white'
        }`}
      />
    </button>
  );
};
