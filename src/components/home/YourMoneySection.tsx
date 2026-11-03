import React, { useState } from 'react';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

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
    totalBalance,
    updateSettings,
  } = useFinance();

  const [isEyeTapping, setIsEyeTapping] = useState(false);
  const displayBalance = totalBalance ?? (periodIncome - periodExpenses);

  return (
    <section id="cashflow-summary" className="transition-colors w-full h-full flex flex-col">
      {/* Account Information Hero Card (08-home.png) */}
      <div className="rounded-[28px] bg-white dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.15] p-5 sm:p-6 shadow-sm transition-all h-full flex flex-col justify-between">
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
            <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF] block mb-1">
              Net Balance
            </span>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18212F] dark:text-white tabular-nums currency-amount truncate block">
              {formatCurrency(displayBalance, settings?.baseCurrency, settings?.privacyMode)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEyeTapping(true);
              setTimeout(() => setIsEyeTapping(false), 360);
              updateSettings?.({ privacyMode: !settings?.privacyMode });
            }}
            className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl bg-[#F1F2F4] dark:bg-[#262626] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isEyeTapping ? 'animate-pop-tap animate-radial-burst' : ''
            }`}
            aria-label={settings?.privacyMode ? 'Show balances' : 'Hide balances'}
          >
            {settings?.privacyMode ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Total Income & Expenses: 2-Column Grid Side-by-Side */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
          {/* Total Income */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-8 rounded-full bg-[#16A34A] dark:bg-[#22C55E] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF] truncate">
                Total income
              </span>
              <span className="text-sm sm:text-base font-bold tabular-nums text-[#18212F] dark:text-white truncate">
                {formatCurrency(periodIncome, settings?.baseCurrency, settings?.privacyMode)}
              </span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-8 rounded-full bg-[#E11D48] dark:bg-[#F43F5E] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF] truncate">
                Total expenses
              </span>
              <span className="text-sm sm:text-base font-bold tabular-nums text-[#18212F] dark:text-white truncate">
                {formatCurrency(periodExpenses, settings?.baseCurrency, settings?.privacyMode)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
