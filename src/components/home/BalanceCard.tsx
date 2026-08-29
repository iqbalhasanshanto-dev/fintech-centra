import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Account } from '../../types';

interface BalanceCardProps {
  onSelectAccount?: (account: Account | null) => void;
  onOpenTransfer?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  onSelectAccount,
  onOpenTransfer,
}) => {
  const { totalBalance, previousPeriodBalanceDelta, accounts, settings } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  const activeAccount = accounts.find(a => a.id === selectedAccountId) || null;
  const displayBalance = activeAccount ? activeAccount.balance : totalBalance;
  const displayCurrency = activeAccount ? activeAccount.currency : settings.baseCurrency;

  const handleAccountClick = (accId: string | 'all') => {
    setSelectedAccountId(accId);
    if (onSelectAccount) {
      onSelectAccount(accId === 'all' ? null : accounts.find(a => a.id === accId) || null);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] p-6 text-gray-900 dark:text-white transition-colors shadow-xs">
      {/* Top row: Label & quick actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {activeAccount ? activeAccount.name : 'Total Balance'}
          </span>
          {activeAccount && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#0A0E1A] text-gray-600 dark:text-gray-400 font-mono border border-gray-200 dark:border-[#232C45]">
              {activeAccount.accountNumberMasked}
            </span>
          )}
        </div>
        {onOpenTransfer && (
          <button
            onClick={onOpenTransfer}
            className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Transfer</span>
            <ArrowRightLeft className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Balance Number */}
      <div className="mb-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white tabular-nums currency-amount">
          {formatCurrency(displayBalance, displayCurrency, settings.privacyMode)}
        </h2>

        {/* Period-over-period delta */}
        <div className="flex items-center space-x-2 mt-2">
          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
              previousPeriodBalanceDelta.isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {previousPeriodBalanceDelta.isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            <span>
              {previousPeriodBalanceDelta.isPositive ? '+' : '-'}
              {formatCurrency(previousPeriodBalanceDelta.amount, settings.baseCurrency, settings.privacyMode, false)}
            </span>
            <span className="ml-1">
              ({previousPeriodBalanceDelta.percentage.toFixed(0)}%)
            </span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
        </div>
      </div>

      {/* Account quick selector grid / tabs */}
      <div className="pt-3 border-t border-gray-100 dark:border-[#232C45]">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => handleAccountClick('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedAccountId === 'all'
                ? 'bg-brand-600 text-white font-bold shadow-xs'
                : 'bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Accounts ({accounts.length})
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => handleAccountClick(acc.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
                selectedAccountId === acc.id
                  ? 'bg-brand-600 text-white font-bold shadow-xs'
                  : 'bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{acc.name}</span>
              <span className={`font-mono text-[10px] ${selectedAccountId === acc.id ? 'text-brand-100' : 'text-gray-400 dark:text-gray-500'}`}>
                {formatCurrency(acc.balance, acc.currency, settings.privacyMode, false)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
