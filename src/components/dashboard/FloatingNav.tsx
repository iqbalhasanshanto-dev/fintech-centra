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
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#171717]/90 backdrop-blur-md text-gray-400 rounded-full px-6 py-2.5 shadow-2xl border border-gray-800">
      <ul className="flex space-x-6">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex flex-col items-center text-xs">
              <button className="flex flex-col items-center hover:text-white transition-colors focus:outline-none cursor-pointer">
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
