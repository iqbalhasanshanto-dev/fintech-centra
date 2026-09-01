import React from 'react';
import { ChevronRight, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface YourMoneySectionProps {
  onNavigateToReport: () => void;
  onOpenAddTransaction?: () => void;
}

export const YourMoneySection: React.FC<YourMoneySectionProps> = ({
  onNavigateToReport,
  onOpenAddTransaction,
}) => {
  const { periodIncome, periodExpenses, settings } = useFinance();

  return (
    <section id="cashflow-summary" className="transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Cash flow &amp; financial overview</p>
        </div>

        <button
          onClick={onNavigateToReport}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors inline-flex items-center gap-1 py-2 px-3 min-h-[40px] rounded-xl hover:bg-gray-100 dark:hover:bg-[#121A2C] cursor-pointer"
        >
          <span>Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Total Income Card */}
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total income</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-md tracking-wide">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +12.5%
            </span>
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
            <span className="inline-flex items-center gap-0.5 px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-md tracking-wide">
              <ArrowDownRight className="w-3.5 h-3.5" />
              -4.2%
            </span>
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
