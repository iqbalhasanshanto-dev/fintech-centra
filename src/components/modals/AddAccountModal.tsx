import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Landmark, Building2, Coins, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Account, AccountType } from '../../types';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../../utils/currencies';
import { parseAmountInput } from '../../utils/money';
import { RATES_LAST_UPDATED } from '../../utils/formatters';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated?: (account: Account) => void;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'checking', label: 'Checking', icon: Wallet },
  { type: 'savings', label: 'Savings', icon: Landmark },
  { type: 'credit', label: 'Credit Card', icon: CreditCard },
  { type: 'cash', label: 'Cash', icon: Coins },
  { type: 'investment', label: 'Investment', icon: Building2 },
];

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#0984E3', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
}) => {
  const { addAccount, settings, accounts } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState(settings.baseCurrency || 'USD');
  const [bankName, setBankName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [creditLimit, setCreditLimit] = useState('');
  const [isPrimary, setIsPrimary] = useState(accounts.length === 0);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync currency with base currency whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setType('checking');
      setBalance('');
      setCurrency(settings.baseCurrency || 'USD');
      setBankName('');
      setColor(PRESET_COLORS[0]);
      setCreditLimit('');
      setIsPrimary(accounts.length === 0);
      setErrorMessage('');
    }
  }, [isOpen, settings.baseCurrency, accounts.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter an account name.');
      return;
    }

    if (!currency) {
      setErrorMessage('Please choose a valid account currency.');
      return;
    }

    const sanitizedBalance = parseAmountInput(balance, currency);
    const sanitizedCreditLimit = type === 'credit' ? parseAmountInput(creditLimit, currency) : undefined;

    try {
      const newAccData: Omit<Account, 'id'> = {
        name: name.trim(),
        type,
        balance: sanitizedBalance,
        currency,
        accountNumberMasked: type === 'cash' ? '•••• CASH' : `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        bankName: bankName.trim() || (type === 'cash' ? 'Cash' : 'Personal Account'),
        color,
        isPrimary,
        creditLimit: sanitizedCreditLimit,
      };

      addAccount(newAccData);

      if (onAccountCreated) {
        onAccountCreated({
          ...newAccData,
          id: `acc_${Date.now()}`,
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to add account.');
    }
  };

  const selectedCurrencyInfo = getCurrencyInfo(currency);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Account"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Account Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Account Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Primary Checking, Cash Vault"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition-all"
            autoFocus
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
              const isSelected = type === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/40'
                      : 'border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
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
            <label htmlFor="add-account-currency" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              id="add-account-currency"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
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
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">
                {selectedCurrencyInfo.symbol}
              </span>
              <input
                type="text"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Credit Limit if Credit Card */}
        {type === 'credit' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Credit Limit (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">
                {selectedCurrencyInfo.symbol}
              </span>
              <input
                type="text"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                placeholder="e.g. 5,000.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Institution / Bank Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Bank or Issuer Name (Optional)
          </label>
          <input
            type="text"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            placeholder="e.g. Chase, Revolut, Physical Cash"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#0A0E1A] text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Theme Color Picker */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Card Accent Color
          </label>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-[#121A2C]' : 'hover:scale-110'
                }`}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Primary Account Checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={e => setIsPrimary(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-700"
          />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 select-none">
            Set as Primary Account for default transactions
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-[#232C45]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="bg-black dark:bg-white text-white dark:text-black font-bold"
          >
            Save Account
          </Button>
        </div>
      </form>
    </Modal>
  );
};
