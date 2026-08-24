import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercent } from '../../utils/formatters';
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
    <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-600 text-white p-6 shadow-xl shadow-brand-600/20">
      {/* Decorative background glow circles */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

      {/* Top row: Label & quick actions */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-100/90">
            {activeAccount ? activeAccount.name : 'Total Net Worth'}
          </span>
          {activeAccount && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono">
              {activeAccount.accountNumberMasked}
            </span>
          )}
        </div>
        <button
          onClick={onOpenTransfer}
          className="text-xs font-bold px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all flex items-center space-x-1 backdrop-blur-md"
        >
          <span>Transfer</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Balance Number */}
      <div className="relative z-10 mb-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white currency-amount">
          {formatCurrency(displayBalance, displayCurrency, settings.privacyMode)}
        </h2>

        {/* Period-over-period delta */}
        <div className="flex items-center space-x-2 mt-2">
          <div
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              previousPeriodBalanceDelta.isPositive
                ? 'bg-growth/25 text-emerald-200 border border-emerald-400/30'
                : 'bg-danger/25 text-rose-200 border border-rose-400/30'
            }`}
          >
            {previousPeriodBalanceDelta.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>
              {previousPeriodBalanceDelta.isPositive ? '+' : '-'}
              {formatCurrency(previousPeriodBalanceDelta.amount, settings.baseCurrency, settings.privacyMode, false)}
            </span>
            <span className="text-[11px] opacity-80">
              ({previousPeriodBalanceDelta.percentage.toFixed(0)}%)
            </span>
          </div>
          <span className="text-[11px] text-brand-100/80">vs last period</span>
        </div>
      </div>

      {/* Account quick selector horizontal scroll */}
      <div className="relative z-10 pt-2 border-t border-white/15">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => handleAccountClick('all')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedAccountId === 'all'
                ? 'bg-white text-brand-700 font-bold shadow-sm'
                : 'bg-white/15 text-white/90 hover:bg-white/20'
            }`}
          >
            All Accounts ({accounts.length})
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => handleAccountClick(acc.id)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                selectedAccountId === acc.id
                  ? 'bg-white text-brand-700 font-bold shadow-sm'
                  : 'bg-white/15 text-white/90 hover:bg-white/20'
              }`}
            >
              <span>{acc.name}</span>
              <span className="opacity-75 font-mono text-[11px]">
                {formatCurrency(acc.balance, acc.currency, settings.privacyMode, false)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
