import React, { useState } from 'react';
import { 
  Plus, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Sparkles,
  ArrowLeft,
  Edit2,
  Trash2,
  PieChart
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

  // Quick Deposit into a goal
  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForFunds) return;
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) return;

    contributeToGoal(selectedGoalForFunds.id, amount, fundSourceAccountId);

    // Fire celebration confetti if goal reached
    if (selectedGoalForFunds.currentAmount + amount >= selectedGoalForFunds.targetAmount) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6C5CE7', '#1FAE71', '#8B7CF6', '#F5A524'],
      });
    }

    setFundAmount('');
    setSelectedGoalForFunds(null);
  };

  const totalGoalsTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalGoalsSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallSavingsRate = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      
      {/* Header with back button & "+ New Target" action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold font-display text-ink dark:text-white">
              My Plan
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Savings goals & monthly budget targets
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddGoal}
          className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target</span>
        </button>
      </div>

      {/* Plan Summary Card */}
      <div className="p-5 rounded-4xl bg-gradient-to-r from-ink via-gray-900 to-brand-950 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10 mb-3">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Total Saved Across Goals
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
            {overallSavingsRate.toFixed(0)}% Achieved
          </span>
        </div>

        <div className="text-3xl font-black font-display currency-amount relative z-10">
          {formatCurrency(totalGoalsSaved, settings.baseCurrency, settings.privacyMode)}
          <span className="text-sm font-normal text-gray-400 ml-2">
            of {formatCurrency(totalGoalsTarget, settings.baseCurrency, settings.privacyMode)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden mt-3 relative z-10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-growth transition-all duration-700"
            style={{ width: `${Math.min(100, overallSavingsRate)}%` }}
          />
        </div>
      </div>

      {/* Section 1: Featured Goals */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold font-display text-ink dark:text-white flex items-center space-x-2">
            <span>Featured Goals</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 font-bold">
              {goals.length}
            </span>
          </h3>
        </div>

        <div className="space-y-4">
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
                className="relative p-5 rounded-3xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft hover:shadow-md transition-all space-y-3.5"
              >
                {/* Top Row: Icon, Title, Overflow menu */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${goal.color}20`,
                        color: goal.color,
                      }}
                    >
                      <CategoryIcon name={goal.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-ink dark:text-white truncate">
                        {goal.name}
                      </h4>
                      <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Overflow menu toggle & Add Funds */}
                  <div className="flex items-center space-x-1.5 relative">
                    <button
                      onClick={() => setSelectedGoalForFunds(goal)}
                      className="px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-bold transition-colors"
                    >
                      + Add Funds
                    </button>

                    <button
                      onClick={() => setActiveGoalMenuId(activeGoalMenuId === goal.id ? null : goal.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                      aria-label="Goal options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeGoalMenuId === goal.id && (
                      <div className="absolute right-0 top-8 w-32 bg-white dark:bg-surface-darkCard rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-30 animate-fade-in text-xs">
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

                {/* Amounts readout & "$X left" */}
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-base font-extrabold font-display text-ink dark:text-white currency-amount">
                      {formatCurrency(goal.currentAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                    <span className="text-gray-400 ml-1">
                      saved of {formatCurrency(goal.targetAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                  </div>
                  <span className="font-bold text-brand-600 dark:text-brand-400 font-display">
                    {formatCurrency(pace.remainingAmount, settings.baseCurrency, settings.privacyMode)} left
                  </span>
                </div>

                {/* Linear Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
                  <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-caution" />
                    <span className="leading-snug">
                      <strong className="font-bold">{pace.behindPercent}% behind schedule</strong> — save ~${pace.recommendedMonthly}/mo to finish on target.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-growth">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On target pace ({pace.percentComplete.toFixed(0)}% reached)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Budgets & Category Spending Limits (Circular Rings) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-bold font-display text-ink dark:text-white">
              Category Budgets
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Monthly spending allowances & utilization
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {budgets.map(budget => {
            const percentSpent = (budget.spentAmount / budget.limitAmount) * 100;
            const remaining = budget.limitAmount - budget.spentAmount;
            const isOver = percentSpent >= 100;

            return (
              <div
                key={budget.id}
                className="p-4 rounded-3xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft hover:shadow-md transition-all flex items-center justify-between"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${budget.categoryColor}20`,
                      color: budget.categoryColor,
                    }}
                  >
                    <CategoryIcon name={budget.categoryIcon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-sm font-bold text-ink dark:text-white truncate">
                        {budget.categoryName}
                      </h4>
                      {isOver && (
                        <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-danger dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold">
                          Over Limit
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatCurrency(budget.spentAmount, settings.baseCurrency, settings.privacyMode)} of{' '}
                      {formatCurrency(budget.limitAmount, settings.baseCurrency, settings.privacyMode)}
                    </div>
                  </div>
                </div>

                {/* Right: Circular Progress Ring */}
                <div className="shrink-0 flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <span className={`font-bold ${isOver ? 'text-danger' : 'text-gray-700 dark:text-gray-300'}`}>
                      {isOver
                        ? `${formatCurrency(Math.abs(remaining), settings.baseCurrency, settings.privacyMode)} over`
                        : `${formatCurrency(remaining, settings.baseCurrency, settings.privacyMode)} left`}
                    </span>
                  </div>

                  <CircularProgress
                    percentage={percentSpent}
                    size={46}
                    strokeWidth={4.5}
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Deposit Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="100.00"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-lg font-bold font-display"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Deduct from Account
            </label>
            <select
              value={fundSourceAccountId}
              onChange={e => setFundSourceAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white text-xs"
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
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Confirm Deposit</span>
          </button>
        </form>
      </Modal>

    </div>
  );
};
