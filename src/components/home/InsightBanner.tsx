import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface InsightBannerProps {
  onActionClick?: () => void;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ onActionClick }) => {
  const { currentInsight } = useFinance();

  if (!currentInsight) return null;

  const getIcon = () => {
    switch (currentInsight.type) {
      case 'spending':
        return AlertCircle;
      case 'positive':
        return CheckCircle2;
      case 'saving':
        return TrendingUp;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon();

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors shadow-xs">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/70 dark:border-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {currentInsight.title}
            </h4>
            {currentInsight.metric && (
              <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-300 text-[10px] font-bold">
                {currentInsight.metric}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {currentInsight.description}
          </p>
        </div>
      </div>

      {currentInsight.actionText && (
        <button
          onClick={onActionClick}
          className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/80 text-brand-600 dark:text-brand-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer border border-brand-200/60 dark:border-brand-900/40"
        >
          <span>{currentInsight.actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
