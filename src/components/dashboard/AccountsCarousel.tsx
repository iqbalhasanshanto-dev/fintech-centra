import React from 'react';
import { ScrollHorizontal } from '../ui/ScrollHorizontal'; // placeholder utility or just use overflow-x-auto
import { User } from 'lucide-react';

const accounts = [
  { name: 'All Accounts', balance: '--' },
  { name: 'Primary Checking', balance: '$5,230' },
  { name: 'High Yield Vault', balance: '$12,400' },
  // Add more mock accounts as needed
];

export const AccountsCarousel: React.FC = () => {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Connected Accounts</h2>
        <button className="px-3 py-1.5 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition">
          Transfer
        </button>
      </div>
      <div className="flex space-x-4 overflow-x-auto px-2 py-2">
        {accounts.map((acc, idx) => (
          <div
            key={idx}
            className="min-w-[150px] rounded-xl bg-slate-800 p-4 border border-slate-700/30 flex flex-col items-start"
          >
            <p className="text-sm text-slate-300 mb-2">{acc.name}</p>
            <p className="text-base font-medium text-white">{acc.balance}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
