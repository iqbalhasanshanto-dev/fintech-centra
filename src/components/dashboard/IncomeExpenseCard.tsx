import React from 'react';

interface IncomeExpenseCardProps {
  type: 'income' | 'expenses';
  amount: string;
}

export const IncomeExpenseCard: React.FC<IncomeExpenseCardProps> = ({ type, amount }) => {
  const isIncome = type === 'income';
  const title = isIncome ? 'Total Income' : 'Total Expenses';
  const badgeText = isIncome ? '+12.5%' : '-4.2%';
  const badgeBg = isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';

  return (
    <div className="bg-[#171717] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</span>
        <span className={`px-2 py-1 ${badgeBg} text-[10px] font-bold rounded-md tracking-wide`}>{badgeText}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{amount}</span>
      </div>
    </div>
  );
};
