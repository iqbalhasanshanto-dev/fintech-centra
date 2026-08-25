import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { PieChart as PieChartIcon, BarChart2, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface TotalSpendSummaryProps {
  onNavigateToReport: () => void;
}

export const TotalSpendSummary: React.FC<TotalSpendSummaryProps> = ({
  onNavigateToReport,
}) => {
  const { categoryBreakdown, periodExpenses, settings } = useFinance();
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');

  const chartData = categoryBreakdown.map(item => ({
    name: item.category.name,
    value: item.total,
    color: item.category.color,
    percentage: item.percentage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#161B26] border border-white/10 px-3 py-1.5 rounded-xl shadow-xl text-left pointer-events-none z-50 animate-fade-in">
          <p className="text-xs font-bold text-[#FFFFFF]">{data.name}</p>
          <p className="text-xs text-[#94A3B8] font-medium tabular-nums mt-0.5">
            {formatCurrency(data.value, settings.baseCurrency, settings.privacyMode)} ({data.percentage?.toFixed(0)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm transition-colors">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8]">
            Total Spend Breakdown
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-gray-900 dark:text-[#FFFFFF] tabular-nums currency-amount mt-0.5">
            {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-[#1E2536] border border-gray-200/60 dark:border-white/5">
            <button
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-[#161B26] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#E2E8F0]'
              }`}
              title="Donut Overview"
              aria-label="Switch to donut chart"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-[#161B26] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#E2E8F0]'
              }`}
              title="Bar Overview"
              aria-label="Switch to bar chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onNavigateToReport}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center space-x-0.5"
          >
            <span>Full Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Visualization Container */}
      <div className="h-44 sm:h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'donut' ? (
            <PieChart>
              <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart 
              data={chartData} 
              margin={{ top: 8, right: 10, left: 0, bottom: 20 }}
              barCategoryGap="16%"
            >
              <XAxis
                dataKey="name"
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => `৳${val}`}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} isAnimationActive={false} />
              <Bar dataKey="value" maxBarSize={28} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category Pills list below chart */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
        {chartData.slice(0, 4).map(item => (
          <div 
            key={item.name}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#1E2536] text-xs"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-700 dark:text-[#E2E8F0] font-medium truncate max-w-[90px]">{item.name}</span>
            <span className="text-gray-400 dark:text-[#94A3B8] font-bold tabular-nums">({item.percentage.toFixed(0)}%)</span>
          </div>
        ))}
      </div>

    </div>
  );
};
