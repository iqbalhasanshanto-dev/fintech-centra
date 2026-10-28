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
  const { totalBalance, previousPeriodBalanceDelta, accounts, settings, periodFilter } = useFinance();
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
    <div className="rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 text-[#18212F] dark:text-white transition-all shadow-sm">
      {/* Top row: Label & quick actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
            {activeAccount ? activeAccount.name : 'Total balance'}
          </span>
          {activeAccount && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F2F4] dark:bg-[#262626] text-[#18212F] dark:text-white font-mono border border-black/[0.06] dark:border-white/[0.08]">
              {activeAccount.accountNumberMasked}
            </span>
          )}
        </div>
        {onOpenTransfer && (
          <button
            type="button"
            onClick={onOpenTransfer}
            className="text-xs font-semibold text-[#4D6E18] dark:text-[#C6FF3D] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Transfer</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Balance Number */}
      <div className="mb-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18212F] dark:text-white tabular-nums currency-amount">
          {formatCurrency(displayBalance, displayCurrency, settings.privacyMode)}
        </h2>

        {/* Period-over-period net savings delta (hidden for 'all' filter) */}
        {periodFilter !== 'all' && (
          <div className="flex items-center space-x-2 mt-2">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
            <span className="text-xs text-[#667085] dark:text-[#9CA3AF]">savings vs last period</span>
          </div>
        )}
      </div>

      {/* Account quick selector grid / tabs */}
      <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => handleAccountClick('all')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedAccountId === 'all'
                ? 'bg-[#18212F] dark:bg-white text-white dark:text-black shadow-xs'
                : 'bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#667085] dark:text-[#9CA3AF] hover:text-[#18212F] dark:hover:text-white'
            }`}
          >
            All Accounts ({accounts.length})
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleAccountClick(acc.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedAccountId === acc.id
                  ? 'bg-[#18212F] dark:bg-white text-white dark:text-black shadow-xs'
                  : 'bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-[#667085] dark:text-[#9CA3AF] hover:text-[#18212F] dark:hover:text-white'
              }`}
            >
              <span>{acc.name}</span>
              <span className={`font-mono text-[10px] ${selectedAccountId === acc.id ? 'opacity-80' : 'text-[#667085] dark:text-[#9CA3AF]'}`}>
                {formatCurrency(acc.balance, acc.currency, settings.privacyMode, false)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
