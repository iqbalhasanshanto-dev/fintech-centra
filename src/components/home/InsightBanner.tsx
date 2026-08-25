import React from 'react';
import { Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const InsightBanner: React.FC = () => {
  const { currentInsight } = useFinance();

  return (
    <div className="rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm transition-colors">
      <div className="flex items-start space-x-3.5">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Smart Analysis
            </span>
            {currentInsight.metric && (
              <span className="text-xs font-bold text-gray-500 dark:text-[#94A3B8] tabular-nums">
                • {currentInsight.metric}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold font-display text-gray-900 dark:text-[#FFFFFF] mt-1">
            {currentInsight.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-[#E2E8F0] mt-1 leading-relaxed">
            {currentInsight.description}
          </p>
        </div>
      </div>
    </div>
  );
};
