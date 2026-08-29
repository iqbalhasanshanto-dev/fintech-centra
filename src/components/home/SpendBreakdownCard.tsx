import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis
} from 'recharts';
import { PieChart as PieChartIcon, BarChart2, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface SpendBreakdownCardProps {
  onNavigateToReport: () => void;
}

export const SpendBreakdownCard: React.FC<SpendBreakdownCardProps> = ({
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

  const topSpendPercent = chartData.length > 0 ? `${chartData[0].percentage.toFixed(0)}%` : '0%';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] px-3.5 py-2 rounded-xl shadow-xl text-left pointer-events-none z-50 animate-fade-in">
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
    <section id="spend-breakdown-desktop" className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] rounded-2xl p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block mb-1">
            Spend Breakdown
          </span>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
            {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Donut/Bar Toggle Icons */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45]">
            <button
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Donut View"
              aria-label="Donut View"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Bar View"
              aria-label="Bar View"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>

          {/* Full Report Link */}
          <button
            onClick={onNavigateToReport}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1 cursor-pointer ml-2"
          >
            <span>Full Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Chart on Left, Legend on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Chart Column */}
        <div className="md:col-span-5 relative h-56 flex items-center justify-center">
          {chartData.length === 0 ? (
            <p className="text-xs text-gray-400">No expense data recorded.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'donut' ? (
                  <PieChart>
                    <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
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
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>

              {chartType === 'donut' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Spend</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{topSpendPercent}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Legend Column (2-col grid) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {chartData.slice(0, 4).map((item) => (
            <div
              key={item.name}
              onClick={onNavigateToReport}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-[#0A0E1A]/60 border border-gray-200/80 dark:border-[#232C45]/80 hover:bg-gray-100 dark:hover:bg-[#1A233A] transition-colors cursor-pointer"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
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
