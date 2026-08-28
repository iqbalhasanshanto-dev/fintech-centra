import React from 'react';
import { Wallet, ArrowRightLeft, ArrowUpRight, MoreVertical } from 'lucide-react';

const accounts = [
  { type: 'Checking', number: '4829', name: 'Primary Account', balance: '৳6,435', isNegative: false },
  { type: 'Savings', number: '8912', name: 'High Yield Vault', balance: '৳18,950', isNegative: false },
  { type: 'Credit', number: '6041', name: 'Sapphire Preferred', balance: '-৳394', isNegative: true },
];

export const AccountsCarousel: React.FC = () => {
  return (
    <section id="accounts" className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Connected Accounts</h3>
          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-full">5</span>
        </div>
        <button className="text-sm font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
          <span>Transfer Funds</span>
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-5 group cursor-pointer hover:bg-indigo-600/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <MoreVertical className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Total Balance</p>
          <p className="text-xl font-bold text-white">৳312,489</p>
        </div>

        {/* Accounts */}
        {accounts.map((acc, idx) => (
          <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-4 text-gray-500 group-hover:text-gray-300">
              <span className="text-[10px] font-bold tracking-widest uppercase">{acc.type} • {acc.number}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <p className="text-sm font-semibold text-gray-400 mb-1">{acc.name}</p>
            <p className={`text-xl font-bold ${acc.isNegative ? 'text-rose-400' : 'text-white'}`}>{acc.balance}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
