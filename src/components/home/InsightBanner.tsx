import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Button } from '../ui/Button';

interface InsightBannerProps {
  onActionClick?: () => void;
}

const renderInsightIcon = (type?: string) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case 'spending':
      return <AlertCircle className={iconClass} />;
    case 'positive':
      return <CheckCircle2 className={iconClass} />;
    case 'saving':
      return <TrendingUp className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
};

export const InsightBanner: React.FC<InsightBannerProps> = ({ onActionClick }) => {
  const { currentInsight } = useFinance();

  if (!currentInsight) return null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors shadow-xs">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/70 dark:border-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
          {renderInsightIcon(currentInsight.type)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {currentInsight.title}
            </h3>
            {currentInsight.metric && (
              <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-300 text-xs font-bold">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onActionClick}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
          className="self-start sm:self-center shrink-0 border border-brand-200/60 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/80 text-brand-600 dark:text-brand-300"
        >
          {currentInsight.actionText}
        </Button>
      )}
    </div>
  );
};
