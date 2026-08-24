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
      {/* Section Header with "Details" drilldown link */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-bold font-display text-ink dark:text-[#f8fafc]">
            Your Money
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#64748b]">
            Cash flow {getPeriodLabel()}
          </p>
        </div>
        <button
          onClick={onNavigateToReport}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center space-x-0.5 group"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Side by side cards */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Income Card */}
        <div className="relative p-4 rounded-3xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-growth flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div className="relative">
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'income' ? null : 'income')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Income info"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {activeTooltip === 'income' && (
                <div className="absolute right-0 bottom-6 w-44 p-2 bg-[#131722] border border-[#1e2638] text-white text-[11px] rounded-xl shadow-lg z-20">
                  Total inflows from salary, freelance, bonuses, and investment dividends for the selected period.
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-[#64748b]">
            Income
          </span>
          <div className="text-lg sm:text-xl font-bold font-display text-growth mt-0.5 currency-amount">
            +{formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

        {/* Expenses Card */}
        <div className="relative p-4 rounded-3xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-danger flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="relative">
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'expense' ? null : 'expense')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Expense info"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {activeTooltip === 'expense' && (
                <div className="absolute right-0 bottom-6 w-44 p-2 bg-[#131722] border border-[#1e2638] text-white text-[11px] rounded-xl shadow-lg z-20">
                  All outgoing expenditures, card purchases, bills, and subscriptions recorded during this period.
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-[#64748b]">
            Expenses
          </span>
          <div className="text-lg sm:text-xl font-bold font-display text-ink dark:text-[#f8fafc] mt-0.5 currency-amount">
            -{formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

      </div>
    </div>
  );
};
