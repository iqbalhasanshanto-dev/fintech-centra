import React from 'react';
import { Wallet, ArrowRightLeft, CreditCard, Building2, Landmark } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Account } from '../../types';

interface ConnectedAccountsSectionProps {
  onSelectAccount?: (account: Account | null) => void;
  onOpenTransfer?: () => void;
}

export const ConnectedAccountsSection: React.FC<ConnectedAccountsSectionProps> = ({
  onSelectAccount,
  onOpenTransfer,
}) => {
  const { accounts, totalBalance, settings } = useFinance();

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit':
        return CreditCard;
      case 'savings':
      case 'investment':
        return Landmark;
      case 'business':
        return Building2;
      default:
        return Wallet;
    }
  };

  return (
    <section id="connected-accounts-desktop" className="transition-colors">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Connected Accounts
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-xs font-bold text-gray-600 dark:text-gray-400 font-mono">
              {accounts.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Total Combined Balance:{' '}
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(totalBalance, settings.baseCurrency, settings.privacyMode)}
            </span>
          </p>
        </div>

        {onOpenTransfer && (
          <button
            onClick={onOpenTransfer}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Transfer</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map(acc => {
          const Icon = getAccountIcon(acc.type);
          const isNegative = acc.balance < 0;

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount && onSelectAccount(acc)}
              className="p-4 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all cursor-pointer group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200/60 dark:border-brand-900/40">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono font-medium text-gray-400 dark:text-gray-500">
                  {acc.accountNumberMasked}
                </span>
              </div>

              <p className="text-xs font-bold text-gray-900 dark:text-white truncate mb-1">
                {acc.name}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {acc.type}
              </p>

              <p className={`text-lg font-bold tabular-nums currency-amount ${isNegative ? 'text-rose-500 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                {formatCurrency(acc.balance, acc.currency, settings.privacyMode)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
