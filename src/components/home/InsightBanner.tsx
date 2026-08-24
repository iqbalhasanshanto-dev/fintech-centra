import React from 'react';
import { Sparkles, ArrowRight, TrendingDown, Lightbulb } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface InsightBannerProps {
  onOpenProModal: () => void;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({
  onOpenProModal,
}) => {
  const { currentInsight } = useFinance();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-[#131722] dark:to-[#131722] border border-brand-200/60 dark:border-[#1e2638] p-4 transition-all">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/20 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/60 px-2 py-0.5 rounded-md">
              AI Insight
            </span>
            {currentInsight.metric && (
              <span className="text-xs font-bold text-gray-500 dark:text-[#64748b]">
                {currentInsight.metric}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold font-display text-ink dark:text-[#f8fafc] mt-1">
            {currentInsight.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2 leading-relaxed">
            {currentInsight.description}
          </p>

          {/* Upsell button */}
          <div className="mt-2.5 pt-2 border-t border-brand-200/50 dark:border-[#1e2638] flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500 dark:text-[#64748b]">
              Want auto-budgeting rules?
            </span>
            <button
              onClick={onOpenProModal}
              className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"
            >
              <span>Get Pro</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
