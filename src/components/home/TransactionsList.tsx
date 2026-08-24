import React, { useMemo, useState } from 'react';
import { Pin, History, Filter, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Sparkles, ChevronRight } from 'lucide-react';
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
  const { transactions, settings, togglePinTransaction, periodFilter } = useFinance();
  const [filterMode, setFilterMode] = useState<'all' | 'pinned' | 'expenses' | 'income'>('all');

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterMode === 'pinned') return tx.isPinned;
      if (filterMode === 'expenses') return tx.type === 'expense';
      if (filterMode === 'income') return tx.type === 'income';
      return true;
    });
  }, [transactions, filterMode]);

  // Group transactions by date (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const groups: { dateKey: string; items: Transaction[]; dailySpendTotal: number }[] = [];
    const dateMap: Record<string, { items: Transaction[]; dailySpendTotal: number }> = {};

    filtered.forEach(tx => {
      const dateKey = tx.date.split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { items: [], dailySpendTotal: 0 };
        groups.push({ dateKey, ...dateMap[dateKey] });
      }
      dateMap[dateKey].items.push(tx);
      if (tx.type === 'expense') {
        dateMap[dateKey].dailySpendTotal += tx.amount;
      }
    });

    // Sort groups descending
    groups.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-3.5">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-bold font-display text-ink dark:text-white">
            Transactions
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={onOpenSeeAll}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center space-x-0.5 group"
        >
          <span>See all</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Filter Tabs / Quick Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
            filterMode === 'all'
              ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-xs'
              : 'bg-white dark:bg-surface-darkCard text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700'
          }`}
        >
          For the Period
        </button>
        <button
          onClick={() => setFilterMode('pinned')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center space-x-1 ${
            filterMode === 'pinned'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white dark:bg-surface-darkCard text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700'
          }`}
        >
          <Pin className="w-3 h-3" />
          <span>Pinned</span>
        </button>
        <button
          onClick={() => setFilterMode('expenses')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
            filterMode === 'expenses'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white dark:bg-surface-darkCard text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setFilterMode('income')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
            filterMode === 'income'
              ? 'bg-growth text-white shadow-xs'
              : 'bg-white dark:bg-surface-darkCard text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700'
          }`}
        >
          Income
        </button>
      </div>

      {/* Date-Grouped Transaction List */}
      {groupedTransactions.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white dark:bg-surface-darkCard rounded-3xl border border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mx-auto flex items-center justify-center mb-3">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
            No transactions found
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {filterMode === 'pinned'
              ? 'You have not pinned any transactions yet. Tap any transaction to pin it.'
              : 'Add your first transaction using the "+" button below.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Header with Daily Spend Total */}
              <div className="flex items-center justify-between px-2 text-xs">
                <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">
                  {formatDateHeader(group.dateKey)}
                </span>
                {group.dailySpendTotal > 0 && (
                  <span className="font-semibold text-gray-400 dark:text-gray-500 text-[11px]">
                    Spend: -{formatCurrency(group.dailySpendTotal, settings.baseCurrency, settings.privacyMode)}
                  </span>
                )}
              </div>

              {/* Transactions in this date */}
              <div className="bg-white dark:bg-surface-darkCard rounded-3xl border border-gray-100 dark:border-gray-800 shadow-soft overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/60">
                {group.items.map(tx => {
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="group p-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{
                            backgroundColor: `${tx.categoryColor}18`,
                            color: tx.categoryColor,
                          }}
                        >
                          <CategoryIcon name={tx.categoryIcon} className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-ink dark:text-white truncate">
                              {tx.merchant || tx.categoryName}
                            </span>
                            {tx.isPinned && (
                              <Pin className="w-3 h-3 text-brand-600 fill-brand-600 shrink-0" />
                            )}
                          </div>

                          {/* Account & Currency & Tags */}
                          <div className="flex items-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap gap-y-1">
                            <span className="truncate max-w-[120px]">
                              {tx.accountName}
                            </span>
                            <span>•</span>
                            <span>{formatTime(tx.date)}</span>
                            {tx.tags && tx.tags.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                                {tx.tags[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Resulting Account Balance */}
                      <div className="text-right shrink-0 ml-3">
                        <div
                          className={`text-sm sm:text-base font-extrabold font-display currency-amount ${
                            isIncome
                              ? 'text-growth'
                              : isExpense
                              ? 'text-ink dark:text-white'
                              : 'text-brand-600 dark:text-brand-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                        </div>

                        {tx.resultingBalance !== undefined && (
                          <div className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                            bal {formatCurrency(tx.resultingBalance, tx.currency, settings.privacyMode, false)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
