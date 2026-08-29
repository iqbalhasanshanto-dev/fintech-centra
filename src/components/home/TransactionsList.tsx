import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatDateHeader, formatTime } from '../../utils/formatters';

interface TransactionsListProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSeeAll: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  onSelectTransaction,
  onOpenSeeAll,
}) => {
  const { transactions, settings } = useFinance();
  const [filterMode, setFilterMode] = useState<'all' | 'income' | 'expense'>('all');

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterMode === 'expense') return tx.type === 'expense';
      if (filterMode === 'income') return tx.type === 'income';
      return true;
    });
  }, [transactions, filterMode]);

  // Group transactions by date (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const groups: { dateKey: string; items: Transaction[] }[] = [];
    const dateMap: Record<string, Transaction[]> = {};

    filtered.forEach(tx => {
      const dateKey = tx.date.split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
        groups.push({ dateKey, items: dateMap[dateKey] });
      }
      dateMap[dateKey].push(tx);
    });

    // Sort groups descending by date
    groups.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
    return groups;
  }, [filtered]);

  return (
    <section id="transactions" className="transition-colors">
      {/* Header & Filter pills */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] rounded-lg p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('income')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'income'
                  ? 'bg-white dark:bg-[#121A2C] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterMode('expense')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'expense'
                  ? 'bg-white dark:bg-[#121A2C] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Outflow
            </button>
          </div>
          <button
            onClick={onOpenSeeAll}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>
      </div>

      {/* Date-grouped Transactions Container */}
      <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl overflow-hidden shadow-xs transition-colors">
        {groupedTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            No transactions found for this filter.
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.dateKey}>
              {/* Date divider */}
              <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-[#0A0E1A]/50 border-b border-gray-200 dark:border-[#232C45]">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {formatDateHeader(group.dateKey)}
                </span>
              </div>

              {/* Day's Transactions */}
              <div className="divide-y divide-gray-100 dark:divide-[#232C45]">
                {group.items.map(tx => {
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1A233A] transition-colors cursor-pointer group select-none"
                    >
                      {/* Left: Category Icon + Details */}
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200/80 dark:border-[#232C45] rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0">
                          <CategoryIcon name={tx.categoryIcon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {tx.merchant || tx.categoryName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {tx.accountName} • {formatTime(tx.date)}
                            {tx.tags && tx.tags.length > 0 && (
                              <span> • <span className="text-brand-600 dark:text-brand-400">#{tx.tags[0]}</span></span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Type */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold tabular-nums currency-amount ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isTransfer
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          {tx.type}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
