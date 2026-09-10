import React from 'react';
import { Wallet, ArrowRightLeft, ArrowUpRight, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const AccountsCarousel: React.FC = () => {
  const { accounts, totalBalance, settings } = useFinance();

  return (
    <section id="accounts" className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Connected Accounts</h3>
          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-full">
            {accounts.length}
          </span>
        </div>
        {accounts.length > 1 && (
          <button className="text-sm font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer">
            <span>Transfer Funds</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-5 group transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Total Balance</p>
          <p className="text-xl font-bold text-white">
            {formatCurrency(totalBalance, settings.baseCurrency, settings.privacyMode)}
          </p>
        </div>

        {/* Accounts or Empty State */}
        {accounts.length === 0 ? (
          <div className="sm:col-span-1 lg:col-span-3 p-5 rounded-xl border border-dashed border-gray-800 bg-gray-900/30 flex items-center justify-center text-center">
            <div className="text-gray-500">
              <p className="text-sm font-medium text-gray-400">No accounts connected yet</p>
              <p className="text-xs mt-0.5 text-gray-600">Connect a checking, savings, or investment account to track balances</p>
            </div>
          </div>
        ) : (
          accounts.map(acc => {
            const isNegative = acc.balance < 0;
            return (
              <div
                key={acc.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4 text-gray-500 group-hover:text-gray-300">
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    {acc.type} • {acc.accountNumberMasked.replace(/[^0-9]/g, '').slice(-4) || '••••'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm font-semibold text-gray-400 mb-1 truncate">{acc.name}</p>
                <p className={`text-xl font-bold ${isNegative ? 'text-rose-400' : 'text-white'}`}>
                  {formatCurrency(acc.balance, acc.currency, settings.privacyMode)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
