import React, { useState } from 'react';
import { Pin, Trash2, Edit2, Calendar, CreditCard, Tag, FileText, Check, ArrowRightLeft } from 'lucide-react';
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
        <div className="text-center py-4 px-3 rounded-3xl bg-gray-50 dark:bg-[#1e2638]/40 border border-gray-100 dark:border-[#1e2638]">
          <div
            className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center shadow-md mb-3"
            style={{
              backgroundColor: `${transaction.categoryColor}25`,
              color: transaction.categoryColor,
            }}
          >
            <CategoryIcon name={transaction.categoryIcon} className="w-7 h-7" />
          </div>

          <div
            className={`text-3xl font-extrabold font-display currency-amount ${
              isIncome ? 'text-growth' : isExpense ? 'text-ink dark:text-[#f8fafc]' : 'text-brand-600 dark:text-brand-400'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : ''}
            {formatCurrency(transaction.amount, transaction.currency, settings.privacyMode)}
          </div>

          <p className="text-sm font-semibold text-gray-500 dark:text-[#64748b] mt-1">
            {transaction.merchant || transaction.categoryName}
          </p>

          {transaction.isRecurring && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              Recurring ({transaction.recurringInterval})
            </span>
          )}
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#1e2638]">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-[#64748b]">
                <CreditCard className="w-4 h-4" />
                <span>Account</span>
              </div>
              <span className="font-semibold text-ink dark:text-[#f8fafc]">
                {transaction.accountName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#1e2638]">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-[#64748b]">
                <Calendar className="w-4 h-4" />
                <span>Date & Time</span>
              </div>
              <span className="font-semibold text-ink dark:text-[#f8fafc]">
                {formatFullDate(transaction.date)} at {formatTime(transaction.date)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#1e2638]">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-[#64748b]">
                <Tag className="w-4 h-4" />
                <span>Category</span>
              </div>
              <span className="font-semibold text-ink dark:text-[#f8fafc]">
                {transaction.categoryName}
              </span>
            </div>

            {transaction.note && (
              <div className="py-2 border-b border-gray-100 dark:border-[#1e2638]">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-[#64748b] mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Note</span>
                </div>
                <p className="text-ink dark:text-[#f8fafc] bg-gray-50 dark:bg-[#1e2638] p-2.5 rounded-xl text-xs leading-relaxed">
                  {transaction.note}
                </p>
              </div>
            )}

            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex items-center space-x-2 py-2">
                <span className="text-xs text-gray-500 dark:text-[#64748b]">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {transaction.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold"
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
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  transaction.isPinned
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-[#1e2638]'
                    : 'bg-gray-100 text-gray-700 dark:bg-[#1e2638] dark:text-[#f8fafc] hover:bg-gray-200'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${transaction.isPinned ? 'fill-brand-600' : ''}`} />
                <span>{transaction.isPinned ? 'Pinned' : 'Pin'}</span>
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="py-2.5 px-3 rounded-2xl bg-gray-100 dark:bg-[#1e2638] text-gray-700 dark:text-[#f8fafc] hover:bg-gray-200 dark:hover:bg-[#1e2638]/80 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDelete}
                className="py-2.5 px-3 rounded-2xl bg-rose-50 text-danger dark:bg-rose-950/30 hover:bg-rose-100 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
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
              <label className="block text-xs font-bold text-gray-500 dark:text-[#64748b] mb-1">
                Merchant / Description
              </label>
              <input
                type="text"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-[#64748b] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-[#64748b] mb-1">
                Note
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-2xl bg-gray-100 dark:bg-[#1e2638] text-gray-700 dark:text-[#f8fafc] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center justify-center space-x-1"
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
