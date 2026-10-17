import React, { useState } from 'react';
import { ArrowLeft, Wallet, Landmark, CreditCard, Coins, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CentraDB } from '../../db/storage';
import { OutboxQueue } from '../../db/outbox';
import { Account, AccountType } from '../../types';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../../utils/currencies';
import { parseAmountInput } from '../../utils/money';
import { RATES_LAST_UPDATED } from '../../utils/formatters';

interface FirstAccountScreenProps {
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'checking', label: 'Checking', icon: Wallet },
  { type: 'savings', label: 'Savings', icon: Landmark },
  { type: 'credit', label: 'Credit Card', icon: CreditCard },
  { type: 'cash', label: 'Cash', icon: Coins },
  { type: 'investment', label: 'Investment', icon: Building2 },
];

export const FirstAccountScreen: React.FC<FirstAccountScreenProps> = ({
  onBack,
  onContinue,
  onSkip,
}) => {
  const { user, isGuest } = useAuth();

  const baseCurrency = user?.baseCurrency || '';
  const [accountName, setAccountName] = useState('Primary Checking');
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState(baseCurrency || 'USD');
  const [errorMessage, setErrorMessage] = useState('');

  // Gate on chosen base currency
  if (!baseCurrency) {
    return (
      <div className="w-full flex flex-col justify-between min-h-full py-4 px-4 sm:px-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="mt-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Base Currency Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please choose your primary base currency in your profile step before configuring accounts.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-sm cursor-pointer"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateFirstAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accountName.trim()) {
      setErrorMessage('Please enter an account name.');
      return;
    }

    const sanitizedBalance = parseAmountInput(balance, currency);

    // Idempotency: load existing accounts before creating
    const existingAccounts = CentraDB.getAccounts();
    const alreadyExists = existingAccounts.some(
      a => a.name.trim().toLowerCase() === accountName.trim().toLowerCase()
    );

    if (!alreadyExists) {
      const newAcc: Account = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`,
        name: accountName.trim(),
        type: accountType,
        balance: sanitizedBalance,
        currency: currency || baseCurrency,
        accountNumberMasked: accountType === 'cash' ? '•••• CASH' : '•••• 1001',
        bankName: accountType === 'cash' ? 'Physical Cash' : 'Personal Bank',
        color: '#6366F1',
        isPrimary: true,
      };

      await CentraDB.saveAccounts([...existingAccounts, newAcc]);

      if (user?.id && !isGuest) {
        OutboxQueue.enqueue({
          userId: user.id,
          entity: 'accounts',
          op: 'upsert',
          recordId: newAcc.id,
          payload: {
            id: newAcc.id,
            user_id: user.id,
            name: newAcc.name,
            type: newAcc.type,
            balance: newAcc.balance,
            currency: newAcc.currency,
            account_number_masked: newAcc.accountNumberMasked,
            bank_name: newAcc.bankName,
            color: newAcc.color,
            is_primary: true,
            updated_at: new Date().toISOString(),
          },
        });
      }
    }

    onContinue();
  };

  const currencyInfo = getCurrencyInfo(currency);

  return (
    <div className="w-full flex flex-col justify-between min-h-full py-4 px-4 sm:px-8">
      <div>
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
            Step 2/5
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 w-[40%]" />
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Set up your first account
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Create an account to start tracking transactions and balances right away.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form id="first-account-form" onSubmit={handleCreateFirstAccount} className="space-y-4">
          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Account Name *
            </label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="e.g. Primary Checking, Cash Wallet"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition-all font-semibold"
            />
          </div>

          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ACCOUNT_TYPES.map(item => {
                const Icon = item.icon;
                const isSelected = accountType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setAccountType(item.type)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-md'
                        : 'border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency & Opening Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="first-account-currency" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                id="first-account-currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-3 rounded-2xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag ? `${c.flag} ` : ''}{c.code} - {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Rates updated {RATES_LAST_UPDATED}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Opening Balance
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">
                  {currencyInfo.symbol}
                </span>
                <input
                  type="text"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-8 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="w-full sm:w-1/3 py-4 px-6 rounded-full border border-gray-200 dark:border-[#232c44] text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-[#182032] transition-all cursor-pointer text-center"
        >
          Skip for now
        </button>
        <button
          type="submit"
          form="first-account-form"
          className="w-full sm:w-2/3 py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
