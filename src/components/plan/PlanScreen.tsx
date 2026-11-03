import React, { useState } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical, 
  Calendar, 
  Trash2, 
  Wallet,
  ArrowDownRight,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logger } from '../../utils/logger';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { ensureGoalHistory } from '../../utils/goalHistory';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CircularProgress } from '../ui/CircularProgress';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Button } from '../ui/Button';
import { SwipeableRow } from '../ui/SwipeableRow';
import { formatCurrency, calculateGoalPace } from '../../utils/formatters';
import { isNative } from '../../utils/platform';

interface PlanScreenProps {
  onOpenAddGoal: () => void;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({
  onOpenAddGoal,
}) => {
  const { goals, budgets, settings, contributeToGoal, withdrawFromGoal, deleteGoal, deleteBudget, deleteGoalHistoryEntry } = useFinance();
  
  const [selectedGoalForFunds, setSelectedGoalForFunds] = useState<Goal | null>(null);
  const [fundMode, setFundMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [fundAmount, setFundAmount] = useState('');
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundShakeKey, setFundShakeKey] = useState(0);
  const [activeGoalMenuId, setActiveGoalMenuId] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [goalForHistory, setGoalForHistory] = useState<Goal | null>(null);

  const [cachedGoalName, setCachedGoalName] = useState<string>('');
  const goalTitleName = selectedGoalForFunds?.name || cachedGoalName || 'Goal';

  const openFundModal = (goal: Goal, mode: 'deposit' | 'withdraw') => {
    setSelectedGoalForFunds(goal);
    setCachedGoalName(goal.name);
    setFundMode(mode);
    setFundAmount('');
    setFundError(null);
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForFunds) return;
    setFundError(null);

    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      setFundError('Please enter a valid amount');
      setFundShakeKey(k => k + 1);
      return;
    }

