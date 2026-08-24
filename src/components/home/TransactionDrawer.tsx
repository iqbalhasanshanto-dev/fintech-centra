import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, X, Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { Modal } from '../ui/Modal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatFullDate } from '../../utils/formatters';
import { CentraDB } from '../../db/storage';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Transactions" subtitle={`${filteredTransactions.length} recorded items`}>
      <div className="space-y-4">
        
        {/* Search input & CSV Export button */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#64748b]" />
            <input
              type="text"
              placeholder="Search merchant, tag, note..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748b] hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-2xl bg-gray-100 dark:bg-[#1e2638] text-gray-700 dark:text-[#f8fafc] hover:bg-gray-200 dark:hover:bg-[#1e2638]/80 text-xs font-bold flex items-center space-x-1 shrink-0"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        {/* Filter Badges Carousel */}
        <div className="space-y-2">
          {/* Type filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                selectedType === 'all'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                selectedType === 'expense'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                selectedType === 'income'
                  ? 'bg-growth text-white font-bold'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setSelectedType('transfer')}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                selectedType === 'transfer'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              Transfers
            </button>
          </div>

          {/* Category Dropdown & Account Dropdown in a row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc]"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc]"
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="divide-y divide-gray-100 dark:divide-[#1e2638] max-h-[50vh] overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-[#64748b]">
              No matching transactions found.
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    onSelectTransaction(tx);
                  }}
                  className="py-3 px-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2638]/40 cursor-pointer rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${tx.categoryColor}18`,
                        color: tx.categoryColor,
                      }}
                    >
                      <CategoryIcon name={tx.categoryIcon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink dark:text-[#f8fafc] truncate">
                        {tx.merchant || tx.categoryName}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-[#64748b]">
                        {tx.accountName} • {formatFullDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold font-display ${
                        isIncome ? 'text-growth' : isExpense ? 'text-ink dark:text-[#f8fafc]' : 'text-brand-600 dark:text-brand-400'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </Modal>
  );
};
