import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const DonutChartCard: React.FC = () => {
  const { categoryBreakdown, periodExpenses, settings, setPeriodFilter, periodFilter } = useFinance();

  const chartData = categoryBreakdown.map(item => ({
    name: item.category.name,
    value: item.total,
    color: item.category.color,
    percentage: `${item.percentage.toFixed(0)}%`,
  }));

  const hasData = chartData.length > 0;
  const topSpendPercent = hasData ? chartData[0].percentage : '0%';

  const emptyData = [{ name: 'No Expenses', value: 1, color: '#262626' }];

  return (
    <div className="bg-[#171717] border border-gray-800 rounded-2xl p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-1">
            Spend Breakdown
          </span>
          <h2 className="text-3xl font-bold text-white">
            {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setPeriodFilter('this_month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              periodFilter === 'this_month'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 relative h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hasData ? chartData : emptyData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={105}
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                stroke="none"
              >
                {(hasData ? chartData : emptyData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-gray-400">Top Spend</span>
            <span className="text-2xl font-bold text-white">{topSpendPercent}</span>
          </div>
        </div>

        <div className="lg:col-span-7">
          {!hasData ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-gray-800 text-gray-500">
              <p className="text-sm font-medium text-gray-400">No expenses recorded yet</p>
              <p className="text-xs mt-1">Transactions you add will appear here categorized by spending</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300 truncate">{d.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(d.value, settings.baseCurrency, settings.privacyMode, false)} ({d.percentage})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
