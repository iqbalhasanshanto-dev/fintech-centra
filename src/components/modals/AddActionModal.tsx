import React, { useState, useRef } from 'react';
import { 
  Plus, 
  ArrowRightLeft, 
  Target, 
  PieChart, 
  Check, 
  Calendar, 
  CreditCard, 
  Tag, 
  FileText, 
  Sparkles,
  Repeat,
  Paperclip,
  X,
  Upload,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, convertCurrency } from '../../utils/formatters';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'transaction' | 'transfer' | 'goal' | 'budget' | 'spend' | 'income';
}

export const AddActionModal: React.FC<AddActionModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'transaction',
}) => {
  const { 
    accounts, 
    categories, 
    addTransaction, 
    transferFunds, 
    addGoal, 
    addBudget, 
    settings,
    addNotification
  } = useFinance();

  // Mode: 'spend' | 'income' | 'transfer' | 'goal' | 'budget'
  const [activeTab, setActiveTab] = useState<'spend' | 'income' | 'transfer' | 'goal' | 'budget'>('spend');

  React.useEffect(() => {
    if (isOpen) {
      if (defaultTab === 'transfer') setActiveTab('transfer');
      else if (defaultTab === 'goal') setActiveTab('goal');
      else if (defaultTab === 'budget') setActiveTab('budget');
      else if (defaultTab === 'income') setActiveTab('income');
      else setActiveTab('spend');
    }
  }, [isOpen, defaultTab]);

  // Form State: Common
  const [amount, setAmount] = useState('');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_dining');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_checking');
  const [note, setNote] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Transfer
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferNote, setTransferNote] = useState('');

  // Form State: Goal
  const [goalName, setGoalName] = useState('');
  const [goalInitialDeposit, setGoalInitialDeposit] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('2027-06-30');

  // Form State: Budget
  const [budgetCategoryId, setBudgetCategoryId] = useState(categories[0]?.id || '');
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(80);

  // Toast / feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const res = uploadEvent.target?.result as string;
        if (res) setReceiptPreview(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptPreview(null);
    setReceiptName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetTransactionFields = () => {
    setAmount('');
    setMerchant('');
    setNote('');
    removeReceipt();
  };

  // Perform Save for Transaction / Spend / Income
  const executeSaveTransaction = async (keepOpen: boolean = false) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return false;
    }

    const selectedCat = categories.find(c => c.id === categoryId);
    const selectedAcc = accounts.find(a => a.id === accountId);
    const type = activeTab === 'income' ? 'income' : 'expense';

    await addTransaction({
      type,
      amount: parsedAmount,
      currency: selectedAcc?.currency || settings.baseCurrency,
      categoryId,
      categoryName: selectedCat?.name || 'General',
      categoryIcon: selectedCat?.icon || 'HelpCircle',
      categoryColor: selectedCat?.color || '#6366f1',
      accountId,
      accountName: selectedAcc?.name || 'Primary Account',
      merchant: merchant.trim() || (selectedCat?.name || (type === 'income' ? 'Income' : 'Expense')),
      date: new Date(`${txDate}T12:00:00.000Z`).toISOString(),
      note: note.trim() + (receiptName ? ` [Attached: ${receiptName}]` : ''),
      tags: [type === 'income' ? 'Income' : 'Spend'],
    });

    if (keepOpen) {
      resetTransactionFields();
      setFeedbackMsg(`✓ ${type === 'income' ? 'Income' : 'Spend'} saved! Ready for next.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      resetTransactionFields();
      onClose();
    }
    return true;
  };

  // Perform Save for Transfer
  const executeSaveTransfer = async (keepOpen: boolean = false) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid transfer amount.');
      return false;
    }
    if (fromAccountId === toAccountId) {
      alert('Please choose different source and destination accounts.');
      return false;
    }

    await transferFunds(fromAccountId, toAccountId, parsedAmount, transferNote || note);

    if (keepOpen) {
      setAmount('');
      setTransferNote('');
      setNote('');
      setFeedbackMsg('✓ Transfer executed! Ready for next.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setAmount('');
      setTransferNote('');
      setNote('');
      onClose();
    }
    return true;
  };

  // Perform Save for Goal
  const executeSaveGoal = (keepOpen: boolean = false) => {
    const target = parseFloat(amount);
    const deposit = parseFloat(goalInitialDeposit) || 0;
    if (!goalName || !target || target <= 0) {
      alert('Please enter goal name and valid target amount.');
      return false;
    }

    addGoal({
      name: goalName.trim(),
      icon: 'Target',
      color: '#6366f1',
      targetAmount: target,
      currentAmount: deposit,
      startDate: txDate,
      targetDate: goalTargetDate,
      linkedAccountId: accountId,
    });

    if (keepOpen) {
      setAmount('');
      setGoalName('');
      setGoalInitialDeposit('');
      setFeedbackMsg('✓ Goal created! Ready for next.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setAmount('');
      setGoalName('');
      setGoalInitialDeposit('');
      onClose();
    }
    return true;
  };

  // Perform Save for Budget
  const executeSaveBudget = (keepOpen: boolean = false) => {
    const limit = parseFloat(amount);
    if (!limit || limit <= 0) {
      alert('Please enter a valid monthly limit amount.');
      return false;
    }

    const cat = categories.find(c => c.id === budgetCategoryId);
    addBudget({
      categoryId: budgetCategoryId,
      categoryName: cat?.name || 'Category',
      categoryIcon: cat?.icon || 'PieChart',
      categoryColor: cat?.color || '#6366f1',
      limitAmount: limit,
      spentAmount: 0,
      alertThreshold: budgetAlertThreshold,
      period: 'monthly',
    });

    if (keepOpen) {
      setAmount('');
      setFeedbackMsg('✓ Budget created! Ready for next.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setAmount('');
      onClose();
    }
    return true;
  };

  const handleSave = (keepOpen: boolean = false) => {
    if (activeTab === 'spend' || activeTab === 'income') {
      executeSaveTransaction(keepOpen);
    } else if (activeTab === 'transfer') {
      executeSaveTransfer(keepOpen);
    } else if (activeTab === 'goal') {
      executeSaveGoal(keepOpen);
    } else if (activeTab === 'budget') {
      executeSaveBudget(keepOpen);
    }
  };

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  const toAcc = accounts.find(a => a.id === toAccountId);

  // Card background styling based on active type
  const getCardTheme = () => {
    switch (activeTab) {
      case 'spend':
        return {
          bg: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40',
          badge: 'text-rose-700 dark:text-rose-300',
          title: 'Enter Spent Amount',
          symbolColor: 'text-rose-600 dark:text-rose-400',
        };
      case 'income':
        return {
          bg: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/40',
          badge: 'text-emerald-700 dark:text-emerald-300',
          title: 'Enter Earned Amount',
          symbolColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'transfer':
        return {
          bg: 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-900/40',
          badge: 'text-sky-700 dark:text-sky-300',
          title: 'Enter Transferred Amount',
          symbolColor: 'text-sky-600 dark:text-sky-400',
        };
      case 'goal':
        return {
          bg: 'bg-indigo-50/90 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-900/40',
          badge: 'text-indigo-700 dark:text-indigo-300',
          title: 'Enter Target Amount',
          symbolColor: 'text-indigo-600 dark:text-indigo-400',
        };
      case 'budget':
        return {
          bg: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40',
          badge: 'text-amber-700 dark:text-amber-300',
          title: 'Enter Monthly Limit',
          symbolColor: 'text-amber-600 dark:text-amber-400',
        };
    }
  };

  const cardTheme = getCardTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Action"
      subtitle="Record transaction or set financial plan"
    >
      <div className="space-y-4">
        {/* Top Segmented Control (Pill-shaped segments with dark filled active state) */}
        <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-[#1e2638] rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('spend')}
            className={`flex-1 min-w-[64px] py-2 px-2.5 rounded-xl text-center transition-all ${
              activeTab === 'spend'
                ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm'
                : 'text-gray-500 hover:text-ink dark:text-[#64748b] dark:hover:text-[#f8fafc]'
            }`}
          >
            Spend
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex-1 min-w-[64px] py-2 px-2.5 rounded-xl text-center transition-all ${
              activeTab === 'income'
                ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm'
                : 'text-gray-500 hover:text-ink dark:text-[#64748b] dark:hover:text-[#f8fafc]'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 min-w-[64px] py-2 px-2.5 rounded-xl text-center transition-all ${
              activeTab === 'transfer'
                ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm'
                : 'text-gray-500 hover:text-ink dark:text-[#64748b] dark:hover:text-[#f8fafc]'
            }`}
          >
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goal')}
            className={`flex-1 min-w-[64px] py-2 px-2.5 rounded-xl text-center transition-all ${
              activeTab === 'goal'
                ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm'
                : 'text-gray-500 hover:text-ink dark:text-[#64748b] dark:hover:text-[#f8fafc]'
            }`}
          >
            Goal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex-1 min-w-[64px] py-2 px-2.5 rounded-xl text-center transition-all ${
              activeTab === 'budget'
                ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm'
                : 'text-gray-500 hover:text-ink dark:text-[#64748b] dark:hover:text-[#f8fafc]'
            }`}
          >
            Budget
          </button>
        </div>

        {/* Feedback message toast */}
        {feedbackMsg && (
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center animate-fade-in">
            {feedbackMsg}
          </div>
        )}

        {/* Colored Header Card */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${cardTheme.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${cardTheme.badge}`}>
              {cardTheme.title}
            </span>
            <div className="flex items-center space-x-1.5 bg-white/80 dark:bg-[#131722]/80 px-2.5 py-1 rounded-xl border border-black/5 dark:border-white/10 text-xs text-ink dark:text-[#f8fafc]">
              <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-[#64748b]" />
              <input
                type="date"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Large Amount Input with ৳ currency symbol and BDT label */}
          <div className="relative flex items-center mt-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-display mr-2 ${cardTheme.symbolColor}`}>
              ৳
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-transparent text-3xl sm:text-4xl font-black font-display text-ink dark:text-[#f8fafc] focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
            />
            <span className="text-xs font-bold uppercase text-gray-400 dark:text-[#64748b] shrink-0 ml-2">
              BDT
            </span>
          </div>
        </div>

        {/* Form Fields below Amount Card */}
        <div className="space-y-3.5">
          {/* SPEND / INCOME FLOW */}
          {(activeTab === 'spend' || activeTab === 'income') && (
            <>
              {/* 1. Paid To / Received From */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  {activeTab === 'spend' ? 'Paid To (Merchant / Payee)' : 'Received From (Source / Client)'}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'spend' ? 'e.g. Starbucks Coffee, Apple Store' : 'e.g. Monthly Salary, Freelance Client'}
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 2. Category Dropdown with CategoryIcon */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {categories
                    .filter(c => (activeTab === 'spend' ? c.type === 'expense' : c.type === 'income'))
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* 3. Payment Method / Account Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Payment Method / Account
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Balance: {formatCurrency(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Notes / Memo
                </label>
                <input
                  type="text"
                  placeholder="Optional memo or description"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 5. Attach Receipt / Bill */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Attach Receipt / Bill
                </label>
                {receiptName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/40 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <Receipt className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span className="font-semibold text-brand-900 dark:text-brand-200 truncate">{receiptName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-dashed border-gray-300 dark:border-[#1e2638] hover:bg-gray-50 dark:hover:bg-[#1e2638]/40 text-xs font-semibold text-gray-600 dark:text-[#64748b] flex items-center justify-center space-x-2 transition-all"
                  >
                    <Paperclip className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Upload receipt or invoice</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptChange}
                  className="hidden"
                />
              </div>
            </>
          )}

          {/* TRANSFER FLOW */}
          {activeTab === 'transfer' && (
            <>
              {/* To & From Accounts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                    From Account
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={e => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance, a.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                    To Account
                  </label>
                  <select
                    value={toAccountId}
                    onChange={e => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion indicator if accounts differ */}
              {fromAcc && toAcc && fromAcc.currency !== toAcc.currency && amount && (
                <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300">
                  Target conversion: <span className="font-bold">{formatCurrency(convertCurrency(parseFloat(amount) || 0, fromAcc.currency, toAcc.currency), toAcc.currency)}</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Purpose / Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Savings allocation, Rent share"
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                />
              </div>

              {/* Attach Receipt */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Attach Transfer Slip (Optional)
                </label>
                {receiptName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/40 text-xs">
                    <span className="font-semibold text-brand-900 dark:text-brand-200 truncate">{receiptName}</span>
                    <button type="button" onClick={removeReceipt} className="text-gray-400 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-dashed border-gray-300 dark:border-[#1e2638] hover:bg-gray-50 dark:hover:bg-[#1e2638]/40 text-xs font-semibold text-gray-600 dark:text-[#64748b] flex items-center justify-center space-x-2"
                  >
                    <Paperclip className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Upload transfer slip</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptChange}
                  className="hidden"
                />
              </div>
            </>
          )}

          {/* GOAL FLOW */}
          {activeTab === 'goal' && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Goal Name / Target
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dream Apartment Deposit, Tokyo Trip"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                    Initial Deposit ({settings.baseCurrency})
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={goalInitialDeposit}
                    onChange={e => setGoalInitialDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={e => setGoalTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Linked Savings Account
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* BUDGET FLOW */}
          {activeTab === 'budget' && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Category
                </label>
                <select
                  value={budgetCategoryId}
                  onChange={e => setBudgetCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Alert Threshold ({budgetAlertThreshold}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={budgetAlertThreshold}
                  onChange={e => setBudgetAlertThreshold(parseInt(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-[#64748b] mt-1">
                  <span>50%</span>
                  <span>80% (Recommended)</span>
                  <span>100%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons: "Save & Add" (Outline) and "Save" (Filled Dark) */}
        <div className="grid grid-cols-2 gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="py-3.5 rounded-2xl border border-gray-300 dark:border-[#1e2638] hover:bg-gray-50 dark:hover:bg-[#1e2638]/80 active:scale-98 text-ink dark:text-[#f8fafc] font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Save & Add</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
