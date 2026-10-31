import React, { useMemo } from 'react';
import { Pin } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, getTransactionDisplay } from '../../utils/formatters';

interface TransactionsListProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSeeAll: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  onSelectTransaction,
  onOpenSeeAll,
}) => {
  const { transactions, settings } = useFinance();

  // Show the latest 5 transactions in the Recent Activity card (pinned stick to top)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 5);
  }, [transactions]);

  const getIconTint = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-500/10 text-[#16A34A] dark:text-[#22C55E]';
      case 'transfer':
        return 'bg-sky-500/10 text-[#0284C7] dark:text-[#38BDF8]';
      case 'expense':
      default:
        return 'bg-rose-500/10 text-[#E11D48] dark:text-[#FB7185]';
    }
  };

  return (
    <section id="transactions" className="transition-colors w-full">
      {/* Activity Card Matching Figma Frame Home full screen (activity-card) */}
      <div className="rounded-[28px] bg-white dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.15] p-5 sm:p-6 shadow-sm transition-all w-full">
        {/* Card Header: Title + View All Action */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.07] mb-2">
          <h2 className="text-sm sm:text-base font-medium text-[#18212F] dark:text-white/60">
            Recent Activity
          </h2>
          <button
            type="button"
            onClick={onOpenSeeAll}
            className="text-xs font-medium text-[#667085] dark:text-white/65 hover:text-[#18212F] dark:hover:text-white transition-colors cursor-pointer px-1 py-0.5"
            aria-label="View all transactions"
          >
            View All
          </button>
        </div>

        {/* Transactions List with unconstrained clean spacing */}
        {recentTransactions.length === 0 ? (
          <div className="py-10 text-center text-xs font-medium text-[#667085] dark:text-white/40">
            No transactions yet. Tap &apos;+&apos; in the bottom bar to add your first transaction.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
            {recentTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              const display = getTransactionDisplay(tx);

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className={`flex items-center justify-between py-3 px-2.5 transition-colors cursor-pointer select-none rounded-2xl -mx-1 my-0.5 border ${
                    tx.isPinned
                      ? 'bg-[#C6FF3D]/[0.06] dark:bg-[#C6FF3D]/[0.05] border-[#C6FF3D]/30 dark:border-[#C6FF3D]/25'
                      : 'border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Left: Category Icon + Merchant / Category Title + Timestamp Subtitle */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-xs ${getIconTint(
                        tx.type
                      )}`}
                    >
                      <CategoryIcon name={tx.categoryIcon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-[#18212F] dark:text-white truncate leading-tight">
                          {display.title}
                        </p>
                        {tx.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-[#659300] dark:text-[#C6FF3D] fill-current shrink-0 rotate-45" />
                        )}
                      </div>
                      <p className="text-xs text-[#667085] dark:text-white/40 truncate mt-1">
                        {display.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Signed Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm sm:text-base font-medium tabular-nums currency-amount whitespace-nowrap ${
                        isIncome
                          ? 'text-[#16A34A] dark:text-[#22C55E]'
                          : isExpense
                          ? 'text-[#E11D48] dark:text-[#FB7185]'
                          : 'text-[#0284C7] dark:text-[#38BDF8]'
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
