import React, { useState } from 'react';
import { Pin, Trash2, Edit2, Calendar, CreditCard, Tag, FileText, Check, Paperclip, X } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, formatFullDate, formatTime } from '../../utils/formatters';
import { useBackHandler } from '../../utils/backButton';
import { sanitizeText } from '../../utils/sanitize';
import { validateLabel, validateNote } from '../../utils/validators';

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

  useBackHandler(isOpen, onClose);

  const [isEditing, setIsEditing] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleMerchantChange = (val: string) => {
    setMerchant(val);
    if (val.trim()) {
      const res = validateLabel(val, 'Merchant', false);
      setMerchantError(res.ok ? null : res.error || null);
    } else {
      setMerchantError(null);
    }
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
    if (val.trim()) {
      const res = validateNote(val);
      setNoteError(res.ok ? null : res.error || null);
    } else {
      setNoteError(null);
    }
  };

  // Reset form when transaction opens
  React.useEffect(() => {
    if (transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Form state must synchronize when active transaction prop changes
      setMerchant(transaction.merchant || transaction.categoryName);
      setMerchantError(null);
      setNote(transaction.note || '');
      setNoteError(null);
      setCategoryId(transaction.categoryId);
      setIsEditing(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSaveEdit = () => {
    if (merchant.trim()) {
      const merchantRes = validateLabel(merchant, 'Merchant', false);
      if (!merchantRes.ok) {
        setMerchantError(merchantRes.error || 'Invalid merchant name');
        return;
      }
    }
    if (note.trim()) {
      const noteRes = validateNote(note);
      if (!noteRes.ok) {
        setNoteError(noteRes.error || 'Invalid note');
        return;
      }
    }

    const chosenCategory = categories.find(c => c.id === categoryId);
    updateTransaction(transaction.id, {
      merchant: merchant.trim() ? sanitizeText(merchant, 60) : transaction.categoryName,
      note: note.trim() ? sanitizeText(note, 500) : '',
      categoryId,
      categoryName: chosenCategory ? chosenCategory.name : transaction.categoryName,
      categoryIcon: chosenCategory ? chosenCategory.icon : transaction.categoryIcon,
      categoryColor: chosenCategory ? chosenCategory.color : transaction.categoryColor,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Transaction' : 'Transaction Details'}>
        <div className="space-y-5 p-1">
          {/* Top Summary Banner */}
          <div className="text-center py-6 px-4 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08]">
            <div
              className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                isIncome
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : isTransfer
                  ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              <CategoryIcon name={transaction.categoryIcon} className="w-6 h-6" />
            </div>

            <div
              className={`text-3xl font-bold tabular-nums currency-amount ${
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isExpense
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              {isIncome ? '+' : isExpense ? '-' : ''}
              {formatCurrency(transaction.amount, transaction.currency, settings.privacyMode)}
            </div>

            <p className="text-sm font-semibold text-[#18212F] dark:text-white mt-1">
              {transaction.merchant || transaction.categoryName}
            </p>

            {transaction.isRecurring && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                Recurring ({transaction.recurringInterval})
              </span>
            )}
          </div>

          {/* View Mode */}
          {!isEditing ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Account</span>
                </div>
                <span className="font-semibold text-[#18212F] dark:text-white">
                  {transaction.accountName}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date & Time</span>
                </div>
                <span className="font-semibold text-[#18212F] dark:text-white">
                  {formatFullDate(transaction.date)} at {formatTime(transaction.date)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category</span>
                </div>
                <span className="font-semibold text-[#18212F] dark:text-white">
                  {transaction.categoryName}
                </span>
              </div>

              {transaction.note && (
                <div className="py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px] mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Note</span>
                  </div>
                  <p className="text-[#18212F] dark:text-white bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] p-3 rounded-2xl text-xs leading-relaxed">
                    {transaction.note}
                  </p>
                </div>
              )}

              {transaction.receiptUrl && (
                <div className="py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px] mb-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attached Receipt</span>
                  </div>
                  <img
                    src={transaction.receiptUrl}
                    alt="Receipt"
                    onClick={() => setShowLightbox(true)}
                    className="w-full max-h-56 object-cover rounded-2xl border border-black/[0.08] dark:border-white/[0.12] cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}

              {transaction.tags && transaction.tags.length > 0 && (
                <div className="flex items-center space-x-2 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF]">
                    Tags:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {transaction.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#F1F2F4] dark:bg-[#262626] text-[#18212F] dark:text-white text-[10px] font-semibold"
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
                  type="button"
                  onClick={() => togglePinTransaction(transaction.id)}
                  className={`py-2.5 px-3 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    transaction.isPinned
                      ? 'bg-[#C6FF3D] text-black shadow-xs'
                      : 'bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${transaction.isPinned ? 'fill-black' : ''}`} />
                  <span>{transaction.isPinned ? 'Pinned' : 'Pin'}</span>
                </button>

                {transaction.type !== 'transfer' ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="py-2.5 px-3 rounded-full bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div
                    title="Transfers cannot be edited directly. Delete and recreate the transfer."
                    className="py-2.5 px-3 rounded-full bg-[#F1F2F4]/50 dark:bg-[#262626]/50 border border-black/[0.04] dark:border-white/[0.05] text-gray-400 dark:text-gray-600 text-xs font-medium flex items-center justify-center space-x-1.5 cursor-not-allowed select-none"
                  >
                    <Edit2 className="w-3.5 h-3.5 opacity-40" />
                    <span>Locked</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-2.5 px-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1">
                  Merchant / Description
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={e => handleMerchantChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                    merchantError ? 'border-rose-500' : 'border-black/[0.06] dark:border-white/[0.08]'
                  } text-[#18212F] dark:text-white text-xs focus:outline-none focus:border-[#C6FF3D] font-medium`}
                />
                {merchantError && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{merchantError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white text-xs focus:outline-none focus:border-[#C6FF3D] font-medium cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#1D1D1D] text-[#18212F] dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={e => handleNoteChange(e.target.value)}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                    noteError ? 'border-rose-500' : 'border-black/[0.06] dark:border-white/[0.08]'
                  } text-[#18212F] dark:text-white text-xs focus:outline-none focus:border-[#C6FF3D] font-medium`}
                />
                {noteError && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{noteError}</p>
                )}
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-full bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!!merchantError || !!noteError}
                  className="flex-1 py-3 rounded-full bg-[#18212F] dark:bg-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-bold text-xs flex items-center justify-center space-x-1 shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will revert account balances."
        type="danger"
        confirmText="Delete"
      />
      {showLightbox && transaction.receiptUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={transaction.receiptUrl}
            alt="Receipt Full Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
