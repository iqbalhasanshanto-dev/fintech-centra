import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatTime } from '../../utils/formatters';

interface TransactionsListProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSeeAll: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  onSelectTransaction,
  onOpenSeeAll,
}) => {
  const { transactions, settings } = useFinance();

  // Show the latest 5 transactions in the Recent Activity card
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const formatSubtitle = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timePart = formatTime(dateStr);
    if (isToday) return `Today • ${timePart}`;
    if (isYesterday) return `Yesterday • ${timePart}`;
    return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • ${timePart}`;
  };

  const getIconTint = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'transfer':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
      case 'expense':
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    }
  };

  return (
    <section id="transactions" className="transition-colors w-full">
      {/* Unified Recent Activity Card (08-home.png) */}
      <div className="rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-sm transition-all">
        {/* Card Header: Title + View All Action */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#18212F] dark:text-white">
            Recent Activity
          </h2>
          <button
            type="button"
            onClick={onOpenSeeAll}
            className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF] hover:text-[#18212F] dark:hover:text-white transition-colors cursor-pointer p-1"
            aria-label="View all transactions"
          >
            View All
          </button>
        </div>

        {/* Transactions List */}
        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
            No transactions yet. Tap &apos;+&apos; in the bottom bar to add your first transaction.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
            {recentTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="flex items-center justify-between py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none rounded-xl px-1 -mx-1"
                >
                  {/* Left: Category Icon + Title + Subtitle */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${getIconTint(
                        tx.type
                      )}`}
                    >
                      <CategoryIcon name={tx.categoryIcon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#18212F] dark:text-white truncate">
                        {tx.merchant || tx.categoryName}
                      </p>
                      <p className="text-xs text-[#667085] dark:text-[#9CA3AF] truncate mt-0.5">
                        {formatSubtitle(tx.date)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Signed Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold tabular-nums currency-amount ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
