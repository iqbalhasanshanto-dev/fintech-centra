import React, { useState } from 'react';
import { Wallet, Landmark, ArrowUpRight } from 'lucide-react';
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
    <div className="space-y-3">
      {/* Top Header Row with unified accessible Transfer action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-display text-gray-900 dark:text-[#FFFFFF]">
            Connected Accounts ({accounts.length})
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
            Total balance: <strong className="text-gray-900 dark:text-[#FFFFFF] font-display tabular-nums">{formatCurrency(totalBalance, settings.baseCurrency, settings.privacyMode)}</strong>
          </p>
        </div>

        {onOpenTransfer && (
          <button
            onClick={onOpenTransfer}
            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#161B26] text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center space-x-1 transition-colors"
            aria-label="Initiate money transfer"
          >
            <span>Transfer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Accounts Row */}
      <div className="flex items-center space-x-2.5 overflow-x-auto pb-1.5 no-scrollbar scrollbar-none">
        
        {/* "All Accounts" Filter Chip */}
        <button
          onClick={() => handleAccountClick('all')}
          className={`p-3 rounded-xl text-left whitespace-nowrap transition-colors flex items-center space-x-3 shrink-0 cursor-pointer ${
            selectedAccountId === 'all'
              ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
              : 'bg-white dark:bg-[#161B26] text-gray-800 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            selectedAccountId === 'all' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold leading-tight">
              All Accounts
            </p>
            <p className="text-xs font-extrabold font-display tabular-nums mt-0.5">
              {formatCurrency(totalBalance, settings.baseCurrency, settings.privacyMode, false)}
            </p>
          </div>
        </button>

        {/* Individual Account Cards */}
        {accounts.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          return (
            <button
              key={acc.id}
              onClick={() => handleAccountClick(acc.id)}
              className={`p-3 rounded-xl text-left whitespace-nowrap transition-colors flex items-center space-x-3 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-[#161B26] text-gray-800 dark:text-[#E2E8F0] border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
              >
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="flex items-center space-x-1.5">
                  <p className="text-xs font-bold truncate max-w-[130px] leading-tight">
                    {acc.name}
                  </p>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-gray-100 dark:bg-[#1E2536] text-gray-500 dark:text-[#94A3B8] font-mono">
                    {acc.accountNumberMasked}
                  </span>
                </div>
                <p className="text-xs font-extrabold font-display tabular-nums mt-0.5 text-gray-900 dark:text-[#FFFFFF]">
                  {formatCurrency(acc.balance, acc.currency, settings.privacyMode, false)}
                </p>
              </div>
            </button>
          );
        })}

      </div>
    </div>
  );
};
