import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { CentraDB } from '../../db/storage';
import { useBackHandler } from '../../utils/backButton';

interface TransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTransaction,
}) => {
  useBackHandler(isOpen, onClose);

  const { transactions, categories, accounts, settings } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search
      const matchesSearch =
        !searchQuery ||
        (tx.merchant && tx.merchant.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.tags && tx.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      // Category
      const matchesCategory = selectedCategory === 'all' || tx.categoryId === selectedCategory;

      // Type
      const matchesType = selectedType === 'all' || tx.type === selectedType;

      // Account
      const matchesAccount = selectedAccount === 'all' || tx.accountId === selectedAccount;

      return matchesSearch && matchesCategory && matchesType && matchesAccount;
    });
  }, [transactions, searchQuery, selectedCategory, selectedType, selectedAccount]);

  const handleExportCSV = () => {
    const csvContent = CentraDB.exportTransactionsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `centra_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recent Activities - All Transactions"
      className="fixed inset-0 z-50 bg-[#F7F8FA] dark:bg-[#000000] overflow-y-auto animate-fade-in"
    >
      <div className="w-full max-w-lg mx-auto p-4 sm:p-6 space-y-4 pb-28">
        {/* Top Header Bar (10-transactions-view-all.png) */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold tracking-tight text-[#18212F] dark:text-white text-center">
            Recent Activities
            <span className="sr-only"> - All Transactions</span>
          </h2>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Export CSV"
            aria-label="Export CSV"
          >
            <Download className="w-4 h-4 text-[#4D6E18] dark:text-[#C6FF3D]" />
          </button>
        </div>

        {/* Full-width Rounded Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-9 py-3.5 rounded-[20px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.12] text-sm text-[#18212F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#C6FF3D] transition-colors font-medium shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {(['all', 'expense', 'income', 'transfer'] as const).map(type => {
            const isSelected = selectedType === type;
            const label =
              type === 'all'
                ? 'All Types'
                : type === 'expense'
                ? 'Expenses'
                : type === 'income'
                ? 'Income'
                : 'Transfers';

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black dark:bg-[#C6FF3D] text-white dark:text-[#0A0E1A] shadow-xs'
                    : 'bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] text-[#667085] dark:text-[#9CA3AF] hover:text-[#18212F] dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Category & Account Selectors */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white focus:outline-none focus:border-[#C6FF3D] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-[#1D1D1D] text-[#18212F] dark:text-white">
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white focus:outline-none focus:border-[#C6FF3D] cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id} className="bg-white dark:bg-[#1D1D1D] text-[#18212F] dark:text-white">
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transactions Card (10-transactions-view-all.png) */}
        <div className="rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.15] p-5 min-h-[70vh] shadow-xs">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-24 text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
              No matching transactions found.
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {filteredTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isTransfer = tx.type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="py-3.5 px-1 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer rounded-2xl transition-colors select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isTransfer
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
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

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
