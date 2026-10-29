import React, { useState } from 'react';
import { ArrowLeft, Wallet, Landmark, CreditCard, Coins, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CentraDB } from '../../db/storage';
import { OutboxQueue } from '../../db/outbox';
import { Account, AccountType } from '../../types';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../../utils/currencies';
import { parseAmountInput } from '../../utils/money';
import { RATES_LAST_UPDATED } from '../../utils/formatters';
import { validateLabel, validateAmount } from '../../utils/validators';
import logoImg from '../../assets/brand/logo.png';
import { CornerGlow } from '../ui/CornerGlow';

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

  const baseCurrency = user?.baseCurrency || CentraDB.getUser()?.baseCurrency || '';
  const [accountName, setAccountName] = useState('Primary Checking');
  const [accountNameError, setAccountNameError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(baseCurrency || 'USD');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAccountNameChange = (val: string) => {
    setAccountName(val);
    if (val.trim()) {
      const res = validateLabel(val, 'Account name');
      setAccountNameError(res.ok ? null : res.error || null);
    } else {
      setAccountNameError(null);
    }
  };

  const handleBalanceChange = (val: string) => {
    setBalance(val);
    if (val.trim()) {
      const res = validateAmount(val, currency || baseCurrency, { allowZero: true });
      setBalanceError(res.ok ? null : res.error || null);
    } else {
      setBalanceError(null);
    }
  };

  // Gate on chosen base currency
  if (!baseCurrency) {
    return (
      <div className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col justify-between relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black p-6">
        <CornerGlow />
        <div className="w-full max-w-lg mx-auto z-10">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="mt-8 p-6 rounded-3xl bg-white dark:bg-[#1D1D1D] border border-black/5 dark:border-white/10 shadow-2xl text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-[#18212F] dark:text-white mb-2">
              Base Currency Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Please choose your primary base currency in your profile step before configuring accounts.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3.5 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black font-bold text-sm cursor-pointer shadow-md hover:opacity-90"
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

    const nameResult = validateLabel(accountName, 'Account name');
    if (!nameResult.ok) {
      setAccountNameError(nameResult.error || 'Please enter an account name.');
      setErrorMessage(nameResult.error || 'Please enter an account name.');
      return;
    }

    if (balance.trim()) {
      const balanceResult = validateAmount(balance, currency || baseCurrency, { allowZero: true });
      if (!balanceResult.ok) {
        setBalanceError(balanceResult.error || 'Please enter a valid balance.');
        setErrorMessage(balanceResult.error || 'Please enter a valid balance.');
        return;
      }
    }

    const sanitizedBalance = balance.trim() ? parseAmountInput(balance, currency) : 0;

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
    <div
      className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col justify-between relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      <CornerGlow />

      <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto z-10 animate-fade-in">
        {/* Top Header */}
        <div className="px-6 pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={logoImg}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none"
              draggable={false}
            />
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            Skip
          </button>
        </div>

        {/* Bottom Sheet Card */}
        <div className="w-full bg-white dark:bg-[#1D1D1D] rounded-t-[32px] md:rounded-[32px] border-t md:border border-black/5 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col transition-all">
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-4" />

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18212F] dark:text-white mb-2">
            Set up your first account
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
            Create an account to start tracking transactions and balances right away.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
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
                onChange={e => handleAccountNameChange(e.target.value)}
                placeholder="e.g. Primary Checking, Cash Wallet"
                className={`w-full px-5 py-3.5 rounded-2xl border ${
                  accountNameError ? 'border-rose-500' : 'border-transparent'
                } bg-[#E8ECEF] dark:bg-[#2A2A2A] text-sm text-[#18212F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6FF3D] transition-all font-semibold`}
              />
              {accountNameError && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{accountNameError}</p>
              )}
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
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#18212F] text-white dark:bg-white dark:text-black shadow-md'
                          : 'bg-[#E8ECEF] text-gray-600 dark:bg-[#2A2A2A] dark:text-gray-400 hover:opacity-80'
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
                  className="w-full px-4 py-3.5 rounded-2xl border border-transparent bg-[#E8ECEF] dark:bg-[#2A2A2A] text-sm font-semibold text-[#18212F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6FF3D]"
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">
                    {currencyInfo.symbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={balance}
                    onChange={e => handleBalanceChange(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border ${
                      balanceError ? 'border-rose-500' : 'border-transparent'
                    } bg-[#E8ECEF] dark:bg-[#2A2A2A] text-sm font-semibold text-[#18212F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C6FF3D]`}
                  />
                </div>
                {balanceError && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{balanceError}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="w-full sm:w-1/3 py-4 px-6 rounded-full bg-[#E8ECEF] dark:bg-[#262626] text-[#18212F] dark:text-white font-bold text-sm hover:opacity-90 transition-all cursor-pointer text-center"
              >
                Skip for now
              </button>
              <button
                type="submit"
                form="first-account-form"
                disabled={!accountName.trim() || !!accountNameError || !!balanceError}
                className="w-full sm:w-2/3 py-4 px-6 rounded-full font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 bg-[#18212F] dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
