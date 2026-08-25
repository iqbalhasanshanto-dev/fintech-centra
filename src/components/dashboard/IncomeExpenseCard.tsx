import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface IncomeExpenseCardProps {
  type: 'income' | 'expenses';
  amount: string;
}

export const IncomeExpenseCard: React.FC<IncomeExpenseCardProps> = ({ type, amount }) => {
  const isIncome = type === 'income';
  const title = isIncome ? 'Income' : 'Expenses';
  const textColor = isIncome ? 'text-green-400' : 'text-red-400';
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex-1 rounded-2xl bg-slate-800 dark:bg-slate-800 p-4 border border-slate-700/30">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${isIncome ? 'text-green-400' : 'text-red-400'}`} />
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      </div>
      <p className={`mt-2 text-2xl font-bold ${textColor}`}>{amount}</p>
    </div>
  );
};
