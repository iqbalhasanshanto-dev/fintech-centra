import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Check, 
  Calendar, 
  Paperclip,
  X,
  Receipt,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AddAccountModal } from './AddAccountModal';
import { formatCurrency } from '../../utils/formatters';
import { getCurrencyInfo } from '../../utils/currencies';
import { todayLocalDateKey } from '../../utils/dates';
import { CentraDB } from '../../db/storage';
import { useBackHandler } from '../../utils/backButton';
import { sanitizeText } from '../../utils/sanitize';
import { validateLabel, validateNote, validateAmount } from '../../utils/validators';
import { validateImageFile } from '../../utils/imageValidation';

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
    settings
  } = useFinance();

  // Mode: 'spend' | 'income' | 'transfer' | 'goal' | 'budget'
  const [activeTab, setActiveTab] = useState<'spend' | 'income' | 'transfer' | 'goal' | 'budget'>('spend');

  // Sub-modal for adding an account on the fly from empty states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Android hardware back button closes modal
  useBackHandler(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize active tab with defaultTab prop when modal opens
      if (defaultTab === 'transfer') setActiveTab('transfer');
      else if (defaultTab === 'goal') setActiveTab('goal');
      else if (defaultTab === 'budget') setActiveTab('budget');
      else if (defaultTab === 'income') setActiveTab('income');
      else setActiveTab('spend');
    }
  }, [isOpen, defaultTab]);

  // Form State: Common
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [txDate, setTxDate] = useState<string>(() => todayLocalDateKey());
  const [merchant, setMerchant] = useState('');
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Transfer
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferNoteError, setTransferNoteError] = useState<string | null>(null);

  // Form State: Goal
  const [goalName, setGoalName] = useState('');
  const [goalNameError, setGoalNameError] = useState<string | null>(null);
  const [goalInitialDeposit, setGoalInitialDeposit] = useState('');
  const [goalInitialDepositError, setGoalInitialDepositError] = useState<string | null>(null);
  const [goalTargetDate, setGoalTargetDate] = useState('2027-06-30');

  // Form State: Budget
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(80);

  // Feedback & error messages (no window.alert calls)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter categories strictly by active tab type, excluding hidden system categories
  // (Hidden system categories are ONLY transfer, goal_contribution, and uncategorized)
  const availableCategories = useMemo(() => {
    const isIncome = activeTab === 'income';
    return categories.filter(c => {
      const isHiddenSystem = ['transfer', 'goal_contribution', 'uncategorized'].includes(c.systemKey || '') || c.hidden;
      if (isHiddenSystem) return false;
      return isIncome ? c.type === 'income' : c.type === 'expense';
    });
  }, [categories, activeTab]);

  // Expense categories specifically for Budgets
  const availableBudgetCategories = useMemo(() => {
    return categories.filter(c => {
      const isHiddenSystem = ['transfer', 'goal_contribution', 'uncategorized'].includes(c.systemKey || '') || c.hidden;
      return c.type === 'expense' && !isHiddenSystem;
    });
  }, [categories]);

  // Dynamic state synchronization effect (runs whenever modal opens, data changes, or tab changes)
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize category and account selection defaults when modal opens or available data changes
      setErrorMessage(null);

      // Validate categoryId
      if (availableCategories.length > 0) {
        if (!categoryId || !availableCategories.some(c => c.id === categoryId)) {
          setCategoryId(availableCategories[0].id);
        }
      } else {
        setCategoryId('');
      }

      // Validate budgetCategoryId
      if (availableBudgetCategories.length > 0) {
        if (!budgetCategoryId || !availableBudgetCategories.some(c => c.id === budgetCategoryId)) {
          setBudgetCategoryId(availableBudgetCategories[0].id);
        }
      } else {
        setBudgetCategoryId('');
      }

      // Validate accountId
      if (accounts.length > 0) {
        if (!accountId || !accounts.some(a => a.id === accountId)) {
          setAccountId(accounts[0].id);
        }
      } else {
        setAccountId('');
      }

      // Validate transfer fromAccountId & toAccountId:
      // Transfer must NEVER default to the same account for from and to!
      if (accounts.length >= 2) {
        const validFrom = accounts.some(a => a.id === fromAccountId) ? fromAccountId : accounts[0].id;
        setFromAccountId(validFrom);

        const otherAccounts = accounts.filter(a => a.id !== validFrom);
        if (!toAccountId || toAccountId === validFrom || !otherAccounts.some(a => a.id === toAccountId)) {
          setToAccountId(otherAccounts[0].id);
        }
      } else if (accounts.length === 1) {
        setFromAccountId(accounts[0].id);
        setToAccountId('');
      } else {
        setFromAccountId('');
        setToAccountId('');
      }
    }
  }, [isOpen, activeTab, availableCategories, availableBudgetCategories, accounts, categoryId, accountId, fromAccountId, toAccountId, budgetCategoryId]);

  const handleFromAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFromId = e.target.value;
    setFromAccountId(newFromId);
    if (toAccountId === newFromId) {
      const nextOther = accounts.find(a => a.id !== newFromId);
      if (nextOther) {
        setToAccountId(nextOther.id);
      }
    }
  };

  // Active currency info based on selected account or settings
  const relevantAccountId = activeTab === 'transfer' ? fromAccountId : accountId;
  const selectedAcc = accounts.find(a => a.id === relevantAccountId) || accounts[0];
  const activeCurrencyInfo = getCurrencyInfo(selectedAcc?.currency || settings.baseCurrency);

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptError(null);
    const validation = await validateImageFile(file);
    if (!validation.ok) {
      setReceiptError(validation.error || 'Please upload a valid JPEG, PNG, or WebP receipt image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setReceiptName(file.name);
  };

  const removeReceipt = () => {
    setReceiptName(null);
    setReceiptError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetTransactionFields = () => {
    setAmount('');
    setAmountError(null);
    setMerchant('');
    setMerchantError(null);
    setNote('');
    setNoteError(null);
    removeReceipt();
  };

  // Perform Save for Transaction / Spend / Income
  const executeSaveTransaction = async (keepOpen: boolean = false) => {
    setErrorMessage(null);
    const selectedAcc = accounts.find(a => a.id === accountId);
    const txCurrency = selectedAcc?.currency || settings.baseCurrency || 'USD';
    const amountRes = validateAmount(amount, txCurrency);
    if (!amountRes.ok) {
      setAmountError(amountRes.error || 'Please enter a valid amount.');
      setErrorMessage(amountRes.error || 'Please enter a valid amount.');
      return false;
    }
    const parsedAmount = amountRes.value;

    if (merchant.trim()) {
      const merchantRes = validateLabel(merchant, 'Merchant', false);
      if (!merchantRes.ok) {
        setMerchantError(merchantRes.error || 'Please enter a valid merchant name.');
        setErrorMessage(merchantRes.error || 'Please enter a valid merchant name.');
        return false;
      }
    }

    if (note.trim()) {
      const noteRes = validateNote(note);
      if (!noteRes.ok) {
        setNoteError(noteRes.error || 'Please enter a valid note.');
        setErrorMessage(noteRes.error || 'Please enter a valid note.');
        return false;
      }
    }

    if (accounts.length === 0 || !accountId) {
      setErrorMessage('Please add an account first to record transactions.');
      return false;
    }

    let finalCategoryId = categoryId;
    let selectedCat = categories.find(c => c.id === categoryId);
    if (!finalCategoryId || !selectedCat) {
      let uncategorizedCat = categories.find(c => c.systemKey === 'uncategorized');
      if (!uncategorizedCat) {
        const refreshed = await CentraDB.ensureSystemCategories();
        uncategorizedCat = refreshed.find(c => c.systemKey === 'uncategorized');
      }
      if (!uncategorizedCat) {
        setErrorMessage('Missing system category for uncategorized transaction.');
        return false;
      }
      finalCategoryId = uncategorizedCat.id;
      selectedCat = uncategorizedCat;
    }
    const type = activeTab === 'income' ? 'income' : 'expense';

    await addTransaction({
      type,
      amount: parsedAmount,
      currency: selectedAcc?.currency || settings.baseCurrency || 'USD',
      categoryId: finalCategoryId,
      categoryName: selectedCat.name,
      categoryIcon: selectedCat.icon,
      categoryColor: selectedCat.color,
      accountId,
      accountName: selectedAcc?.name || 'Primary Account',
      merchant: sanitizeText(merchant, 100) || (selectedCat?.name || (type === 'income' ? 'Income' : 'Expense')),
      date: new Date(`${txDate}T12:00:00.000Z`).toISOString(),
      note: sanitizeText(note, 300) + (receiptName ? ` [Attached: ${sanitizeText(receiptName, 100)}]` : ''),
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
    setErrorMessage(null);
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const transferCurrency = fromAcc?.currency || settings.baseCurrency || 'USD';
    const amountRes = validateAmount(amount, transferCurrency);
    if (!amountRes.ok) {
      setAmountError(amountRes.error || 'Please enter a valid transfer amount.');
      setErrorMessage(amountRes.error || 'Please enter a valid transfer amount.');
      return false;
    }
    const parsedAmount = amountRes.value;

    if ((transferNote || note).trim()) {
      const noteRes = validateNote(transferNote || note);
      if (!noteRes.ok) {
        setTransferNoteError(noteRes.error || 'Please enter a valid transfer note.');
        setErrorMessage(noteRes.error || 'Please enter a valid transfer note.');
        return false;
      }
    }

    if (accounts.length < 2) {
      setErrorMessage('Transfer requires at least 2 connected accounts.');
      return false;
    }

    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      setErrorMessage('Please choose different source and destination accounts.');
      return false;
    }

    await transferFunds(fromAccountId, toAccountId, parsedAmount, sanitizeText(transferNote || note, 500));

    if (keepOpen) {
      setAmount('');
      setAmountError(null);
      setTransferNote('');
      setTransferNoteError(null);
      setNote('');
      setNoteError(null);
      setFeedbackMsg('✓ Transfer executed! Ready for next.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setAmount('');
      setAmountError(null);
      setTransferNote('');
      setTransferNoteError(null);
      setNote('');
      setNoteError(null);
      onClose();
    }
    return true;
  };

  // Perform Save for Goal
  const executeSaveGoal = async (keepOpen: boolean = false) => {
    setErrorMessage(null);
    const goalNameRes = validateLabel(goalName, 'Goal name');
    if (!goalNameRes.ok) {
      setGoalNameError(goalNameRes.error || 'Please enter a valid goal name.');
      setErrorMessage(goalNameRes.error || 'Please enter a valid goal name.');
      return false;
    }

    const targetRes = validateAmount(amount, settings.baseCurrency || 'USD');
    if (!targetRes.ok) {
      setAmountError(targetRes.error || 'Please enter a valid target amount.');
      setErrorMessage(targetRes.error || 'Please enter a valid target amount.');
      return false;
    }
    const target = targetRes.value;

    let deposit = 0;
    if (goalInitialDeposit.trim()) {
      const depositRes = validateAmount(goalInitialDeposit, settings.baseCurrency || 'USD', { allowZero: true });
      if (!depositRes.ok) {
        setGoalInitialDepositError(depositRes.error || 'Please enter a valid initial deposit.');
        setErrorMessage(depositRes.error || 'Please enter a valid initial deposit.');
        return false;
      }
      deposit = depositRes.value;
    }

    const cleanGoalName = goalNameRes.value;

    addGoal({
      name: cleanGoalName,
      icon: 'Target',
      color: '#6366f1',
      targetAmount: target,
      currentAmount: deposit,
      startDate: txDate,
      targetDate: goalTargetDate,
      linkedAccountId: accountId || undefined,
    });

    if (deposit > 0 && accountId) {
      const selectedDepositAcc = accounts.find(a => a.id === accountId);
      let goalContribCat = categories.find(c => c.systemKey === 'goal_contribution');
      if (!goalContribCat) {
        const refreshed = await CentraDB.ensureSystemCategories();
        goalContribCat = refreshed.find(c => c.systemKey === 'goal_contribution');
      }
      if (!goalContribCat) {
        setErrorMessage('Missing system category for goal contribution.');
        return;
      }

      await addTransaction({
        type: 'expense',
        amount: deposit,
        currency: selectedDepositAcc?.currency || settings.baseCurrency || 'USD',
        categoryId: goalContribCat.id,
        categoryName: goalContribCat.name || 'Goal Funding',
        categoryIcon: goalContribCat.icon || 'Target',
        categoryColor: goalContribCat.color || '#6366f1',
        accountId: accountId,
        accountName: selectedDepositAcc?.name || 'Primary Account',
        merchant: `Goal: ${cleanGoalName}`,
        date: new Date(`${txDate}T12:00:00.000Z`).toISOString(),
        note: `Initial deposit for goal: ${cleanGoalName}`,
        tags: ['Goal', 'Savings'],
      });
    }

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
    setErrorMessage(null);
    const limitRes = validateAmount(amount, settings.baseCurrency || 'USD');
    if (!limitRes.ok) {
      setAmountError(limitRes.error || 'Please enter a valid monthly limit amount.');
      setErrorMessage(limitRes.error || 'Please enter a valid monthly limit amount.');
      return false;
    }
    const limit = limitRes.value;

    if (!budgetCategoryId) {
      setErrorMessage('Please select a category for this budget.');
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Quick Action"
        subtitle="Record transaction or set financial plan"
      >
        <div className="space-y-4">
          {/* Top Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#F1F2F4] dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-full text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('spend')}
              className={`flex-1 min-w-[58px] py-2 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                activeTab === 'spend'
                  ? 'bg-white dark:bg-[#1D1D1D] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Spend
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`flex-1 min-w-[58px] py-2 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-white dark:bg-[#1D1D1D] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`flex-1 min-w-[58px] py-2 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                activeTab === 'transfer'
                  ? 'bg-white dark:bg-[#1D1D1D] text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goal')}
              className={`flex-1 min-w-[58px] py-2 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                activeTab === 'goal'
                  ? 'bg-white dark:bg-[#1D1D1D] text-[#18212F] dark:text-[#C6FF3D] shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Goal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className={`flex-1 min-w-[58px] py-2 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-white dark:bg-[#1D1D1D] text-[#18212F] dark:text-[#C6FF3D] shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Budget
            </button>
          </div>

          {/* Feedback message toast */}
          {feedbackMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-fade-in">
              {feedbackMsg}
            </div>
          )}

          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Input Card */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {activeTab === 'spend' ? 'Enter Expense Amount' : activeTab === 'income' ? 'Enter Income Amount' : activeTab === 'transfer' ? 'Enter Transfer Amount' : activeTab === 'goal' ? 'Enter Goal Target' : 'Enter Budget Limit'}
              </span>
              <div className="flex items-center space-x-1.5 bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] px-2.5 py-1 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>

            <div className="relative flex items-center mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white mr-2">
                {activeCurrencyInfo.symbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={e => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setAmount(val);
                    if (val) {
                      const res = validateAmount(val, activeCurrencyInfo.code);
                      setAmountError(res.ok ? null : res.error || null);
                    } else {
                      setAmountError(null);
                    }
                  }
                }}
                className="w-full bg-transparent text-3xl font-bold text-gray-900 dark:text-white focus:outline-hidden placeholder-gray-400 tabular-nums"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 shrink-0 ml-2 font-mono">
                {activeCurrencyInfo.code}
              </span>
            </div>
            {amountError && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{amountError}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* SPEND / INCOME FLOW */}
            {(activeTab === 'spend' || activeTab === 'income') && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    {activeTab === 'spend' ? 'Paid To (Merchant / Payee)' : 'Received From (Source / Client)'}
                  </label>
                  <input
                    type="text"
                    placeholder={activeTab === 'spend' ? 'e.g. Uber Ride, Whole Foods Market' : 'e.g. Salary Deposit, Client Wire'}
                    value={merchant}
                    onChange={e => {
                      const val = e.target.value;
                      setMerchant(val);
                      if (val.trim()) {
                        const res = validateLabel(val, 'Merchant', false);
                        setMerchantError(res.ok ? null : res.error || null);
                      } else {
                        setMerchantError(null);
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border ${
                      merchantError ? 'border-rose-500' : 'border-gray-200 dark:border-[#232C45]'
                    } text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500`}
                  />
                  {merchantError && (
                    <p className="mt-1 text-[11px] text-rose-500 font-medium">{merchantError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="category-select" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    id="category-select"
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                  >
                    {availableCategories.map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Empty State for Accounts */}
                {accounts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#232C45] bg-gray-50/50 dark:bg-[#0A0E1A]/50 text-center">
                    <Wallet className="w-6 h-6 mx-auto text-gray-400 dark:text-gray-500 mb-1.5" />
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
                      No accounts connected yet
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                      You need at least one account to record {activeTab === 'spend' ? 'expenses' : 'income'}.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddAccountOpen(true)}
                      className="bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                    >
                      Add an Account
                    </Button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="account-select" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                      Payment Method / Account
                    </label>
                    <select
                      id="account-select"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                          {a.name} — Balance: {formatCurrency(a.balance, a.currency)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Notes / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="Optional memo or transaction note"
                    value={note}
                    onChange={e => {
                      const val = e.target.value;
                      setNote(val);
                      if (val.trim()) {
                        const res = validateNote(val);
                        setNoteError(res.ok ? null : res.error || null);
                      } else {
                        setNoteError(null);
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border ${
                      noteError ? 'border-rose-500' : 'border-gray-200 dark:border-[#232C45]'
                    } text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500`}
                  />
                  {noteError && (
                    <p className="mt-1 text-[11px] text-rose-500 font-medium">{noteError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Attach Receipt / Bill
                  </label>
                  {receiptName ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <Receipt className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{receiptName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeReceipt}
                        className="p-1 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1A233A] text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span>Upload receipt or invoice</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptChange}
                    className="hidden"
                  />
                  {receiptError && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{receiptError}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* TRANSFER FLOW */}
            {activeTab === 'transfer' && (
              <>
                {accounts.length < 2 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#232C45] bg-gray-50/50 dark:bg-[#0A0E1A]/50 text-center">
                    <Wallet className="w-6 h-6 mx-auto text-gray-400 dark:text-gray-500 mb-1.5" />
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
                      Transfer requires at least 2 accounts
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                      You currently have {accounts.length} connected account. Add another account to transfer funds.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddAccountOpen(true)}
                      className="bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                    >
                      Add an Account
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="from-account-select" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                        From Source Account
                      </label>
                      <select
                        id="from-account-select"
                        value={fromAccountId}
                        onChange={handleFromAccountChange}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                            {a.name} (Available: {formatCurrency(a.balance, a.currency)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="to-account-select" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                        To Destination Account
                      </label>
                      <select
                        id="to-account-select"
                        value={toAccountId}
                        onChange={e => setToAccountId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                      >
                        {accounts
                          .filter(a => a.id !== fromAccountId)
                          .map(a => (
                            <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                              {a.name} (Balance: {formatCurrency(a.balance, a.currency)})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                        Transfer Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Savings allocation, Card payoff"
                        value={transferNote}
                        onChange={e => {
                          const val = e.target.value;
                          setTransferNote(val);
                          if (val.trim()) {
                            const res = validateNote(val);
                            setTransferNoteError(res.ok ? null : res.error || null);
                          } else {
                            setTransferNoteError(null);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border ${
                          transferNoteError ? 'border-rose-500' : 'border-gray-200 dark:border-[#232C45]'
                        } text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500`}
                      />
                      {transferNoteError && (
                        <p className="mt-1 text-[11px] text-rose-500 font-medium">{transferNoteError}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* GOAL FLOW */}
            {activeTab === 'goal' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Car, Emergency Fund, Summer Trip"
                    value={goalName}
                    onChange={e => {
                      const val = e.target.value;
                      setGoalName(val);
                      if (val.trim()) {
                        const res = validateLabel(val, 'Goal name');
                        setGoalNameError(res.ok ? null : res.error || null);
                      } else {
                        setGoalNameError(null);
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border ${
                      goalNameError ? 'border-rose-500' : 'border-gray-200 dark:border-[#232C45]'
                    } text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500`}
                  />
                  {goalNameError && (
                    <p className="mt-1 text-[11px] text-rose-500 font-medium">{goalNameError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                      Initial Deposit (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={goalInitialDeposit}
                      onChange={e => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setGoalInitialDeposit(val);
                          if (val) {
                            const res = validateAmount(val, settings.baseCurrency, { allowZero: true });
                            setGoalInitialDepositError(res.ok ? null : res.error || null);
                          } else {
                            setGoalInitialDepositError(null);
                          }
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border ${
                        goalInitialDepositError ? 'border-rose-500' : 'border-gray-200 dark:border-[#232C45]'
                      } text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 tabular-nums`}
                    />
                    {goalInitialDepositError && (
                      <p className="mt-1 text-[11px] text-rose-500 font-medium">{goalInitialDepositError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={e => setGoalTargetDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                    />
                  </div>
                </div>

                {accounts.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                      Fund From Account (Optional)
                    </label>
                    <select
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                          {a.name} ({formatCurrency(a.balance, a.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* BUDGET FLOW */}
            {activeTab === 'budget' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Budget Category
                  </label>
                  <select
                    value={budgetCategoryId}
                    onChange={e => setBudgetCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 cursor-pointer"
                  >
                    {availableBudgetCategories.map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Overrun Alert Threshold
                    </label>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{budgetAlertThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={budgetAlertThreshold}
                    onChange={e => setBudgetAlertThreshold(parseInt(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleSave(true)}
              className="w-full"
              disabled={
                !amount ||
                !!amountError ||
                ((activeTab === 'spend' || activeTab === 'income') && (accounts.length === 0 || !!merchantError || !!noteError)) ||
                (activeTab === 'transfer' && (accounts.length < 2 || !fromAccountId || !toAccountId || fromAccountId === toAccountId || !!transferNoteError)) ||
                (activeTab === 'goal' && (!goalName.trim() || !!goalNameError || !!goalInitialDepositError)) ||
                (activeTab === 'budget' && !budgetCategoryId)
              }
            >
              Save &amp; Add Another
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => handleSave(false)}
              icon={<Check className="w-4 h-4 stroke-[2.5]" />}
              className="w-full"
              disabled={
                !amount ||
                !!amountError ||
                ((activeTab === 'spend' || activeTab === 'income') && (accounts.length === 0 || !!merchantError || !!noteError)) ||
                (activeTab === 'transfer' && (accounts.length < 2 || !fromAccountId || !toAccountId || fromAccountId === toAccountId || !!transferNoteError)) ||
                (activeTab === 'goal' && (!goalName.trim() || !!goalNameError || !!goalInitialDepositError)) ||
                (activeTab === 'budget' && !budgetCategoryId)
              }
            >
              Confirm
            </Button>
          </div>

        </div>
      </Modal>

      {/* Embedded AddAccountModal for quick account creation */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountCreated={(newAcc) => {
          setAccountId(newAcc.id);
          setIsAddAccountOpen(false);
        }}
      />
    </>
  );
};
