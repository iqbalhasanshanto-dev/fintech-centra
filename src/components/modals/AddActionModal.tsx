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
        <div className="flex items-center gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('spend')}
            className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'spend'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Spend
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'income'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'transfer'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goal')}
            className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'goal'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Goal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex-1 min-w-[60px] py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'budget'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Budget
          </button>
        </div>

        {/* Feedback message toast */}
        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center animate-fade-in">
            {feedbackMsg}
          </div>
        )}

        {/* Amount Input Card */}
        <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {activeTab === 'spend' ? 'Enter Expense Amount' : activeTab === 'income' ? 'Enter Income Amount' : activeTab === 'transfer' ? 'Enter Transfer Amount' : activeTab === 'goal' ? 'Enter Goal Target' : 'Enter Budget Limit'}
            </span>
            <div className="flex items-center space-x-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg text-xs text-gray-300">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="date"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-gray-300"
              />
            </div>
          </div>

          <div className="relative flex items-center mt-2">
            <span className="text-3xl font-bold text-white mr-2">
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
              className="w-full bg-transparent text-3xl font-bold text-white focus:outline-none placeholder-gray-600 tabular-nums"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 shrink-0 ml-2">
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  {activeTab === 'spend' ? 'Paid To (Merchant / Payee)' : 'Received From (Source / Client)'}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'spend' ? 'e.g. Uber Ride, Whole Foods Market' : 'e.g. Salary Deposit, Client Wire'}
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {categories
                    .filter(c => (activeTab === 'spend' ? c.type === 'expense' : c.type === 'income'))
                    .map(c => (
                      <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Payment Method / Account
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-gray-900 text-white">
                      {a.name} — Balance: {formatCurrency(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Notes / Memo
                </label>
                <input
                  type="text"
                  placeholder="Optional memo or transaction note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Attach Receipt / Bill
                </label>
                {receiptName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <Receipt className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-gray-200 truncate">{receiptName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-gray-800 hover:bg-gray-900/50 text-xs font-semibold text-gray-400 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-indigo-400" />
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                    From Account
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={e => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} className="bg-gray-900 text-white">
                        {a.name} ({formatCurrency(a.balance, a.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                    To Account
                  </label>
                  <select
                    value={toAccountId}
                    onChange={e => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} className="bg-gray-900 text-white">
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {fromAcc && toAcc && fromAcc.currency !== toAcc.currency && amount && (
                <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-indigo-300">
                  Target conversion: <span className="font-bold text-white">{formatCurrency(convertCurrency(parseFloat(amount) || 0, fromAcc.currency, toAcc.currency), toAcc.currency)}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Purpose / Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Savings transfer, Vault top up"
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* GOAL FLOW */}
          {activeTab === 'goal' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Goal Name / Milestone
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Yield Vault Target, Tech Setup"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Initial Deposit (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={goalInitialDeposit}
                    onChange={e => setGoalInitialDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={e => setGoalTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Linked Savings Account
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-gray-900 text-white">
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Category
                </label>
                <select
                  value={budgetCategoryId}
                  onChange={e => setBudgetCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Alert Threshold ({budgetAlertThreshold}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={budgetAlertThreshold}
                  onChange={e => setBudgetAlertThreshold(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>50%</span>
                  <span>80% (Recommended)</span>
                  <span>100%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="py-3 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save & Add</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
