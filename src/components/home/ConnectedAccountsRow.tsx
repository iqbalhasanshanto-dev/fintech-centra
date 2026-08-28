import React, { useState } from 'react';
import { Wallet, ArrowRightLeft, ArrowUpRight, MoreVertical } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Account } from '../../types';

interface ConnectedAccountsRowProps {
  onSelectAccount?: (account: Account | null) => void;
  onOpenTransfer?: () => void;
}

export const ConnectedAccountsRow: React.FC<ConnectedAccountsRowProps> = ({
  onSelectAccount,
  onOpenTransfer,
}) => {
  const { accounts, totalBalance, settings } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  const handleAccountClick = (accId: string | 'all') => {
    setSelectedAccountId(accId);
    if (onSelectAccount) {
      onSelectAccount(accId === 'all' ? null : accounts.find(a => a.id === accId) || null);
    }
  };

  return (
    <section id="accounts" className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Connected Accounts</h3>
          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-full">
            {accounts.length + 1}
          </span>
        </div>
        {onOpenTransfer && (
          <button
            onClick={onOpenTransfer}
            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Transfer Funds</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Responsive Grid breaking cleanly into vertical stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance Card (Highlighted) */}
        <div
          onClick={() => handleAccountClick('all')}
          className={`bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-5 group cursor-pointer hover:bg-indigo-600/20 transition-all ${
            selectedAccountId === 'all' ? 'ring-1 ring-indigo-500/50' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <MoreVertical className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
            Total Balance
          </p>
          <p className="text-xl font-bold text-white tabular-nums currency-amount">
            {formatCurrency(totalBalance, settings.baseCurrency, settings.privacyMode)}
          </p>
        </div>

        {/* Individual Account Cards */}
        {accounts.map(acc => {
          const isNegative = acc.balance < 0;
          const isSelected = selectedAccountId === acc.id;

          return (
            <div
              key={acc.id}
              onClick={() => handleAccountClick(acc.id)}
              className={`bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-pointer group ${
                isSelected ? 'border-indigo-500/60 ring-1 ring-indigo-500/40' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4 text-gray-500 group-hover:text-gray-300 transition-colors">
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  {acc.type.toUpperCase()} • {acc.accountNumberMasked.replace('••••', '')}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1 truncate">
                {acc.name}
              </p>
              <p className={`text-xl font-bold tabular-nums currency-amount ${isNegative ? 'text-rose-400' : 'text-white'}`}>
                {formatCurrency(acc.balance, acc.currency, settings.privacyMode)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
