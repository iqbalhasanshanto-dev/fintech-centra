import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { todayLocalDateKey, toLocalDateKey } from '../../utils/dates';

interface AnalyticsCalendarProps {
  onSelectTransaction?: (tx: Transaction) => void;
}

export const AnalyticsCalendar: React.FC<AnalyticsCalendarProps> = ({
  onSelectTransaction,
}) => {
  const { transactions, settings } = useFinance();

  // Current viewed month/year in calendar
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Selected date (defaults to today or latest transaction date)
  const [selectedDate, setSelectedDate] = useState(() => todayLocalDateKey());

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
    setSelectedDate(todayLocalDateKey());
  };

  // Group transactions by date key (YYYY-MM-DD)
  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      const dateKey = toLocalDateKey(tx.date);
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

    const todayKey = todayLocalDateKey();

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

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Formatted date title for selected date
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const getTxBadgeStyle = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'expense':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      default:
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    }
  };

  return (
    <section id="interactive-calendar" className="space-y-6">
      {/* Card 2: Spending Calendar (12-analytics--full.png) */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.12] rounded-[28px] p-5 sm:p-6 transition-colors shadow-xs">
        {/* Calendar Header with aligned icon & text */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F1F2F4] dark:bg-white/10 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#18212F] dark:text-white shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18212F] dark:text-white">
                Spending calendar
              </h3>
              <p className="text-xs text-[#667085] dark:text-white/60 mt-0.5">
                Click any date to inspect daily total spend and breakdown
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F1F2F4] dark:bg-white/10 border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center bg-[#F1F2F4] dark:bg-white/10 border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-[#667085] dark:text-gray-400 hover:text-[#18212F] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-[#18212F] dark:text-white min-w-[110px] text-center select-none">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-[#667085] dark:text-gray-400 hover:text-[#18212F] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {weekdayNames.map(day => (
            <div
              key={day}
              className="text-xs font-bold text-[#667085] dark:text-white/60 uppercase py-1"
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
                className={`relative flex flex-col items-center justify-center h-11 sm:h-12 rounded-2xl text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#C6FF3D] text-[#0A0E1A] font-bold shadow-[0_0_12px_rgba(198,255,61,0.35)] ring-2 ring-offset-2 ring-[#C6FF3D] dark:ring-offset-[#0A0A0A]'
                    : item.isCurrentMonth
                    ? 'text-[#18212F] dark:text-white hover:bg-[#F1F2F4] dark:hover:bg-white/10'
                    : 'text-gray-400/40 dark:text-gray-600 hover:bg-[#F1F2F4]/50 dark:hover:bg-white/5'
                } ${item.isToday && !isSelected ? 'border border-[#C6FF3D]' : ''}`}
              >
                <span className="tabular-nums">{item.dayNumber}</span>
                
                {/* Transaction indicator dots */}
                {item.hasTransactions && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {item.totalSpend > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[#0A0E1A]' : 'bg-[#E11D48]'
                        }`}
                      />
                    )}
                    {item.totalIncome > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[#0A0E1A]' : 'bg-[#16A34A]'
                        }`}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Legend Row */}
        <div className="flex items-center justify-center gap-5 pt-4 mt-3 border-t border-black/[0.04] dark:border-white/[0.07] text-xs font-medium text-[#667085] dark:text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
            Expenses
          </span>
        </div>
      </div>

      {/* Card 3: Selected Date Breakdown (Separate Card Below the Calendar matching 12-analytics--full.png) */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.12] rounded-[28px] p-5 sm:p-6 flex flex-col shadow-xs">
        {/* Selected Date Header */}
        <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4 mb-4">
          <span className="text-xs font-medium text-[#667085] dark:text-gray-400 block mb-0.5">
            Selected date
          </span>
          <h4 className="text-lg font-bold text-[#18212F] dark:text-white truncate">
            {formattedSelectedDate}
          </h4>

          {/* 2-column summary with vertical bars matching Figma 12-analytics--full.png */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3">
            <div className="p-3.5 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3">
              <div className="w-1 h-10 rounded-full bg-[#E11D48] dark:bg-[#F43F5E] shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#667085] dark:text-gray-400 truncate">
                  Total expenses
                </div>
                <div className="text-base sm:text-lg font-bold tabular-nums text-[#E11D48] dark:text-[#F43F5E] truncate">
                  {formatCurrency(selectedDaySpend, settings.baseCurrency, settings.privacyMode)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3">
              <div className="w-1 h-10 rounded-full bg-[#16A34A] dark:bg-[#22C55E] shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#667085] dark:text-gray-400 truncate">
                  Total income
                </div>
                <div className="text-base sm:text-lg font-bold tabular-nums text-[#16A34A] dark:text-[#22C55E] truncate">
                  {formatCurrency(selectedDayIncome, settings.baseCurrency, settings.privacyMode)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day Transactions List Breakdown */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#18212F] dark:text-white">
              Transactions
            </span>
            <span className="text-xs text-[#667085] dark:text-gray-400 font-medium">
              {selectedDayTransactions.length} {selectedDayTransactions.length === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>

          {selectedDayTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[#F1F2F4]/50 dark:bg-white/[0.03] border border-dashed border-black/[0.08] dark:border-white/[0.12] min-h-[160px]">
              <div className="w-10 h-10 rounded-full bg-[#F1F2F4] dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#18212F] dark:text-white">
                No transactions on this day
              </p>
              <p className="text-xs text-[#667085] dark:text-gray-400 mt-0.5">
                Pick a highlighted day to view itemized records
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] sm:max-h-[460px] overflow-y-auto pr-1">
              {selectedDayTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction?.(tx)}
                    className="p-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#C6FF3D] dark:hover:border-[#C6FF3D] flex items-center justify-between text-xs cursor-pointer transition-all group shadow-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${getTxBadgeStyle(tx.type)}`}>
                        <CategoryIcon name={tx.categoryIcon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#18212F] dark:text-white truncate">
                          {tx.merchant || tx.categoryName}
                        </p>
                        <p className="text-xs text-[#667085] dark:text-gray-400 mt-0.5">
                          {tx.categoryName} • {formatTime(tx.date)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-bold tabular-nums shrink-0 text-sm ${
                        isIncome
                          ? 'text-[#16A34A] dark:text-[#22C55E]'
                          : isExpense
                          ? 'text-[#E11D48] dark:text-[#FB7185]'
                          : 'text-[#0284C7] dark:text-[#38BDF8]'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
