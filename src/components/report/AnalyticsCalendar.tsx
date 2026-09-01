import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { getThemePalette } from '../../utils/themeColors';

interface AnalyticsCalendarProps {
  onSelectTransaction?: (tx: Transaction) => void;
}

export const AnalyticsCalendar: React.FC<AnalyticsCalendarProps> = ({
  onSelectTransaction,
}) => {
  const { transactions, settings } = useFinance();
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const palette = getThemePalette(isDark);

  // Current viewed month/year in calendar
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Selected date (defaults to today or latest transaction date)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Group transactions by date key (YYYY-MM-DD)
  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      const dateKey = tx.date.split('T')[0];
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(tx);
    });
    return map;
  }, [transactions]);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: {
      dayNumber: number;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasTransactions: boolean;
      totalSpend: number;
      totalIncome: number;
    }[] = [];

    const todayKey = new Date().toISOString().split('T')[0];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateKey = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactionsByDate[dateKey] || [];
      const totalSpend = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        hasTransactions: dayTxs.length > 0,
        totalSpend,
        totalIncome,
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactionsByDate[dateKey] || [];
      const totalSpend = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        hasTransactions: dayTxs.length > 0,
        totalSpend,
        totalIncome,
      });
    }

    // Trailing days from next month to complete 6-row or 5-row grid (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateKey = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactionsByDate[dateKey] || [];
      const totalSpend = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        hasTransactions: dayTxs.length > 0,
        totalSpend,
        totalIncome,
      });
    }

    return days;
  }, [year, month, transactionsByDate]);

  // Selected date's transactions & totals
  const selectedDayTransactions = useMemo(() => {
    return transactionsByDate[selectedDate] || [];
  }, [transactionsByDate, selectedDate]);

  const selectedDaySpend = useMemo(() => {
    return selectedDayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDayTransactions]);

  const selectedDayIncome = useMemo(() => {
    return selectedDayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDayTransactions]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Formatted date title for selected date
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  return (
    <section id="interactive-calendar" className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 transition-colors shadow-xs">
      {/* Calendar Header with aligned icon & text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Interactive spending calendar
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Click any date to inspect daily total spend and breakdown
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1A233A] transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] rounded-lg p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-[#121A2C] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-gray-900 dark:text-white min-w-[110px] text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-[#121A2C] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-gray-50/70 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] rounded-2xl p-4 sm:p-5">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {weekdayNames.map(day => (
              <div
                key={day}
                className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => {
              const isSelected = item.dateKey === selectedDate;
              return (
                <button
                  key={`${item.dateKey}-${index}`}
                  onClick={() => setSelectedDate(item.dateKey)}
                  className={`relative flex flex-col items-center justify-center h-11 sm:h-12 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-brand-600 text-white dark:!bg-[#C6FF3D] dark:!text-[#171717] font-bold shadow-md ring-2 ring-offset-2 ring-brand-500 dark:ring-[#C6FF3D] dark:ring-offset-[#0A0E1A]'
                      : item.isCurrentMonth
                      ? 'text-gray-900 dark:text-white hover:bg-white dark:hover:bg-[#121A2C] hover:shadow-xs'
                      : 'text-gray-400/60 dark:text-gray-600 hover:bg-white/50 dark:hover:bg-[#121A2C]/50'
                  } ${item.isToday && !isSelected ? 'border border-brand-500 dark:border-[#C6FF3D]' : ''}`}
                >
                  <span className="tabular-nums">{item.dayNumber}</span>
                  
                  {/* Transaction indicator dots */}
                  {item.hasTransactions && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {item.totalSpend > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white dark:bg-[#171717]' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : palette.negative,
                          }}
                        />
                      )}
                      {item.totalIncome > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white dark:bg-[#171717]' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : palette.positive,
                          }}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Breakdown Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gray-50/70 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] rounded-2xl p-5 flex flex-col h-full min-h-[340px]">
          {/* Selected Date Header with strong visual weight */}
          <div className="border-b border-gray-200 dark:border-[#232C45] pb-4 mb-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-0.5">
              Selected date
            </span>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {formattedSelectedDate}
            </h4>

            {/* Total Spend & Income for Selected Day */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45]">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span>Total spend</span>
                  <ArrowDownRight className="w-3.5 h-3.5" style={{ color: palette.negative }} />
                </div>
                <div className="text-base font-bold tabular-nums mt-1 font-display" style={{ color: palette.negative }}>
                  {formatCurrency(selectedDaySpend, settings.baseCurrency, settings.privacyMode)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45]">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span>Total income</span>
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: palette.positive }} />
                </div>
                <div className="text-base font-bold tabular-nums mt-1 font-display" style={{ color: palette.positive }}>
                  {formatCurrency(selectedDayIncome, settings.baseCurrency, settings.privacyMode)}
                </div>
              </div>
            </div>
          </div>

          {/* Day Transactions List Breakdown */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transactions ({selectedDayTransactions.length})
              </span>
            </div>

            {selectedDayTransactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl bg-white dark:bg-[#121A2C] border border-dashed border-gray-200 dark:border-[#232C45]">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#0A0E1A] flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  No transactions on this day
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pick a highlighted day to view itemized records
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedDayTransactions.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction?.(tx)}
                    className="p-3 rounded-xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] hover:border-brand-500 flex items-center justify-between text-xs cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <CategoryIcon name={tx.categoryIcon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {tx.merchant || tx.categoryName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {tx.accountName} • {formatTime(tx.date)}
                        </p>
                      </div>
                    </div>

                    <span
                      className="font-bold tabular-nums shrink-0 font-display text-xs"
                      style={{
                        color: tx.type === 'income' ? palette.positive : palette.negative,
                      }}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
