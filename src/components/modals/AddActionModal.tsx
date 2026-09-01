import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Check, 
  Calendar, 
  Paperclip,
  X,
  Receipt
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

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

  // Feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

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

  return (
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
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>

          <div className="relative flex items-center mt-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white mr-2">
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
              className="w-full bg-transparent text-3xl font-bold text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 tabular-nums"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 shrink-0 ml-2 font-mono">
              BDT
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {categories
                    .filter(c => (activeTab === 'spend' ? c.type === 'expense' : c.type === 'income'))
                    .map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  Payment Method / Account
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                      {a.name} — Balance: {formatCurrency(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  Notes / Memo
                </label>
                <input
                  type="text"
                  placeholder="Optional memo or transaction note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
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
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  From Source Account
                </label>
                <select
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                      {a.name} (Available: {formatCurrency(a.balance, a.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  To Destination Account
                </label>
                <select
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {accounts.map(a => (
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}

          {/* GOAL FLOW */}
          {activeTab === 'goal' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  Savings Goal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dream Apartment Downpayment"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Initial Deposit (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={goalInitialDeposit}
                    onChange={e => setGoalInitialDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {categories.map(c => (
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
          >
            Confirm
          </Button>
        </div>

      </div>
    </Modal>
  );
};
