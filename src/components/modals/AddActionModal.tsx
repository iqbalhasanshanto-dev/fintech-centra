import React, { useState } from 'react';
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
  Repeat
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency, convertCurrency } from '../../utils/formatters';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'transaction' | 'transfer' | 'goal' | 'budget';
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

  const [activeTab, setActiveTab] = useState<'transaction' | 'transfer' | 'goal' | 'budget'>(defaultTab);

  // Form State: Transaction
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_dining');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_checking');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  // Form State: Transfer
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false);

  // Form State: Goal
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalInitialDeposit, setGoalInitialDeposit] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('2027-06-30');
  const [goalIcon, setGoalIcon] = useState('Home');
  const [goalColor, setGoalColor] = useState('#6C5CE7');

  // Form State: Budget
  const [budgetCategoryId, setBudgetCategoryId] = useState(categories[0]?.id || '');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(80);

  // Handle Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    const selectedCat = categories.find(c => c.id === categoryId);
    const selectedAcc = accounts.find(a => a.id === accountId);
    const parsedTags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    await addTransaction({
      type: txType,
      amount: parsedAmount,
      currency: selectedAcc?.currency || settings.baseCurrency,
      categoryId,
      categoryName: selectedCat?.name || 'General',
      categoryIcon: selectedCat?.icon || 'HelpCircle',
      categoryColor: selectedCat?.color || '#6C5CE7',
      accountId,
      accountName: selectedAcc?.name || 'Primary Account',
      merchant: merchant.trim() || (selectedCat?.name || 'Transaction'),
      date: new Date().toISOString(),
      note: note.trim(),
      tags: parsedTags,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
    });

    // Reset & close
    setAmount('');
    setMerchant('');
    setNote('');
    setTagsInput('');
    setIsRecurring(false);
    onClose();
  };

  // Handle Transfer
  const handleExecuteTransfer = async () => {
    const parsed = parseFloat(transferAmount);
    if (!parsed || parsed <= 0) return;
    if (fromAccountId === toAccountId) {
      alert('Please choose different accounts for transfer.');
      return;
    }

    await transferFunds(fromAccountId, toAccountId, parsed, transferNote);
    setTransferAmount('');
    setTransferNote('');
    setIsConfirmingTransfer(false);
    onClose();
  };

  // Handle Save Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetAmount);
    const deposit = parseFloat(goalInitialDeposit) || 0;
    if (!goalName || !target || target <= 0) {
      alert('Please enter goal name and valid target amount.');
      return;
    }

    addGoal({
      name: goalName.trim(),
      icon: goalIcon,
      color: goalColor,
      targetAmount: target,
      currentAmount: deposit,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: goalTargetDate,
      linkedAccountId: accountId,
    });

    setGoalName('');
    setGoalTargetAmount('');
    setGoalInitialDeposit('');
    onClose();
  };

  // Handle Save Budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit);
    if (!limit || limit <= 0) {
      alert('Please enter a valid monthly limit.');
      return;
    }

    const cat = categories.find(c => c.id === budgetCategoryId);
    addBudget({
      categoryId: budgetCategoryId,
      categoryName: cat?.name || 'Category',
      categoryIcon: cat?.icon || 'PieChart',
      categoryColor: cat?.color || '#6C5CE7',
      limitAmount: limit,
      spentAmount: 0,
      alertThreshold: budgetAlertThreshold,
      period: 'monthly',
    });

    setBudgetLimit('');
    onClose();
  };

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  const toAcc = accounts.find(a => a.id === toAccountId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Action"
      subtitle="Record new activity or set financial targets"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('transaction')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'transaction'
                ? 'bg-white dark:bg-surface-darkCard text-brand-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Transaction
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'transfer'
                ? 'bg-white dark:bg-surface-darkCard text-brand-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Transfer
          </button>
          <button
            onClick={() => setActiveTab('goal')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'goal'
                ? 'bg-white dark:bg-surface-darkCard text-brand-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Goal
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'budget'
                ? 'bg-white dark:bg-surface-darkCard text-brand-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Budget
          </button>
        </div>

        {/* 1. Add Transaction Form */}
        {activeTab === 'transaction' && (
          <form onSubmit={handleSaveTransaction} className="space-y-3.5">
            {/* Income vs Expense switch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`py-2 rounded-xl transition-all ${
                  txType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-ink dark:hover:text-white'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`py-2 rounded-xl transition-all ${
                  txType === 'income'
                    ? 'bg-growth text-white shadow-xs'
                    : 'text-gray-500 hover:text-ink dark:hover:text-white'
                }`}
              >
                Income (+)
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Amount ({settings.baseCurrency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold font-display text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xl font-bold font-display focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Merchant / Description */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Merchant / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Starbucks Coffee, Client Wire"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Category & Account selection row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                >
                  {categories
                    .filter(c => (txType === 'expense' ? c.type === 'expense' : c.type === 'income'))
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Account
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags & Note */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vacation, Tax"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  placeholder="Optional memo"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Repeat className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-ink dark:text-white">
                  Recurring Transaction
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Record {txType === 'expense' ? 'Expense' : 'Income'}</span>
            </button>
          </form>
        )}

        {/* 2. Transfer / Payment Form */}
        {activeTab === 'transfer' && (
          <div className="space-y-4">
            {!isConfirmingTransfer ? (
              <div className="space-y-3.5">
                {/* Source & Target Accounts */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    From Account
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={e => setFromAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Balance: {formatCurrency(a.balance, a.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    To Account / Recipient
                  </label>
                  <select
                    value={toAccountId}
                    onChange={e => setToAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Transfer Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-lg font-bold font-display"
                  />
                </div>

                {/* Currency Conversion Preview if accounts differ */}
                {fromAcc && toAcc && fromAcc.currency !== toAcc.currency && transferAmount && (
                  <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-xs text-brand-700 dark:text-brand-300">
                    Converted to {toAcc.currency}:{' '}
                    <span className="font-bold">
                      {formatCurrency(
                        convertCurrency(parseFloat(transferAmount) || 0, fromAcc.currency, toAcc.currency),
                        toAcc.currency
                      )}
                    </span>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Purpose / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rent share, savings allocation"
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!parseFloat(transferAmount)) return;
                    setIsConfirmingTransfer(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Review Transfer</span>
                </button>
              </div>
            ) : (
              /* Confirmation Step */
              <div className="space-y-4 p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 mx-auto flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink dark:text-white">
                    Confirm Transfer
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Please verify the transaction details
                  </p>
                </div>

                <div className="text-2xl font-black font-display text-ink dark:text-white">
                  ${parseFloat(transferAmount).toFixed(2)}
                </div>

                <div className="text-xs space-y-1 text-left bg-white dark:bg-surface-darkCard p-3 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-gray-400">From:</span>
                    <span className="font-bold text-ink dark:text-white">{fromAcc?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">To:</span>
                    <span className="font-bold text-ink dark:text-white">{toAcc?.name}</span>
                  </div>
                  {transferNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memo:</span>
                      <span className="text-ink dark:text-white">{transferNote}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setIsConfirmingTransfer(false)}
                    className="py-2.5 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExecuteTransfer}
                    className="py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-600/30"
                  >
                    Send Money
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. New Goal Form */}
        {activeTab === 'goal' && (
          <form onSubmit={handleSaveGoal} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. New Apartment Deposit, Tokyo Trip"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={goalTargetAmount}
                  onChange={e => setGoalTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Initial Saved ($)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={goalInitialDeposit}
                  onChange={e => setGoalInitialDeposit(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                required
                value={goalTargetDate}
                onChange={e => setGoalTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Create Savings Goal</span>
            </button>
          </form>
        )}

        {/* 4. New Budget Form */}
        {activeTab === 'budget' && (
          <form onSubmit={handleSaveBudget} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Category
              </label>
              <select
                value={budgetCategoryId}
                onChange={e => setBudgetCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
              >
                {categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Monthly Spending Limit ($)
              </label>
              <input
                type="number"
                required
                placeholder="400"
                value={budgetLimit}
                onChange={e => setBudgetLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
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
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>50%</span>
                <span>80% (Recommended)</span>
                <span>100%</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2"
            >
              <PieChart className="w-4 h-4" />
              <span>Set Budget Limit</span>
            </button>
          </form>
        )}

      </div>
    </Modal>
  );
};
