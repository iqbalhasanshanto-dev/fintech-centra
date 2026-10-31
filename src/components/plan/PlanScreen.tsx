import React, { useState } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical, 
  Calendar, 
  Trash2, 
  Wallet 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logger } from '../../utils/logger';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CircularProgress } from '../ui/CircularProgress';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Button } from '../ui/Button';
import { formatCurrency, calculateGoalPace } from '../../utils/formatters';

interface PlanScreenProps {
  onOpenAddGoal: () => void;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({
  onOpenAddGoal,
}) => {
  const { goals, budgets, settings, contributeToGoal, deleteGoal, accounts } = useFinance();
  
  const [selectedGoalForFunds, setSelectedGoalForFunds] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundSourceAccountId, setFundSourceAccountId] = useState(accounts[0]?.id || '');
  const [activeGoalMenuId, setActiveGoalMenuId] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForFunds) return;
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) return;

    contributeToGoal(selectedGoalForFunds.id, amount, fundSourceAccountId);

    if (selectedGoalForFunds.currentAmount + amount >= selectedGoalForFunds.targetAmount) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#10B981', '#818CF8', '#F59E0B'],
        });
      } catch (err) {
        logger.warn('Confetti animation failed:', err);
      }
    }

    setFundAmount('');
    setSelectedGoalForFunds(null);
  };

  const totalGoalsTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalGoalsSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallSavingsRate = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-36 sm:pb-40 lg:pb-8 pt-1 sm:pt-2">
      {/* Plan Summary Hero Card */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Total saved across goals
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#16A34A]/10 text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#22C55E] tabular-nums">
            {overallSavingsRate.toFixed(0)}% Achieved
          </span>
        </div>

        <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
          {formatCurrency(totalGoalsSaved, settings.baseCurrency, settings.privacyMode)}
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
            of {formatCurrency(totalGoalsTarget, settings.baseCurrency, settings.privacyMode)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] dark:bg-white/[0.07] overflow-hidden mt-4">
          <div
            className="h-full rounded-full bg-[#16A34A] dark:bg-[#22C55E] transition-all duration-700"
            style={{ width: `${Math.min(100, overallSavingsRate)}%` }}
          />
        </div>
      </div>

      {/* Section 1: Milestone Savings Goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Milestone savings goals
            </h3>
            <span className="w-5 h-5 rounded-full bg-[#F1F2F4] dark:bg-[#262626] text-gray-600 dark:text-gray-400 text-xs font-semibold flex items-center justify-center font-mono">
              {goals.length}
            </span>
          </div>

          {goals.length > 0 && (
            <button
              onClick={onOpenAddGoal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#16A34A]/15 text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#22C55E] text-xs font-semibold hover:bg-[#16A34A]/25 dark:hover:bg-[#22C55E]/25 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Target</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="p-8 rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No savings goals created yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                Set milestones for a dream purchase, vacation, or emergency fund to track your progress.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenAddGoal}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Goal
              </Button>
            </div>
          ) : (
            goals.map(goal => {
              const pace = calculateGoalPace(
                goal.currentAmount,
                goal.targetAmount,
                goal.startDate,
                goal.targetDate
              );

              const progressBarColor = pace.isBehind ? '#F59E0B' : (goal.color || '#C6FF3D');

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.2] transition-colors space-y-3.5 shadow-sm"
                >
                  {/* Top Row: Icon, Title, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                        <CategoryIcon name={goal.icon} className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug break-words">
                          {goal.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Add Funds & Menu */}
                    <div className="flex items-center space-x-2 relative shrink-0">
                      <button
                        onClick={() => setSelectedGoalForFunds(goal)}
                        className="px-3 py-1.5 rounded-full border border-black/[0.12] dark:border-white/[0.14] bg-[#F1F2F4] dark:bg-[#262626] text-[#16A34A] dark:text-[#22C55E] hover:bg-[#E5E7EB] dark:hover:bg-[#333333] text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        + Add Funds
                      </button>

                      <button
                        onClick={() => setActiveGoalMenuId(activeGoalMenuId === goal.id ? null : goal.id)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-[#F1F2F4] dark:hover:bg-[#262626] transition-colors cursor-pointer"
                        aria-label="Goal options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeGoalMenuId === goal.id && (
                        <div className="absolute right-0 top-11 w-32 bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-black/[0.08] dark:border-white/[0.1] py-1 z-30 animate-fade-in text-xs">
                          <button
                            onClick={() => {
                              setGoalToDelete(goal);
                              setActiveGoalMenuId(null);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-[#F1F2F4] dark:hover:bg-white/[0.06] flex items-center space-x-2 font-semibold cursor-pointer rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amounts row */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
                      {formatCurrency(goal.currentAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      of {formatCurrency(goal.targetAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                  </div>

                  {/* Progress details row above track */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Saved so far</span>
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: pace.isBehind ? '#F59E0B' : (goal.color || '#22C55E') }}
                    >
                      {formatCurrency(pace.remainingAmount, settings.baseCurrency, settings.privacyMode)} left
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] dark:bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pace.percentComplete}%`,
                        backgroundColor: progressBarColor,
                      }}
                    />
                  </div>

                  {/* Pace row */}
                  {pace.isBehind ? (
                    <div className="flex items-center space-x-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="leading-snug">
                        <strong className="font-bold">{pace.behindPercent}% behind schedule</strong> — save ~{formatCurrency(pace.recommendedMonthly, settings.baseCurrency, settings.privacyMode, false)}/mo to finish on target.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
                      <span>On target pace ({pace.percentComplete.toFixed(0)}% reached)</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 2: Budgets & Category Spending Limits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Category Budgets
            </h3>
            <span className="w-5 h-5 rounded-full bg-[#F1F2F4] dark:bg-[#262626] text-gray-600 dark:text-gray-400 text-xs font-semibold flex items-center justify-center font-mono">
              {budgets.length}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {budgets.length === 0 ? (
            <div className="p-8 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No category budgets created yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Set monthly spending limits for your categories to keep spending on track.
              </p>
            </div>
          ) : (
            budgets.map(budget => {
              const percentSpent = (budget.spentAmount / budget.limitAmount) * 100;
              const remaining = budget.limitAmount - budget.spentAmount;
              const isOver = percentSpent >= 100;

              return (
                <div
                  key={budget.id}
                  className="p-5 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.2] transition-colors flex items-center justify-between shadow-sm"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                      <CategoryIcon name={budget.categoryIcon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {budget.categoryName}
                        </h4>
                        {isOver && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-semibold uppercase tracking-wider">
                            Over Limit
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
                        {formatCurrency(budget.spentAmount, settings.baseCurrency, settings.privacyMode)} of{' '}
                        {formatCurrency(budget.limitAmount, settings.baseCurrency, settings.privacyMode)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Circular Progress Ring + Column-aligned Remaining Values */}
                  <div className="shrink-0 flex items-center space-x-4">
                    <div className="text-right min-w-[110px] font-mono tabular-nums text-xs">
                      <span className={`font-semibold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
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
            })
          )}
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
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Deposit Amount ({settings.baseCurrency || 'USD'})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="500.00"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-900 dark:text-white text-xl font-bold tabular-nums focus:outline-none focus:border-[#C6FF3D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Deduct from Account
            </label>
            {accounts.length === 0 ? (
              <p className="text-xs text-rose-500 py-2">
                No connected accounts available. Please add an account first.
              </p>
            ) : (
              <select
                value={fundSourceAccountId}
                onChange={e => setFundSourceAccountId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#C6FF3D]"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id} className="bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-white">
                    {a.name} — Available: {formatCurrency(a.balance, a.currency)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={accounts.length === 0}
            icon={<Wallet className="w-4 h-4" />}
          >
            Confirm Deposit
          </Button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={goalToDelete !== null}
        onClose={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoal(goalToDelete.id);
            setGoalToDelete(null);
          }
        }}
        title="Delete Goal"
        message={goalToDelete ? `Delete "${goalToDelete.name}"?` : ''}
        type="danger"
        confirmText="Delete"
      />

    </div>
  );
};

