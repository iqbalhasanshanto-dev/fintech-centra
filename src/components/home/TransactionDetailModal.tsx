import React, { useState } from 'react';
import { Pin, Trash2, Edit2, Calendar, CreditCard, Tag, FileText, Check } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatFullDate, formatTime } from '../../utils/formatters';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { togglePinTransaction, deleteTransaction, updateTransaction, settings, categories } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Reset form when transaction opens
  React.useEffect(() => {
    if (transaction) {
      setMerchant(transaction.merchant || transaction.categoryName);
      setNote(transaction.note || '');
      setCategoryId(transaction.categoryId);
      setIsEditing(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSaveEdit = () => {
    const chosenCategory = categories.find(c => c.id === categoryId);
    updateTransaction(transaction.id, {
      merchant,
      note,
      categoryId,
      categoryName: chosenCategory ? chosenCategory.name : transaction.categoryName,
      categoryIcon: chosenCategory ? chosenCategory.icon : transaction.categoryIcon,
      categoryColor: chosenCategory ? chosenCategory.color : transaction.categoryColor,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this transaction? This will revert account balances.')) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Transaction' : 'Transaction Details'}>
      <div className="space-y-5">
        
        {/* Top Summary Banner */}
        <div className="text-center py-5 px-4 rounded-2xl bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45]">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 shadow-xs"
          >
            <CategoryIcon name={transaction.categoryIcon} className="w-6 h-6" />
          </div>

          <div
            className={`text-3xl font-bold tabular-nums currency-amount ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-gray-900 dark:text-white' : 'text-brand-600 dark:text-brand-400'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : ''}
            {formatCurrency(transaction.amount, transaction.currency, settings.privacyMode)}
          </div>

          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
            {transaction.merchant || transaction.categoryName}
          </p>

          {transaction.isRecurring && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50">
              Recurring ({transaction.recurringInterval})
            </span>
          )}
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-[#232C45]">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Account</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {transaction.accountName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-[#232C45]">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date & Time</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatFullDate(transaction.date)} at {formatTime(transaction.date)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-[#232C45]">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <Tag className="w-3.5 h-3.5" />
                <span>Category</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {transaction.categoryName}
              </span>
            </div>

            {transaction.note && (
              <div className="py-2.5 border-b border-gray-100 dark:border-[#232C45]">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Note</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] p-3 rounded-xl text-xs leading-relaxed">
                  {transaction.note}
                </p>
              </div>
            )}

            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex items-center space-x-2 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {transaction.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-900/40 text-[10px] font-bold uppercase tracking-wider"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 grid grid-cols-3 gap-2">
              <button
                onClick={() => togglePinTransaction(transaction.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  transaction.isPinned
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50'
                    : 'bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1A233A]'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${transaction.isPinned ? 'fill-brand-600 dark:fill-brand-400' : ''}`} />
                <span>{transaction.isPinned ? 'Pinned' : 'Pin'}</span>
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1A233A] text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDelete}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                Merchant / Description
              </label>
              <input
                type="text"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                Note
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1A233A] font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-float cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
