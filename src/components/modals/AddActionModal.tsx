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

  useEffect(() => {
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
  const [txDate, setTxDate] = useState<string>(() => todayLocalDateKey());
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Transfer
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Form State: Goal
  const [goalName, setGoalName] = useState('');
  const [goalInitialDeposit, setGoalInitialDeposit] = useState('');
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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
    }
  };

  const removeReceipt = () => {
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
    setErrorMessage(null);
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount.');
      return false;
    }

    if (accounts.length === 0 || !accountId) {
      setErrorMessage('Please add an account first to record transactions.');
      return false;
    }

    const selectedCat = categories.find(c => c.id === categoryId);
    const selectedAcc = accounts.find(a => a.id === accountId);
    const type = activeTab === 'income' ? 'income' : 'expense';

    await addTransaction({
      type,
      amount: parsedAmount,
      currency: selectedAcc?.currency || settings.baseCurrency || 'USD',
      categoryId: categoryId || 'uncategorized',
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
    setErrorMessage(null);
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount.');
      return false;
    }

    if (accounts.length < 2) {
      setErrorMessage('Transfer requires at least 2 connected accounts.');
      return false;
    }

    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      setErrorMessage('Please choose different source and destination accounts.');
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
  const executeSaveGoal = async (keepOpen: boolean = false) => {
    setErrorMessage(null);
    const target = parseFloat(amount.replace(',', '.'));
    const deposit = parseFloat(goalInitialDeposit.replace(',', '.')) || 0;
    if (!goalName.trim() || !target || target <= 0) {
      setErrorMessage('Please enter a goal name and valid target amount.');
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
      linkedAccountId: accountId || undefined,
    });

    if (deposit > 0 && accountId) {
      const selectedDepositAcc = accounts.find(a => a.id === accountId);
      const goalContribCat = categories.find(c => c.systemKey === 'goal_contribution')
        || categories.find(c => c.systemKey === 'transfer');

      await addTransaction({
        type: 'expense',
        amount: deposit,
        currency: selectedDepositAcc?.currency || settings.baseCurrency || 'USD',
        categoryId: goalContribCat ? goalContribCat.id : 'goal_contribution',
        categoryName: goalContribCat?.name || 'Goal Funding',
        categoryIcon: goalContribCat?.icon || 'Target',
        categoryColor: goalContribCat?.color || '#6366f1',
        accountId: accountId,
        accountName: selectedDepositAcc?.name || 'Primary Account',
        merchant: `Goal: ${goalName.trim()}`,
        date: new Date(`${txDate}T12:00:00.000Z`).toISOString(),
        note: `Initial deposit for goal: ${goalName.trim()}`,
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
    const limit = parseFloat(amount.replace(',', '.'));
    if (!limit || limit <= 0) {
      setErrorMessage('Please enter a valid monthly limit amount.');
      return false;
    }

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
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('spend')}
              className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors cursor-pointer ${
                activeTab === 'spend'
                  ? 'bg-white dark:bg-[#121A2C] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Spend
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-white dark:bg-[#121A2C] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors cursor-pointer ${
                activeTab === 'transfer'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goal')}
              className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors cursor-pointer ${
                activeTab === 'goal'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Goal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs font-bold'
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
                  }
                }}
                className="w-full bg-transparent text-3xl font-bold text-gray-900 dark:text-white focus:outline-hidden placeholder-gray-400 tabular-nums"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 shrink-0 ml-2 font-mono">
                {activeCurrencyInfo.code}
              </span>
            </div>
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
                    onChange={e => setMerchant(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500"
                  />
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
                    onChange={e => setNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500"
                  />
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
                        onChange={e => setTransferNote(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500"
                      />
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
                    onChange={e => setGoalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500"
                  />
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
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-hidden focus:border-brand-500 tabular-nums"
                    />
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
                ((activeTab === 'spend' || activeTab === 'income') && accounts.length === 0) ||
                (activeTab === 'transfer' && accounts.length < 2)
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
                ((activeTab === 'spend' || activeTab === 'income') && accounts.length === 0) ||
                (activeTab === 'transfer' && accounts.length < 2)
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
