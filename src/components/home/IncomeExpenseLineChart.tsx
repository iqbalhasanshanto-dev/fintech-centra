import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { convertCurrency, formatCurrency } from '../../utils/formatters';
import { getPeriodDateRange } from '../../utils/dates';
import { getThemePalette } from '../../utils/themeColors';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  baseCurrency?: string | null;
  privacyMode: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  baseCurrency,
  privacyMode,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#262626] border border-black/[0.08] dark:border-white/[0.12] p-3 rounded-2xl shadow-xl text-left pointer-events-none z-50 animate-fade-in text-xs space-y-1.5 min-w-[140px]">
        <p className="font-semibold text-[#18212F] dark:text-white border-b border-black/[0.06] dark:border-white/[0.08] pb-1">
          {label}
        </p>
        {payload.map((item, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium text-[#667085] dark:text-[#9CA3AF]">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}:
            </span>
            <span className="font-bold tabular-nums text-[#18212F] dark:text-white">
              {formatCurrency(Number(item.value || 0), baseCurrency, privacyMode)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const IncomeExpenseLineChart: React.FC = () => {
  const { transactions, settings, periodFilter } = useFinance();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const palette = getThemePalette(isDark);

  // Group transactions by date over time with running cumulative income & expenses
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const baseCurrency = settings.baseCurrency || 'USD';
    const effectivePeriod = periodFilter || 'this_month';
    const { start, end } = getPeriodDateRange(effectivePeriod);

    // Compute prior net balance carried over from prior months
    let priorNetBalance = 0;
    if (effectivePeriod !== 'all') {
      let priorIncome = 0;
      let priorExpenses = 0;
      transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate < start) {
          const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
          if (tx.type === 'income') {
            priorIncome += amountInBase;
          } else if (tx.type === 'expense') {
            priorExpenses += amountInBase;
          }
        }
      });
      priorNetBalance = Math.max(0, priorIncome - priorExpenses);
    }

    // Filter transactions belonging to current period
    const periodTransactions = transactions.filter(tx => {
      if (effectivePeriod === 'all') return true;
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });

    if (periodTransactions.length === 0 && priorNetBalance === 0) {
      return [];
    }

    const dateMap: Record<string, { income: number; expense: number }> = {};

    // If there is prior carried-over balance, ensure Day 1 of the month is established as baseline
    if (effectivePeriod !== 'all' && priorNetBalance > 0) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const day1Key = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`;
      dateMap[day1Key] = { income: 0, expense: 0 };
    }

    periodTransactions.forEach(tx => {
      const dateStr = tx.date.split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          income: 0,
          expense: 0,
        };
      }
      const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        dateMap[dateStr].income += amountInBase;
      } else if (tx.type === 'expense') {
        dateMap[dateStr].expense += amountInBase;
      }
    });

    const sortedDates = Object.keys(dateMap).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let runningIncome = priorNetBalance;
    let runningExpense = 0;

    return sortedDates.map(dateKey => {
      const val = dateMap[dateKey];
      runningIncome += val.income;
      runningExpense += val.expense;

      const d = new Date(dateKey + 'T00:00:00');
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        dateKey,
        formattedDate,
        income: Math.round(runningIncome * 100) / 100,
        expense: Math.round(runningExpense * 100) / 100,
      };
    });
  }, [transactions, periodFilter, settings.baseCurrency]);

  return (
    <section id="cashflow-line-chart" className="rounded-[28px] bg-white dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.15] p-5 sm:p-6 shadow-sm transition-all w-full h-full flex flex-col justify-between lg:mt-0">
      {/* Header with Title and Dot Legend (08-home.png) */}
      <div className="mb-5">
        <h3 className="text-base font-semibold text-[#18212F] dark:text-white">
          Cash Flow Trend
        </h3>
        <div className="flex items-center gap-4 mt-2 text-xs font-medium text-[#667085] dark:text-[#9CA3AF]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: palette.positive }}
            />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: palette.negative }}
            />
            <span>Expenses</span>
          </div>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="h-60 sm:h-64 lg:flex-1 lg:min-h-[220px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#667085] dark:text-[#9CA3AF]">
            No transaction data available for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.positive} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={palette.positive} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.negative} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={palette.negative} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}
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
              <RechartsTooltip content={<CustomTooltip baseCurrency={settings.baseCurrency} privacyMode={settings.privacyMode} />} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke={palette.positive}
                strokeWidth={2}
                fill="url(#incomeAreaGradient)"
                dot={chartData.length === 1 ? { r: 4, fill: palette.positive } : false}
                activeDot={{ r: 5, fill: palette.positive, stroke: isDark ? '#1D1D1D' : '#FFFFFF', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke={palette.negative}
                strokeWidth={2}
                fill="url(#expenseAreaGradient)"
                dot={chartData.length === 1 ? { r: 4, fill: palette.negative } : false}
                activeDot={{ r: 5, fill: palette.negative, stroke: isDark ? '#1D1D1D' : '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
