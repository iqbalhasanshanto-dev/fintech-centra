import React, { useMemo } from 'react';
import { ChevronRight, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  computePreviousPeriodTotals,
  calculatePercentageChange,
} from '../../utils/money';

interface YourMoneySectionProps {
  onNavigateToReport: () => void;
  onOpenAddTransaction?: () => void;
}

export const YourMoneySection: React.FC<YourMoneySectionProps> = ({
  onNavigateToReport,
}) => {
  const {
    periodIncome,
    periodExpenses,
    settings,
    transactions,
    periodFilter,
    totalBalance,
    updateSettings,
  } = useFinance();

  const { incomeBadge, expensesBadge } = useMemo(() => {
    const baseCurrency = settings?.baseCurrency || 'USD';
    const {
      previousIncome,
      previousExpenses,
      previousIncomeCount,
      previousExpenseCount,
      hasPreviousPeriod,
    } = computePreviousPeriodTotals(transactions || [], periodFilter, baseCurrency);

    if (!hasPreviousPeriod) {
      return { incomeBadge: null, expensesBadge: null };
    }

    const incomeBadge =
      previousIncomeCount > 0 && previousIncome > 0
        ? calculatePercentageChange(periodIncome, previousIncome, 'income')
        : null;

    const expensesBadge =
      previousExpenseCount > 0 && previousExpenses > 0
        ? calculatePercentageChange(periodExpenses, previousExpenses, 'expense')
        : null;

    return { incomeBadge, expensesBadge };
  }, [transactions, periodFilter, periodIncome, periodExpenses, settings?.baseCurrency]);

  const displayBalance = totalBalance ?? (periodIncome - periodExpenses);

  return (
    <section id="cashflow-summary" className="transition-colors w-full">
      {/* Account Information Hero Card (08-home.png) */}
      <div className="rounded-[28px] bg-white dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.15] p-5 sm:p-6 shadow-sm transition-all">
        {/* Card Header: Label + Details Action */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#667085] dark:text-[#9CA3AF]">
            Account Information
          </span>
          <button
            type="button"
            onClick={onNavigateToReport}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors p-1"
            aria-label="View full analytics details"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Balance Row with Privacy Mode Toggle */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18212F] dark:text-white tabular-nums currency-amount truncate block">
              {formatCurrency(displayBalance, settings?.baseCurrency, settings?.privacyMode)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => updateSettings?.({ privacyMode: !settings?.privacyMode })}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl bg-[#F1F2F4] dark:bg-[#262626] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label={settings?.privacyMode ? 'Show balances' : 'Hide balances'}
          >
            {settings?.privacyMode ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Stacked Summary Rows */}
        <div className="space-y-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
          {/* Total Income Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#16A34A] dark:bg-[#22C55E] shrink-0" />
              <span className="text-sm font-medium text-[#667085] dark:text-[#9CA3AF]">
                Total income
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tabular-nums text-[#18212F] dark:text-white">
                {formatCurrency(periodIncome, settings?.baseCurrency, settings?.privacyMode)}
              </span>
              {incomeBadge && (
                <span
                  data-testid="income-change-badge"
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-bold rounded-full tracking-wide ${
                    incomeBadge.isGood
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {incomeBadge.trend === 'down' ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  {incomeBadge.formatted}
                </span>
              )}
            </div>
          </div>

          {/* Total Expenses Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#E11D48] dark:bg-[#F43F5E] shrink-0" />
              <span className="text-sm font-medium text-[#667085] dark:text-[#9CA3AF]">
                Total expenses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tabular-nums text-[#18212F] dark:text-white">
                {formatCurrency(periodExpenses, settings?.baseCurrency, settings?.privacyMode)}
              </span>
              {expensesBadge && (
                <span
                  data-testid="expenses-change-badge"
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-bold rounded-full tracking-wide ${
                    expensesBadge.isGood
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {expensesBadge.trend === 'down' ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  {expensesBadge.formatted}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
