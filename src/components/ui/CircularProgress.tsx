import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showText?: boolean;
  textColor?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 56,
  strokeWidth = 5,
  color,
  showText = false,
  textColor = 'text-ink dark:text-white',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Determine color based on threshold if not explicitly provided
  let strokeColor = color;
  if (!strokeColor) {
    if (percentage >= 100) {
      strokeColor = '#FF6B57'; // Danger / Coral
    } else if (percentage >= 75) {
      strokeColor = '#F5A524'; // Caution / Amber
    } else {
      strokeColor = '#1FAE71'; // Growth / Green
    }
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children ? (
          children
        ) : showText ? (
          <span className={`text-xs font-bold font-display ${textColor}`}>
            {Math.round(percentage)}%
          </span>
        ) : null}
      </div>
    </div>
  );
};