    if (fundMode === 'withdraw') {
      if (amount > selectedGoalForFunds.currentAmount) {
        setFundError('Withdrawal amount cannot exceed current saved goal balance');
        setFundShakeKey(k => k + 1);
        return;
      }

      try {
        await withdrawFromGoal(selectedGoalForFunds.id, amount);
        setFundAmount('');
        setFundError(null);
        setSelectedGoalForFunds(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setFundError(msg);
      }
    } else {
      try {
        await contributeToGoal(selectedGoalForFunds.id, amount);

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
        setFundError(null);
        setSelectedGoalForFunds(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setFundError(msg);
      }
    }
  };

  const totalGoalsTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalGoalsSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallSavingsRate = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-2 pt-1 sm:pt-2">
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
                <SwipeableRow
                  key={goal.id}
                  onDelete={() => deleteGoal(goal.id)}
                  deleteLabel="Delete"
                >
                  <div
                    className="p-5 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.2] transition-colors space-y-3.5 shadow-sm"
                  >
                  {/* Top Row: Icon, Title, Actions */}
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                        <CategoryIcon name={goal.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2"
                          style={{ wordBreak: 'normal', overflowWrap: 'normal' }}
                        >
                          {goal.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1 mt-0.5 truncate">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Add & Withdraw Actions & Menu */}
                    <div className="flex items-center space-x-1.5 sm:space-x-2 relative shrink-0">
                      <button
                        onClick={() => openFundModal(goal, 'deposit')}
                        className="px-2.5 py-1 rounded-full bg-[#16A34A]/15 text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#22C55E] hover:bg-[#16A34A]/25 dark:hover:bg-[#22C55E]/25 text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        + Add
                      </button>

                      <button
                        onClick={() => openFundModal(goal, 'withdraw')}
                        className={`px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 dark:hover:bg-amber-500/25 text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          goal.currentAmount <= 0 ? 'opacity-50' : ''
                        }`}
                      >
                        - Withdraw
                      </button>

                      <button
                        onClick={() => setActiveGoalMenuId(activeGoalMenuId === goal.id ? null : goal.id)}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-[#F1F2F4] dark:hover:bg-[#262626] transition-colors cursor-pointer shrink-0"
                        aria-label="Goal options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeGoalMenuId === goal.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveGoalMenuId(null)}
                          />
                          <div className="absolute right-0 top-11 w-36 bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-black/[0.08] dark:border-white/[0.1] py-1 z-30 origin-top-right-spring text-xs">
                            <button
                              onClick={() => {
                                setGoalForHistory(goal);
                                setActiveGoalMenuId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-[#F1F2F4] dark:hover:bg-white/[0.06] flex items-center space-x-2 font-medium cursor-pointer rounded-xl"
                            >
                              <History className="w-4 h-4 text-[#4D6E18] dark:text-[#C6FF3D] shrink-0" />
                              <span>History</span>
                            </button>
                            <button
                              onClick={() => {
                                setGoalToDelete(goal);
                                setActiveGoalMenuId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-[#F1F2F4] dark:hover:bg-white/[0.06] flex items-center space-x-2 font-semibold cursor-pointer rounded-xl"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
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
              </SwipeableRow>
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
                <SwipeableRow
                  key={budget.id}
                  onDelete={() => deleteBudget(budget.id)}
                  deleteLabel="Delete"
                >
                  <div
                    className="p-5 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.2] transition-colors flex items-center justify-between gap-2.5 sm:gap-4 shadow-sm"
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                        <CategoryIcon name={budget.categoryIcon} className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {budget.categoryName}
                          </h4>
                          {isOver && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                              Over Limit
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums truncate whitespace-nowrap">
                          {formatCurrency(budget.spentAmount, settings.baseCurrency, settings.privacyMode)} of{' '}
                          {formatCurrency(budget.limitAmount, settings.baseCurrency, settings.privacyMode)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Circular Progress Ring + Column-aligned Remaining Values */}
                    <div className="shrink-0 flex items-center gap-2.5 sm:gap-4">
                      <div className="text-right whitespace-nowrap font-mono tabular-nums text-xs">
                        <span className={`font-semibold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {isOver
                            ? `${formatCurrency(Math.abs(remaining), settings.baseCurrency, settings.privacyMode)} over`
                            : `${formatCurrency(remaining, settings.baseCurrency, settings.privacyMode)} left`}
                        </span>
                      </div>

                      <CircularProgress
                        percentage={percentSpent}
                        size={40}
                        strokeWidth={4}
                        showText={true}
                      />

                      {!isNative() && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBudget(budget.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                          title="Delete budget"
                          aria-label="Delete budget"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </SwipeableRow>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Withdraw Funds Modal */}
      <Modal
        isOpen={!!selectedGoalForFunds}
        onClose={() => {
          setSelectedGoalForFunds(null);
          setFundError(null);
        }}
        title={
          fundMode === 'deposit'
            ? `Add Funds to ${goalTitleName}`
            : `Withdraw Funds from ${goalTitleName}`
        }
        subtitle={
          fundMode === 'deposit'
            ? 'Deposit money toward your target'
            : 'Withdraw money back into an account'
        }
      >
        <div className="space-y-4">
          {/* Segmented Switcher */}
          <div className="relative flex rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] p-1 border border-black/[0.06] dark:border-white/[0.08]">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white dark:bg-[#1D1D1D] shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] pointer-events-none"
              style={{
                transform: `translateX(${fundMode === 'deposit' ? '0%' : '100%'})`,
                left: '4px',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setFundMode('deposit');
                setFundError(null);
              }}
              className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                fundMode === 'deposit'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              + Add Funds
            </button>
            <button
              type="button"
              onClick={() => {
                setFundMode('withdraw');
                setFundError(null);
              }}
              className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                fundMode === 'withdraw'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              - Withdraw Funds
            </button>
          </div>

          {selectedGoalForFunds && (
            <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Saved Goal Balance</span>
              <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(selectedGoalForFunds.currentAmount, settings.baseCurrency, settings.privacyMode)}
              </span>
            </div>
          )}

          {fundError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {fundError}
            </div>
          )}

          <form onSubmit={handleFundSubmit} className="space-y-4">
            <div key={fundShakeKey} className={fundError ? 'animate-error-shake' : ''}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                {fundMode === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'} ({settings.baseCurrency || 'USD'})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="500.00"
                value={fundAmount}
                onChange={e => {
                  setFundAmount(e.target.value);
                  if (fundError) setFundError(null);
                }}
                className={`w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border text-gray-900 dark:text-white text-xl font-bold tabular-nums focus:outline-none ${
                  fundError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#C6FF3D]'
                }`}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              icon={<Wallet className="w-4 h-4" />}
            >
              {fundMode === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </Button>
          </form>
        </div>
      </Modal>

      {/* Dedicated Per-Goal History Modal */}
      <Modal
        isOpen={!!goalForHistory}
        onClose={() => setGoalForHistory(null)}
        title={goalForHistory ? `${goalForHistory.name} History` : 'Goal History'}
        subtitle="Chronological log of deposits and withdrawals"
      >
        {goalForHistory && (() => {
          const liveGoal = goals.find(g => g.id === goalForHistory.id) || goalForHistory;
          const historyList = liveGoal.history && liveGoal.history.length > 0 ? liveGoal.history : ensureGoalHistory(liveGoal);
          const percent = liveGoal.targetAmount > 0 ? (liveGoal.currentAmount / liveGoal.targetAmount) * 100 : 0;

          return (
            <div className="space-y-4">
              {/* Goal Balance Progress Card */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F1F2F4] dark:bg-[#262626] flex items-center justify-center shrink-0">
                      <CategoryIcon name={liveGoal.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{liveGoal.name}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Target: {formatCurrency(liveGoal.targetAmount, settings.baseCurrency, settings.privacyMode)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
                      {percent.toFixed(0)}%
                    </span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">
                      {formatCurrency(liveGoal.currentAmount, settings.baseCurrency, settings.privacyMode)}
                    </p>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] dark:bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#16A34A] dark:bg-[#22C55E] transition-all duration-500"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>

              {/* History Entries List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {historyList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                    <History className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 opacity-60" />
                    <p className="font-semibold text-gray-800 dark:text-gray-200">No activity logged yet</p>
                    <p>Deposits and withdrawals for this goal will be recorded here.</p>
                  </div>
                ) : (
                  historyList.map(entry => {
                    const isWithdraw = entry.type === 'withdraw';
                    const isInitial = entry.type === 'initial';
                    const dateFormatted = new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <SwipeableRow
                        key={entry.id}
                        onDelete={() => deleteGoalHistoryEntry(liveGoal.id, entry.id)}
                        deleteLabel="Delete"
                      >
                        <div
                          className="p-3 rounded-2xl bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isInitial
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  : isWithdraw
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-[#16A34A]/15 text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#22C55E]'
                              }`}
                            >
                              {isInitial ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isWithdraw ? (
                                <ArrowDownRight className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {isInitial ? 'Initial Deposit' : isWithdraw ? 'Withdrawn Funds' : 'Added Funds'}
                              </h5>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {dateFormatted}
                                {entry.note ? ` • ${entry.note}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              <span
                                className={`text-xs font-bold tabular-nums block ${
                                  isWithdraw
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-[#16A34A] dark:text-[#22C55E]'
                                }`}
                              >
                                {isWithdraw ? '-' : '+'}{formatCurrency(entry.amount, settings.baseCurrency, settings.privacyMode)}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-white/40 tabular-nums">
                                Bal: {formatCurrency(entry.balanceAfter, settings.baseCurrency, settings.privacyMode)}
                              </span>
                            </div>

                            {!isNative() && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteGoalHistoryEntry(liveGoal.id, entry.id);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete entry"
                                aria-label="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </SwipeableRow>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}
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

