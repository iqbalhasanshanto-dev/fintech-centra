import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { getThemePalette } from '../../utils/themeColors';

export const IncomeExpenseLineChart: React.FC = () => {
  const { transactions, settings, periodIncome, periodExpenses } = useFinance();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const palette = getThemePalette(isDark);

  // Group transactions by date over time
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const dateMap: Record<string, { income: number; expense: number; rawDate: Date }> = {};

    transactions.forEach(tx => {
      const dateStr = tx.date.split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          income: 0,
          expense: 0,
          rawDate: new Date(dateStr),
        };
      }
      if (tx.type === 'income') {
        dateMap[dateStr].income += tx.amount;
      } else if (tx.type === 'expense') {
        dateMap[dateStr].expense += tx.amount;
      }
    });

    const sortedEntries = Object.entries(dateMap).sort(
      ([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()
    );

    return sortedEntries.map(([dateKey, val]) => {
      const d = new Date(dateKey);
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        dateKey,
        formattedDate,
        income: Math.round(val.income * 100) / 100,
        expense: Math.round(val.expense * 100) / 100,
      };
    });
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] p-3 rounded-xl shadow-xl text-left pointer-events-none z-50 animate-fade-in text-xs space-y-1.5 min-w-[150px]">
          <p className="font-bold text-[#171717] dark:text-[#FAFAFA] border-b border-[#E5E5E5] dark:border-[#404040] pb-1">
            {label}
          </p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium text-[#737373] dark:text-[#A3A3A3]">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-bold tabular-nums text-[#171717] dark:text-[#FAFAFA]">
                {formatCurrency(item.value, settings.baseCurrency, settings.privacyMode)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section id="cashflow-line-chart" className="bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] rounded-2xl p-6 transition-colors shadow-xs">
      {/* Header with Title and Legend Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#737373] dark:text-[#A3A3A3] block mb-1">
            Income vs Expense Over Time
          </span>
          <h3 className="text-xl font-bold text-[#171717] dark:text-[#FAFAFA]">
            Cash Flow Trend
          </h3>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#404040]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: palette.positive }}
            />
            <span className="text-[#737373] dark:text-[#A3A3A3]">Income:</span>
            <span className="tabular-nums" style={{ color: palette.positive }}>
              {formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode, false)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#404040]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: palette.negative }}
            />
            <span className="text-[#737373] dark:text-[#A3A3A3]">Expense:</span>
            <span className="tabular-nums" style={{ color: palette.negative }}>
              {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode, false)}
            </span>
          </div>
        </div>
      </div>

      {/* Line Chart Container */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#737373] dark:text-[#A3A3A3]">
            No transaction data available for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={palette.border}
                vertical={false}
              />
              <XAxis
                dataKey="formattedDate"
                stroke={palette.textSecondary}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={palette.textSecondary}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => {
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return `${val}`;
                }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke={palette.positive}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: palette.positive, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: palette.positive }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke={palette.negative}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: palette.negative, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: palette.negative }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
