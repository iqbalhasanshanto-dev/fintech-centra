import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, HelpCircle, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface YourMoneySectionProps {
  onNavigateToReport: () => void;
}

export const YourMoneySection: React.FC<YourMoneySectionProps> = ({
  onNavigateToReport,
}) => {
  const { periodIncome, periodExpenses, settings, periodFilter } = useFinance();
  const [activeTooltip, setActiveTooltip] = useState<'income' | 'expense' | null>(null);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'this_month': return 'this month';
      case 'last_month': return 'last month';
      case 'last_90_days': return 'last 90 days';
      case 'this_year': return 'this year';
      default: return 'all time';
    }
  };

  return (
    <div className="space-y-3">
      {/* Section Header: flush alignment with cards, accessible Details button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-display text-gray-900 dark:text-[#FFFFFF]">
            Your Money
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
            Cash flow {getPeriodLabel()}
          </p>
        </div>
        <button
          onClick={onNavigateToReport}
          className="min-h-[36px] px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#161B26] text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center space-x-1 transition-colors"
          aria-label="View cash flow report details"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Side by side cards */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Income Card */}
        <div className="relative p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div className="relative">
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'income' ? null : 'income')}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#E2E8F0] rounded-full"
                aria-label="Income information details"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {activeTooltip === 'income' && (
                <div className="absolute right-0 bottom-8 w-52 p-3 bg-[#161B26] border border-white/10 text-[#E2E8F0] text-xs rounded-xl shadow-xl z-20 animate-fade-in leading-relaxed">
                  Total inflows from salary, freelance, bonuses, and investment returns for the selected period.
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-[#94A3B8]">
            Income
          </span>
          <div className="text-lg sm:text-2xl font-extrabold font-display text-emerald-500 mt-0.5 tabular-nums currency-amount">
            +{formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

        {/* Expenses Card */}
        <div className="relative p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="relative">
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'expense' ? null : 'expense')}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#E2E8F0] rounded-full"
                aria-label="Expenses information details"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {activeTooltip === 'expense' && (
                <div className="absolute right-0 bottom-8 w-52 p-3 bg-[#161B26] border border-white/10 text-[#E2E8F0] text-xs rounded-xl shadow-xl z-20 animate-fade-in leading-relaxed">
                  All outgoing expenditures, card purchases, bills, and subscriptions recorded during this period.
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-[#94A3B8]">
            Expenses
          </span>
          <div className="text-lg sm:text-2xl font-extrabold font-display text-gray-900 dark:text-[#FFFFFF] mt-0.5 tabular-nums currency-amount">
            -{formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

      </div>
    </div>
  );
};
