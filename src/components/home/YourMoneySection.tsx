import React from 'react';
import { ArrowRight } from 'lucide-react';
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
    <section id="cashflow-summary" className="mb-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Money</h1>
          <p className="text-gray-500 text-sm mt-1">Cash flow summary for the current period</p>
        </div>
        <button
          onClick={onNavigateToReport}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>View Detailed Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Income Card */}
        <div className="bg-[#171717] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Income</span>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-md tracking-wide">
              +12.5%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums currency-amount">
              {formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode)}
            </span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-[#171717] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Expenses</span>
            <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-md tracking-wide">
              -4.2%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums currency-amount">
              {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
