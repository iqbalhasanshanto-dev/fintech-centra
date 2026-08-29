import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface TotalSpendSummaryProps {
  onNavigateToReport: () => void;
}

export const TotalSpendSummary: React.FC<TotalSpendSummaryProps> = ({
  onNavigateToReport,
}) => {
  const { categoryBreakdown, periodExpenses, settings } = useFinance();
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  const chartData = categoryBreakdown.map(item => ({
    name: item.category.name,
    value: item.total,
    color: item.category.color,
    percentage: item.percentage,
  }));

  // Top spend percentage
  const topSpendPercent = chartData.length > 0 ? `${chartData[0].percentage.toFixed(0)}%` : '0%';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] px-3.5 py-2 rounded-xl shadow-2xl text-left pointer-events-none z-50 animate-fade-in">
          <p className="text-xs font-bold text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tabular-nums mt-0.5">
            {formatCurrency(data.value, settings.baseCurrency, settings.privacyMode)} ({data.percentage?.toFixed(0)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="spending-analytics" className="mb-10 bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 sm:p-8 transition-colors shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block mb-1">
            Spend Breakdown
          </span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
            {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] p-1 rounded-xl">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Grid: Donut Chart & Category Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Donut Chart */}
        <div className="lg:col-span-5 relative h-[280px] sm:h-[300px] flex items-center justify-center">
          {chartData.length === 0 ? (
            <p className="text-xs text-gray-500">No expense data recorded.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Spend</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{topSpendPercent}</span>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Category breakdown items */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chartData.slice(0, 4).map((item) => (
            <div
              key={item.name}
              onClick={onNavigateToReport}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/70 dark:bg-[#0A0E1A]/60 border border-gray-200/80 dark:border-[#232C45]/80 hover:bg-gray-100 dark:hover:bg-[#1A233A] transition-colors cursor-pointer"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {formatCurrency(item.value, settings.baseCurrency, settings.privacyMode, false)} ({item.percentage.toFixed(0)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
