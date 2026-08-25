import React, { useMemo, useState } from 'react';
import { Pin, History, ChevronRight } from 'lucide-react';
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
  const { transactions, settings, periodFilter } = useFinance();
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
      {/* Header & Filter Controls: accessible See all button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-bold font-display text-gray-900 dark:text-[#FFFFFF]">
            Transactions
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1E2536] text-gray-600 dark:text-[#94A3B8] font-bold tabular-nums">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={onOpenSeeAll}
          className="min-h-[36px] px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#161B26] text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center space-x-1 transition-colors"
          aria-label="See all transactions"
        >
          <span>See all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs / Quick Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilterMode('all')}
          className={`min-h-[32px] px-3.5 py-1.5 rounded-xl font-semibold transition-colors ${
            filterMode === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#161B26] text-gray-600 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10'
          }`}
        >
          For the Period
        </button>
        <button
          onClick={() => setFilterMode('pinned')}
          className={`min-h-[32px] px-3.5 py-1.5 rounded-xl font-semibold transition-colors flex items-center space-x-1.5 ${
            filterMode === 'pinned'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#161B26] text-gray-600 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          <span>Pinned</span>
        </button>
        <button
          onClick={() => setFilterMode('expenses')}
          className={`min-h-[32px] px-3.5 py-1.5 rounded-xl font-semibold transition-colors ${
            filterMode === 'expenses'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#161B26] text-gray-600 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10'
          }`}
        >
          Outflow Only
        </button>
        <button
          onClick={() => setFilterMode('income')}
          className={`min-h-[32px] px-3.5 py-1.5 rounded-xl font-semibold transition-colors ${
            filterMode === 'income'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#161B26] text-gray-600 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10'
          }`}
        >
          Inflow Only
        </button>
      </div>

      {/* Date Grouped Transaction List */}
      {groupedTransactions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 rounded-xl">
          <History className="w-8 h-8 mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-gray-500 dark:text-[#94A3B8]">
            No transactions found for this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Header + Daily Spend Subtotal */}
              <div className="flex items-center justify-between px-1 text-xs font-bold text-gray-500 dark:text-[#94A3B8]">
                <span className="uppercase tracking-wider text-[11px] font-extrabold">
                  {formatDateHeader(group.dateKey)}
                </span>
                {group.dailySpendTotal > 0 && (
                  <span className="tabular-nums font-mono text-[11px]">
                    Spend: -{formatCurrency(group.dailySpendTotal, settings.baseCurrency, settings.privacyMode, false)}
                  </span>
                )}
              </div>

              {/* Transactions in this Day */}
              <div className="bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-sm">
                {group.items.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group select-none"
                  >
                    {/* Left: Category Icon + Details */}
                    <div className="flex items-center space-x-3 min-w-0 pr-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${tx.categoryColor}20`,
                          color: tx.categoryColor,
                        }}
                      >
                        <CategoryIcon name={tx.categoryIcon} className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-[#FFFFFF] truncate">
                            {tx.merchant || tx.categoryName}
                          </h4>
                          {tx.isPinned && (
                            <Pin className="w-3 h-3 fill-indigo-500 text-indigo-500 shrink-0" />
                          )}
                          {tx.isRecurring && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                              REC
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">
                          <span>{tx.accountName}</span>
                          <span>•</span>
                          <span>{formatTime(tx.date)}</span>
                          {tx.tags && tx.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                #{tx.tags[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs sm:text-sm font-extrabold font-display tabular-nums currency-amount ${
                          tx.type === 'income'
                            ? 'text-emerald-500'
                            : tx.type === 'transfer'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-900 dark:text-[#FFFFFF]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-[#94A3B8] uppercase font-mono">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
