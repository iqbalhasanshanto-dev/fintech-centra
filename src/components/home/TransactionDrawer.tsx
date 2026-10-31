import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, ChevronLeft, X, ChevronDown, Check, Pin } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, getTransactionDisplay } from '../../utils/formatters';
import { CentraDB } from '../../db/storage';
import { useBackHandler } from '../../utils/backButton';
import { downloadOrShareCSV } from '../../utils/csvExport';

interface TransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

const PAYMENT_METHODS = [
  { id: 'all', label: 'All Payment Methods' },
  { id: 'Cash', label: 'Cash' },
  { id: 'Card Payment', label: 'Card Payment' },
  { id: 'Mobile Banking', label: 'Mobile Banking' },
  { id: 'Bank Transfer', label: 'Bank Transfer' },
];

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTransaction,
}) => {
  useBackHandler(isOpen, onClose);

  const { transactions, categories, settings } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<'category' | 'account' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter out internal system categories (e.g. transfer, goal contribution, uncategorized)
  const visibleCategories = useMemo(() => {
    return categories.filter(c => !['transfer', 'goal_contribution', 'uncategorized'].includes(c.systemKey || ''));
  }, [categories]);

  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'All Categories';
    const found = categories.find(c => c.id === selectedCategory);
    return found ? found.name : 'All Categories';
  }, [selectedCategory, categories]);

  const selectedAccountLabel = useMemo(() => {
    const found = PAYMENT_METHODS.find(m => m.id === selectedAccount);
    return found ? found.label : selectedAccount;
  }, [selectedAccount]);

  // Pinned-first, then newest date
  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .filter(tx => {
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

        // Payment Method / Account
        const matchesAccount =
          selectedAccount === 'all' ||
          tx.accountId === selectedAccount ||
          (tx.accountName && tx.accountName.toLowerCase().includes(selectedAccount.toLowerCase()));

        return matchesSearch && matchesCategory && matchesType && matchesAccount;
      });
  }, [transactions, searchQuery, selectedCategory, selectedType, selectedAccount]);

  const handleExportCSV = async () => {
    const csvContent = CentraDB.exportTransactionsCSV();
    const filename = `centra_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    const success = await downloadOrShareCSV(csvContent, filename);
    if (success) {
      setToastMessage('✓ Exported transactions to CSV');
    } else {
      setToastMessage('No transactions to export yet');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  const drawerNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recent Activities - All Transactions"
      className="fixed inset-0 z-[100] bg-[#F7F8FA] dark:bg-[#000000] flex flex-col overflow-hidden"
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] bg-black/90 dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Top Header Bar matching unified spec */}
      <div
        className="shrink-0 w-full bg-[#F7F8FA] dark:bg-[#000000] border-b border-black/5 dark:border-white/10"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18212F] dark:text-white text-center">
            Recent Activities
            <span className="sr-only"> - All Transactions</span>
          </h1>

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
      </div>

      {/* Content Scroll Container */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-28"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-lg mx-auto space-y-4">

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

        {/* Category & Payment Method Custom Dropdowns */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Custom Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(prev => prev === 'category' ? null : 'category')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white font-medium text-xs hover:border-[#C6FF3D] transition-colors cursor-pointer"
              aria-label="Filter by category"
            >
              <span className="truncate">{selectedCategoryLabel}</span>
              <ChevronDown className={`ml-1.5 w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'category' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute left-0 top-full mt-1.5 w-full max-h-56 overflow-y-auto bg-white dark:bg-[#1D1D1D] rounded-2xl shadow-xl border border-black/[0.08] dark:border-white/[0.12] py-1.5 z-50 animate-fade-in no-scrollbar">
                  <button
                    type="button"
                    onClick={() => { setSelectedCategory('all'); setOpenDropdown(null); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-[#F1F2F4] dark:hover:bg-[#262626] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span>All Categories</span>
                    {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-[#4D6E18] dark:text-[#C6FF3D]" />}
                  </button>
                  {visibleCategories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCategory(c.id); setOpenDropdown(null); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-[#F1F2F4] dark:hover:bg-[#262626] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="truncate">{c.name}</span>
                      {selectedCategory === c.id && <Check className="w-3.5 h-3.5 text-[#4D6E18] dark:text-[#C6FF3D]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Custom Payment Method Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(prev => prev === 'account' ? null : 'account')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white font-medium text-xs hover:border-[#C6FF3D] transition-colors cursor-pointer"
              aria-label="Filter by payment method"
            >
              <span className="truncate">{selectedAccountLabel}</span>
              <ChevronDown className={`ml-1.5 w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === 'account' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'account' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute right-0 top-full mt-1.5 w-full max-h-56 overflow-y-auto bg-white dark:bg-[#1D1D1D] rounded-2xl shadow-xl border border-black/[0.08] dark:border-white/[0.12] py-1.5 z-50 animate-fade-in no-scrollbar">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setSelectedAccount(m.id); setOpenDropdown(null); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-[#F1F2F4] dark:hover:bg-[#262626] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="truncate">{m.label}</span>
                      {selectedAccount === m.id && <Check className="w-3.5 h-3.5 text-[#4D6E18] dark:text-[#C6FF3D]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transactions Card */}
        <div className="rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.15] p-5 shadow-xs">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
              No matching transactions found.
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {filteredTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isTransfer = tx.type === 'transfer';
                const display = getTransactionDisplay(tx);

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className={`py-3 px-2 flex items-center justify-between cursor-pointer rounded-2xl transition-colors select-none border my-1 ${
                      tx.isPinned
                        ? 'bg-[#C6FF3D]/[0.06] dark:bg-[#C6FF3D]/[0.05] border-[#C6FF3D]/30 dark:border-[#C6FF3D]/25'
                        : 'border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-semibold text-[#18212F] dark:text-white truncate">
                            {display.title}
                          </p>
                          {tx.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-[#659300] dark:text-[#C6FF3D] fill-current shrink-0 rotate-45" />
                          )}
                        </div>
                        <p className="text-xs text-[#667085] dark:text-[#9CA3AF] truncate mt-0.5">
                          {display.subtitle}
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
  </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : drawerNode;
};
