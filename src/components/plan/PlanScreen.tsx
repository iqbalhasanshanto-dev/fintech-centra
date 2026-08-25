import React, { useState } from 'react';
import { 
  Plus, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical, 
  Calendar, 
  ArrowLeft, 
  Trash2, 
  Wallet 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../context/FinanceContext';
import { Goal, Budget } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CircularProgress } from '../ui/CircularProgress';
import { Modal } from '../ui/Modal';
import { formatCurrency, calculateGoalPace } from '../../utils/formatters';

interface PlanScreenProps {
  onBackToHome?: () => void;
  onOpenAddGoal: () => void;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({
  onBackToHome,
  onOpenAddGoal,
}) => {
  const { goals, budgets, settings, contributeToGoal, deleteGoal, accounts } = useFinance();
  
  const [selectedGoalForFunds, setSelectedGoalForFunds] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundSourceAccountId, setFundSourceAccountId] = useState(accounts[0]?.id || '');
  const [activeGoalMenuId, setActiveGoalMenuId] = useState<string | null>(null);

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForFunds) return;
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) return;

    contributeToGoal(selectedGoalForFunds.id, amount, fundSourceAccountId);

    if (selectedGoalForFunds.currentAmount + amount >= selectedGoalForFunds.targetAmount) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#10B981', '#818CF8', '#F59E0B'],
      });
    }

    setFundAmount('');
    setSelectedGoalForFunds(null);
  };

  const totalGoalsTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalGoalsSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallSavingsRate = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      {/* Header with back button & "+ New Target" action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-[#FFFFFF] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold font-display text-gray-900 dark:text-[#FFFFFF]">
              Goals & Budgets
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
              Savings milestones and category monthly limits
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddGoal}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.4]" />
          <span>New Target</span>
        </button>
      </div>

      {/* Plan Summary Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider">
            Total Saved Across Goals
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
            {overallSavingsRate.toFixed(0)}% Achieved
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold font-display text-gray-900 dark:text-[#FFFFFF] tabular-nums currency-amount">
          {formatCurrency(totalGoalsSaved, settings.baseCurrency, settings.privacyMode)}
          <span className="text-sm font-normal text-gray-500 dark:text-[#94A3B8] ml-2">
            of {formatCurrency(totalGoalsTarget, settings.baseCurrency, settings.privacyMode)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-700"
            style={{ width: `${Math.min(100, overallSavingsRate)}%` }}
          />
        </div>
      </div>

      {/* Section 1: Featured Goals */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-[#FFFFFF] flex items-center space-x-2">
            <span>Milestone Savings Goals</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">
              {goals.length}
            </span>
          </h3>
        </div>

        <div className="space-y-3">
          {goals.map(goal => {
            const pace = calculateGoalPace(
              goal.currentAmount,
              goal.targetAmount,
              goal.startDate,
              goal.targetDate
            );

            return (
              <div
                key={goal.id}
                className="relative p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Top Row: Icon, Title, Overflow menu */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${goal.color}20`,
                        color: goal.color,
                      }}
                    >
                      <CategoryIcon name={goal.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-[#FFFFFF] truncate">
                        {goal.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8] flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Overflow menu toggle & Add Funds */}
                  <div className="flex items-center space-x-1.5 relative">
                    <button
                      onClick={() => setSelectedGoalForFunds(goal)}
                      className="min-h-[32px] px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
                    >
                      + Add Funds
                    </button>

                    <button
                      onClick={() => setActiveGoalMenuId(activeGoalMenuId === goal.id ? null : goal.id)}
                      className="p-1.5 text-gray-400 dark:text-[#94A3B8] hover:text-gray-600 dark:hover:text-[#FFFFFF] rounded-lg"
                      aria-label="Goal options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeGoalMenuId === goal.id && (
                      <div className="absolute right-0 top-9 w-32 bg-white dark:bg-[#161B26] rounded-xl shadow-xl border border-gray-200/80 dark:border-white/10 py-1 z-30 animate-fade-in text-xs">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${goal.name}"?`)) {
                              deleteGoal(goal.id);
                            }
                            setActiveGoalMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-1.5 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amounts readout */}
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-base font-extrabold font-display text-gray-900 dark:text-[#FFFFFF] tabular-nums currency-amount">
                      {formatCurrency(goal.currentAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                    <span className="text-gray-500 dark:text-[#94A3B8] ml-1 tabular-nums">
                      saved of {formatCurrency(goal.targetAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-display tabular-nums">
                    {formatCurrency(pace.remainingAmount, settings.baseCurrency, settings.privacyMode)} left
                  </span>
                </div>

                {/* Linear Progress Bar */}
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pace.percentComplete}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                {/* Behind Schedule Warning Banner or On Track Badge */}
                {pace.isBehind ? (
                  <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="leading-snug">
                      <strong className="font-bold">{pace.behindPercent}% behind schedule</strong> — save ~{formatCurrency(pace.recommendedMonthly, settings.baseCurrency, settings.privacyMode, false)}/mo to finish on target.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On target pace ({pace.percentComplete.toFixed(0)}% reached)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Budgets & Category Spending Limits */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-[#FFFFFF]">
              Category Budgets
            </h3>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
              Monthly spending allowances & utilization
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {budgets.map(budget => {
            const percentSpent = (budget.spentAmount / budget.limitAmount) * 100;
            const remaining = budget.limitAmount - budget.spentAmount;
            const isOver = percentSpent >= 100;

            return (
              <div
                key={budget.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${budget.categoryColor}20`,
                      color: budget.categoryColor,
                    }}
                  >
                    <CategoryIcon name={budget.categoryIcon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-[#FFFFFF] truncate">
                        {budget.categoryName}
                      </h4>
                      {isOver && (
                        <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-500 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold">
                          Over Limit
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5 tabular-nums">
                      {formatCurrency(budget.spentAmount, settings.baseCurrency, settings.privacyMode)} of{' '}
                      {formatCurrency(budget.limitAmount, settings.baseCurrency, settings.privacyMode)}
                    </div>
                  </div>
                </div>

                {/* Right: Circular Progress Ring */}
                <div className="shrink-0 flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <span className={`font-bold tabular-nums ${isOver ? 'text-rose-500' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                      {isOver
                        ? `${formatCurrency(Math.abs(remaining), settings.baseCurrency, settings.privacyMode)} over`
                        : `${formatCurrency(remaining, settings.baseCurrency, settings.privacyMode)} left`}
                    </span>
                  </div>

                  <CircularProgress
                    percentage={percentSpent}
                    size={44}
                    strokeWidth={4}
                    showText={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Funds Modal */}
      <Modal
        isOpen={!!selectedGoalForFunds}
        onClose={() => setSelectedGoalForFunds(null)}
        title={`Add Funds to ${selectedGoalForFunds?.name}`}
        subtitle="Deposit money toward your target"
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#94A3B8] mb-1">
              Deposit Amount (৳ BDT)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="500.00"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-[#FFFFFF] text-lg font-bold font-display tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#94A3B8] mb-1">
              Deduct from Account
            </label>
            <select
              value={fundSourceAccountId}
              onChange={e => setFundSourceAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-[#FFFFFF] text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — Available: {formatCurrency(a.balance, a.currency)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            <span>Confirm Deposit</span>
          </button>
        </form>
      </Modal>

    </div>
  );
};
