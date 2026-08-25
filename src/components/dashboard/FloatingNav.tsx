import React from 'react';
import { Home, BarChart2, Wallet, Settings } from 'lucide-react';

export const FloatingNav: React.FC = () => {
  const items = [
    { name: 'Dashboard', icon: Home },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Budgets', icon: Wallet },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 dark:bg-slate-800 text-slate-300 rounded-full px-4 py-2 shadow-xl border border-slate-700/30">
      <ul className="flex space-x-6">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex flex-col items-center text-xs">
              <button className="flex flex-col items-center focus:outline-none">
                <Icon className="w-5 h-5 mb-1" />
                <span>{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
