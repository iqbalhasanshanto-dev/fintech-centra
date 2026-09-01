import React, { useState } from 'react';
import { 
  Plus, 
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
import { Goal } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CircularProgress } from '../ui/CircularProgress';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
              icon={<ArrowLeft className="w-4 h-4" />}
              aria-label="Back to Dashboard"
            >
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Goals &amp; Budgets
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Savings milestones and category monthly limits
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenAddGoal}
          icon={<Plus className="w-4 h-4" />}
        >
          New Target
        </Button>
      </div>

      {/* Plan Summary Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] transition-colors shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Total saved across goals
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
            {overallSavingsRate.toFixed(0)}% Achieved
          </span>
        </div>

        <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
          {formatCurrency(totalGoalsSaved, settings.baseCurrency, settings.privacyMode)}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            of {formatCurrency(totalGoalsTarget, settings.baseCurrency, settings.privacyMode)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#0A0E1A] overflow-hidden mt-4">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(100, overallSavingsRate)}%` }}
          />
        </div>
      </div>

      {/* Section 1: Featured Goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-2">
            <span>Milestone Savings Goals</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full font-mono">
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

            const progressBarColor = pace.isBehind ? '#F59E0B' : '#10B981';

            return (
              <div
                key={goal.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-colors space-y-4 shadow-xs"
              >
                {/* Top Row: Icon, Title, Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200/80 dark:border-[#232C45] text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
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
                      className="w-[110px] h-[38px] rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] hover:bg-gray-200 dark:hover:bg-[#1A233A] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-white text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      + Add Funds
                    </button>

                    <button
                      onClick={() => setActiveGoalMenuId(activeGoalMenuId === goal.id ? null : goal.id)}
                      className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#1A233A] transition-colors cursor-pointer"
                      aria-label="Goal options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeGoalMenuId === goal.id && (
                      <div className="absolute right-0 top-12 w-32 bg-white dark:bg-[#121A2C] rounded-xl shadow-2xl border border-gray-200 dark:border-[#232C45] py-1 z-30 animate-fade-in text-xs">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${goal.name}"?`)) {
                              deleteGoal(goal.id);
                            }
                            setActiveGoalMenuId(null);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-gray-100 dark:hover:bg-[#1A233A] flex items-center space-x-2 font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amounts readout */}
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
                      {formatCurrency(goal.currentAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1.5 tabular-nums">
                      saved of {formatCurrency(goal.targetAmount, settings.baseCurrency, settings.privacyMode)}
                    </span>
                  </div>
                  <span className="font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
                    {formatCurrency(pace.remainingAmount, settings.baseCurrency, settings.privacyMode)} left
                  </span>
                </div>

                {/* Linear Progress Bar with standardized colors (Emerald = on track, Amber = behind) */}
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#0A0E1A] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pace.percentComplete}%`,
                      backgroundColor: progressBarColor,
                    }}
                  />
                </div>

                {/* Status */}
                {pace.isBehind ? (
                  <div className="flex items-center space-x-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="leading-snug">
                      <strong className="font-bold">{pace.behindPercent}% behind schedule</strong> — save ~{formatCurrency(pace.recommendedMonthly, settings.baseCurrency, settings.privacyMode, false)}/mo to finish on target.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>On target pace ({pace.percentComplete.toFixed(0)}% reached)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Budgets & Category Spending Limits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Category Budgets
            </h3>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full font-mono">
              {budgets.length}
            </span>
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
                className="p-5 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-colors flex items-center justify-between shadow-xs"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200/80 dark:border-[#232C45] text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
                    <CategoryIcon name={budget.categoryIcon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {budget.categoryName}
                      </h4>
                      {isOver && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
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
                  <div className="text-right min-w-[130px] font-mono tabular-nums text-xs">
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
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Deposit Amount (৳ BDT)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="500.00"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xl font-bold tabular-nums focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Deduct from Account
            </label>
            <select
              value={fundSourceAccountId}
              onChange={e => setFundSourceAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
                  {a.name} — Available: {formatCurrency(a.balance, a.currency)}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon={<Wallet className="w-4 h-4" />}
          >
            Confirm Deposit
          </Button>
        </form>
      </Modal>

    </div>
  );
};
