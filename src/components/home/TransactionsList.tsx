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
    <section id="transactions">
      {/* Header & Filter pills */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('income')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterMode === 'income'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterMode('expense')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterMode === 'expense'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Outflow
            </button>
          </div>
          <button
            onClick={onOpenSeeAll}
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      {/* Date-grouped Transactions Container */}
      <div className="bg-[#171717] border border-gray-800 rounded-2xl overflow-hidden">
        {groupedTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-gray-500">
            No transactions found for this filter.
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.dateKey}>
              {/* Date divider */}
              <div className="p-4 bg-gray-900/50 border-b border-gray-800">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {formatDateHeader(group.dateKey)}
                </span>
              </div>

              {/* Day's Transactions */}
              <div className="divide-y divide-gray-800">
                {group.items.map(tx => {
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors cursor-pointer group select-none"
                    >
                      {/* Left: Category Icon + Details */}
                      <div className="flex items-center gap-4 min-w-0 pr-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-400 transition-colors shrink-0">
                          <CategoryIcon name={tx.categoryIcon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {tx.merchant || tx.categoryName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {tx.accountName} • {formatTime(tx.date)}
                            {tx.tags && tx.tags.length > 0 && (
                              <span> • <span className="text-indigo-400/80">#{tx.tags[0]}</span></span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Type */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold tabular-nums currency-amount ${
                            isIncome
                              ? 'text-emerald-400'
                              : isTransfer
                              ? 'text-indigo-400'
                              : 'text-white'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
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
