import React, { useState, useRef } from 'react';
import { Pin, Trash2, Edit2, Calendar, CreditCard, Tag, FileText, Check, Paperclip, X, ChevronDown, User } from 'lucide-react';
import { Transaction, Category } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { DatePicker } from '../ui/DatePicker';
import { FIGMA_DEFAULT_CATEGORIES, CentraDB } from '../../db/storage';
import { formatCurrency, formatFullDate, formatTime, getTransactionDisplay } from '../../utils/formatters';
import { getCurrencyInfo } from '../../utils/currencies';
import { useBackHandler } from '../../utils/backButton';
import { sanitizeText } from '../../utils/sanitize';
import { validateLabel, validateNote } from '../../utils/validators';
import { validateImageFile, processImage } from '../../utils/security';
import { logger } from '../../utils/logger';

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
  const { togglePinTransaction, deleteTransaction, updateTransaction, settings, categories, transactions } = useFinance();
  const currentTx = (transaction ? transactions.find(t => t.id === transaction.id) : null) || transaction;

  useBackHandler(isOpen, onClose);

  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState('');
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editReceiptUrl, setEditReceiptUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isPinTapping, setIsPinTapping] = useState(false);

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

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setIsProcessingImage(true);
    try {
      const validation = await validateImageFile(file);
      if (!validation.ok) {
        setImageError(validation.error || 'Please upload a valid JPEG, PNG, or WebP receipt image.');
        if (editFileInputRef.current) editFileInputRef.current.value = '';
        return;
      }

      const processed = await processImage(file, { maxDimension: 1200, quality: 0.8 });
      setEditReceiptUrl(processed.dataUrl);
    } catch {
      setImageError('Failed to process image. Please try again.');
    } finally {
      setIsProcessingImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Reset form when transaction opens
  React.useEffect(() => {
    if (transaction) {
      const disp = getTransactionDisplay(transaction);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Form state must synchronize when active transaction prop changes
      setMerchant(disp.hasCustomMerchant ? disp.rawMerchant : '');
      setMerchantError(null);
      setNote(disp.cleanNote);
      setNoteError(null);
      setCategoryId(transaction.categoryId);
      setEditDate(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setEditAmount(String(transaction.amount));
      setAmountError(null);
      setEditReceiptUrl(transaction.receiptUrl || null);
      setImageError(null);
      setIsCategoryPickerOpen(false);
      setIsEditing(false);
    }
  }, [transaction]);

  const availableCategories = React.useMemo(() => {
    if (!currentTx) return [];
    const isIncome = currentTx.type === 'income';
    const isHiddenSystem = (c: Category) =>
      ['transfer', 'goal_contribution', 'uncategorized'].includes(c.systemKey || '') || c.hidden;

    const filtered = categories.filter(c => {
      if (isHiddenSystem(c)) return false;
      return isIncome ? c.type === 'income' : c.type === 'expense';
    });
    const defaults = FIGMA_DEFAULT_CATEGORIES.filter(c => {
      if (isHiddenSystem(c)) return false;
      return isIncome ? c.type === 'income' : c.type === 'expense';
    });
    const merged = [...filtered];
    for (const def of defaults) {
      if (!merged.some(m => m.name.toLowerCase() === def.name.toLowerCase() || m.id === def.id)) {
        merged.push(def);
      }
    }
    return merged;
  }, [categories, currentTx]);

  const selectedCategoryObj = React.useMemo(() => {
    return availableCategories.find(c => c.id === categoryId) || categories.find(c => c.id === categoryId) || null;
  }, [availableCategories, categories, categoryId]);

  if (!currentTx) return null;

  const display = getTransactionDisplay(currentTx);

  const handleSaveEdit = () => {
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      return;
    }

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

    const chosenCategory = availableCategories.find(c => c.id === categoryId) || categories.find(c => c.id === categoryId);
    if (chosenCategory && !categories.some(c => c.id === chosenCategory.id)) {
      CentraDB.upsertCategory(chosenCategory).catch(err => {
        logger.warn('Failed to upsert default category on edit save:', err);
      });
    }

    let updatedIsoDate = currentTx.date;
    try {
      if (editDate) {
        const orig = new Date(currentTx.date);
        const [y, m, d] = editDate.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          orig.setFullYear(y, m - 1, d);
          updatedIsoDate = orig.toISOString();
        } else {
          updatedIsoDate = new Date(`${editDate}T12:00:00Z`).toISOString();
        }
      }
    } catch {
      updatedIsoDate = currentTx.date;
    }

    updateTransaction(currentTx.id, {
      amount: parsedAmount,
      merchant: merchant.trim() ? sanitizeText(merchant, 60) : '',
      note: note.trim()
        ? sanitizeText(note, 500) + (editReceiptUrl && !note.includes('[Attached:') ? ` [Attached: Receipt]` : '')
        : (editReceiptUrl ? `[Attached: Receipt]` : ''),
      categoryId,
      categoryName: chosenCategory ? chosenCategory.name : currentTx.categoryName,
      categoryIcon: chosenCategory ? chosenCategory.icon : currentTx.categoryIcon,
      categoryColor: chosenCategory ? chosenCategory.color : currentTx.categoryColor,
      date: updatedIsoDate,
      receiptUrl: editReceiptUrl || undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteTransaction(currentTx.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const isIncome = currentTx.type === 'income';
  const isExpense = currentTx.type === 'expense';
  const isTransfer = currentTx.type === 'transfer';

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
              <CategoryIcon name={currentTx.categoryIcon} className="w-6 h-6" />
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
              {formatCurrency(currentTx.amount, currentTx.currency, settings.privacyMode)}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#18212F] dark:text-white mt-1.5 truncate max-w-full px-2">
              {display.title}
            </h2>

            <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                {currentTx.categoryName}
              </span>
              {currentTx.isRecurring && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  Recurring ({currentTx.recurringInterval})
                </span>
              )}
            </div>
          </div>

          {/* View Mode */}
          {!isEditing ? (
            <div className="space-y-3 text-xs">
              {currentTx.type !== 'income' && (
                <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Account</span>
                  </div>
                  <span className="font-semibold text-[#18212F] dark:text-white">
                    {currentTx.accountName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date & Time</span>
                </div>
                <span className="font-semibold text-[#18212F] dark:text-white">
                  {formatFullDate(currentTx.date)} at {formatTime(currentTx.date)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category</span>
                </div>
                <span className="font-semibold text-[#18212F] dark:text-white">
                  {currentTx.categoryName}
                </span>
              </div>

              {display.hasCustomMerchant && (
                <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px]">
                    <User className="w-3.5 h-3.5" />
                    <span>{isIncome ? 'Received From' : 'Paid To'}</span>
                  </div>
                  <span className="font-semibold text-[#18212F] dark:text-white">
                    {display.rawMerchant}
                  </span>
                </div>
              )}

              {display.cleanNote && (
                <div className="py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px] mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Note</span>
                  </div>
                  <p className="text-[#18212F] dark:text-white bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] p-3 rounded-2xl text-xs leading-relaxed">
                    {display.cleanNote}
                  </p>
                </div>
              )}

              {currentTx.receiptUrl && (
                <div className="py-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2 text-[#667085] dark:text-[#9CA3AF] font-bold uppercase tracking-widest text-[10px] mb-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attached Receipt</span>
                  </div>
                  <img
                    src={currentTx.receiptUrl}
                    alt="Receipt"
                    onClick={() => setShowLightbox(true)}
                    className="w-full max-h-56 object-cover rounded-2xl border border-black/[0.08] dark:border-white/[0.12] cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}

              {currentTx.tags && currentTx.tags.length > 0 && (
                <div className="flex items-center space-x-2 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF]">
                    Tags:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentTx.tags.map((t, idx) => (
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
                  onClick={() => {
                    setIsPinTapping(true);
                    setTimeout(() => setIsPinTapping(false), 360);
                    togglePinTransaction(currentTx.id);
                  }}
                  className={`py-2.5 px-3 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    isPinTapping ? 'animate-pop-tap animate-radial-burst' : ''
                  } ${
                    currentTx.isPinned
                      ? 'bg-[#C6FF3D] text-black shadow-xs'
                      : 'bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#18212F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${currentTx.isPinned ? 'fill-black' : ''}`} />
                  <span>{currentTx.isPinned ? 'Pinned' : 'Pin'}</span>
                </button>

                {currentTx.type !== 'transfer' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditAmount(String(currentTx.amount));
                      setAmountError(null);
                      setEditReceiptUrl(currentTx.receiptUrl || null);
                      setImageError(null);
                      setIsEditing(true);
                    }}
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Amount ({getCurrencyInfo(currentTx.currency).symbol || currentTx.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={editAmount}
                  onChange={e => {
                    setEditAmount(e.target.value);
                    if (amountError) setAmountError(null);
                  }}
                  className={`w-full h-[52px] px-4 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                    amountError ? 'border-rose-500' : 'border-black/[0.08] dark:border-white/[0.10]'
                  } text-[#18212F] dark:text-white text-xs font-semibold focus:outline-hidden focus:border-[#C6FF3D]`}
                />
                {amountError && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{amountError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  {currentTx.type === 'income' ? 'Received From' : 'Paid To'}
                </label>
                <input
                  type="text"
                  placeholder={currentTx.type === 'income' ? 'e.g. Employer, Client' : 'e.g. Supermarket, Landlord'}
                  value={merchant}
                  onChange={e => handleMerchantChange(e.target.value)}
                  className={`w-full h-[52px] px-4 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                    merchantError ? 'border-rose-500' : 'border-black/[0.08] dark:border-white/[0.10]'
                  } text-[#18212F] dark:text-white text-xs font-semibold focus:outline-hidden focus:border-[#C6FF3D]`}
                />
                {merchantError && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{merchantError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Date
                </label>
                <DatePicker
                  value={editDate}
                  onChange={setEditDate}
                  buttonClassName="w-full h-[52px] px-4 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.10] text-[#18212F] dark:text-white text-xs font-semibold flex items-center justify-between cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Category
                </label>
                {isCategoryPickerOpen ? (
                  <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-[#F1F2F4] dark:bg-[#262626] p-3 space-y-2.5 animate-scale-in">
                    <button
                      type="button"
                      onClick={() => setIsCategoryPickerOpen(false)}
                      className="w-full flex items-center justify-between cursor-pointer select-none text-left touch-manipulation"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          <CategoryIcon name={selectedCategoryObj?.icon || currentTx.categoryIcon} className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block">
                            CATEGORY
                          </span>
                          <h4 className="text-sm font-bold text-[#18212F] dark:text-white mt-0.5">
                            {selectedCategoryObj?.name || currentTx.categoryName}
                          </h4>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
                      </div>
                    </button>

                    <div className="h-px w-full bg-black/[0.06] dark:bg-white/[0.08]" />

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {availableCategories.map(cat => {
                        const isSelected = cat.id === categoryId;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setCategoryId(cat.id);
                              setIsCategoryPickerOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors select-none text-left touch-manipulation ${
                              isSelected
                                ? 'bg-[#4D6E18]/10 text-[#4D6E18] dark:bg-[#C6FF3D]/15 dark:text-[#C6FF3D] font-semibold'
                                : 'text-[#18212F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-[#4D6E18]/15 dark:bg-[#C6FF3D]/20 text-[#4D6E18] dark:text-[#C6FF3D]'
                                    : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                <CategoryIcon name={cat.icon} className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold truncate">{cat.name}</span>
                            </div>
                            <div className="shrink-0 ml-2">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-[#C6FF3D] text-[#0A0E1A] flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-black/20 dark:border-white/20" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCategoryPickerOpen(true)}
                    className="w-full h-[52px] px-4 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.10] text-[#18212F] dark:text-white text-xs font-semibold flex items-center justify-between cursor-pointer hover:border-[#C6FF3D] transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-300">
                        <CategoryIcon name={selectedCategoryObj?.icon || currentTx.categoryIcon} className="w-4 h-4" />
                      </div>
                      <span className="truncate text-xs font-semibold">
                        {selectedCategoryObj?.name || currentTx.categoryName || 'Select category'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  </button>
                )}

                {/* Synchronized hidden select for testing and accessibility */}
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="sr-only"
                  aria-label="Category"
                  tabIndex={-1}
                >
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={e => handleNoteChange(e.target.value)}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                    noteError ? 'border-rose-500' : 'border-black/[0.08] dark:border-white/[0.10]'
                  } text-[#18212F] dark:text-white text-xs font-medium focus:outline-hidden focus:border-[#C6FF3D]`}
                />
                {noteError && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{noteError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#667085] dark:text-[#9CA3AF] mb-1.5">
                  Receipt / Attachment
                </label>
                {editReceiptUrl ? (
                  <div className="p-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.10] flex items-center justify-between gap-3">
                    <img
                      src={editReceiptUrl}
                      alt="Receipt preview"
                      className="w-14 h-14 object-cover rounded-xl border border-black/[0.08] dark:border-white/[0.12]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="py-1.5 px-3 rounded-full bg-white dark:bg-[#1D1D1D] border border-black/[0.08] dark:border-white/[0.10] text-[#18212F] dark:text-white text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditReceiptUrl(null)}
                        className="py-1.5 px-3 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="w-full py-3 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#262626] text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-emerald-600 dark:text-[#C6FF3D]" />
                    <span>{isProcessingImage ? 'Processing image...' : 'Attach Receipt Image'}</span>
                  </button>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleReceiptFileChange}
                  className="hidden"
                />
                {imageError && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{imageError}</p>
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
                  disabled={!!merchantError || !!noteError || !!amountError || isProcessingImage}
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
      {showLightbox && currentTx.receiptUrl && (
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
            src={currentTx.receiptUrl}
            alt="Receipt Full Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
