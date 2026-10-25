import React, { useMemo } from 'react';
import { ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';
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
  } = useFinance();

  const { incomeBadge, expensesBadge } = useMemo(() => {
    const baseCurrency = settings.baseCurrency || 'USD';
    const {
      previousIncome,
      previousExpenses,
      previousIncomeCount,
      previousExpenseCount,
      hasPreviousPeriod,
    } = computePreviousPeriodTotals(transactions, periodFilter, baseCurrency);

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
  }, [transactions, periodFilter, periodIncome, periodExpenses, settings.baseCurrency]);

  return (
    <section id="cashflow-summary" className="transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Cash flow &amp; financial overview</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToReport}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
          aria-label="View full analytics details"
        >
          Details
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Total Income Card */}
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total income</span>
            {incomeBadge && (
              <span
                data-testid="income-change-badge"
                className={`inline-flex items-center gap-0.5 px-2 py-1 text-xs font-bold rounded-md tracking-wide ${
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
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
              {formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode)}
            </span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total expenses</span>
            {expensesBadge && (
              <span
                data-testid="expenses-change-badge"
                className={`inline-flex items-center gap-0.5 px-2 py-1 text-xs font-bold rounded-md tracking-wide ${
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
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
              {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
