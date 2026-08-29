import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface YourMoneySectionProps {
  onNavigateToReport: () => void;
}

export const YourMoneySection: React.FC<YourMoneySectionProps> = ({
  onNavigateToReport,
}) => {
  const { periodIncome, periodExpenses, settings } = useFinance();

  return (
    <section id="cashflow-summary" className="transition-colors">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Money</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Cash flow this month</p>
        </div>
        <button
          onClick={onNavigateToReport}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Total Income Card */}
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Income</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md tracking-wide">
              <ArrowUpRight className="w-3 h-3" />
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
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Expenses</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-md tracking-wide">
              <ArrowDownRight className="w-3 h-3" />
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
