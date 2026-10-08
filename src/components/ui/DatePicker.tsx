import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  maxDate?: string;
  minDate?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  maxDate,
  minDate,
  label,
  placeholder = 'Select date',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current value or fallback to today
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value, isOpen]);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return placeholder;
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startingDay = firstDayOfMonth(viewYear, viewMonth);

  // Generate Year options from 1920 to 2035
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear + 10; y >= 1920; y--) {
    yearOptions.push(y);
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-all text-sm cursor-pointer select-none group"
      >
        <span className={value ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors shrink-0" />
      </button>

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            ref={modalRef}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0D1220] border border-gray-200 dark:border-[#1e263c] shadow-2xl p-5 text-gray-900 dark:text-white animate-scale-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-500" />
                <span className="text-sm font-bold tracking-tight">Select Date</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Month / Year Navigator */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <select
                  value={viewMonth}
                  onChange={e => setViewMonth(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white border-0 cursor-pointer focus:outline-none"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                      {m}
                    </option>
                  ))}
                </select>

                {/* Year Selector */}
                <select
                  value={viewYear}
                  onChange={e => setViewYear(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white border-0 cursor-pointer focus:outline-none"
                >
                  {yearOptions.map(yr => (
                    <option key={yr} value={yr} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
                <span key={w} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                  {w}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {/* Blank offset days */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Day numbers */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const mm = String(viewMonth + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const dateKey = `${viewYear}-${mm}-${dd}`;
                const isSelected = value === dateKey;

                const isOutOfMax = maxDate && dateKey > maxDate;
                const isOutOfMin = minDate && dateKey < minDate;
                const isDisabled = !!(isOutOfMax || isOutOfMin);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-8 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isDisabled
                        ? 'opacity-20 cursor-not-allowed text-gray-400'
                        : isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer quick button */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  onChange(today);
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Select Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-1.5 px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
