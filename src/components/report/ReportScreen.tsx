import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight, 
  ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../ui/CategoryIcon';
import { TransactionDetailModal } from '../home/TransactionDetailModal';
import { AnalyticsCalendar } from './AnalyticsCalendar';
import { formatCurrency } from '../../utils/formatters';
import { Transaction, PeriodFilter } from '../../types';
import { getThemePalette } from '../../utils/themeColors';

interface ReportScreenProps {
  onBackToHome?: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  onBackToHome,
  onSelectTransaction,
}) => {
  const {
    categoryBreakdown,
    periodIncome,
    periodExpenses,
    periodFilter,
    setPeriodFilter,
    settings,
    transactions,
    categories,
  } = useFinance();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const palette = getThemePalette(isDark);

  const [activeChartTab, setActiveChartTab] = useState<'grouped_bar' | 'donut'>('grouped_bar');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
  ];

  // 1. Grouped Bar Chart Data: Income vs Expense per Category
  const categoryComparisonData = useMemo(() => {
    const map: Record<string, { id: string; name: string; income: number; expense: number; color: string }> = {};

    categories.forEach(cat => {
      map[cat.id] = {
        id: cat.id,
        name: cat.name,
        income: 0,
        expense: 0,
        color: cat.color,
      };
    });

    transactions.forEach(tx => {
      const catId = tx.categoryId || 'other';
      if (!map[catId]) {
        map[catId] = {
          id: catId,
          name: tx.categoryName || 'Other',
          income: 0,
          expense: 0,
          color: tx.categoryColor || palette.textSecondary,
        };
      }
      if (tx.type === 'income') {
        map[catId].income += tx.amount;
      } else if (tx.type === 'expense') {
        map[catId].expense += tx.amount;
      }
    });

    // Only include categories that have at least some transaction activity
    const activeList = Object.values(map).filter(item => item.income > 0 || item.expense > 0);
    return activeList.map(item => ({
      ...item,
      income: Math.round(item.income * 100) / 100,
      expense: Math.round(item.expense * 100) / 100,
    }));
  }, [categories, transactions, palette.textSecondary]);

  // 2. Donut Chart Data: Expenses by Category
  const expenseDonutData = useMemo(() => {
    return categoryBreakdown.map(item => ({
      name: item.category.name,
      value: Math.round(item.total * 100) / 100,
      color: item.category.color,
      percentage: item.percentage,
      count: item.transactionCount,
      categoryId: item.category.id,
    }));
  }, [categoryBreakdown]);

  const topExpenseCategory = expenseDonutData.length > 0 ? expenseDonutData[0] : null;

  const getTransactionsForCategory = (catId: string) => {
    return transactions.filter(t => t.categoryId === catId);
  };

  const handleTxSelect = (tx: Transaction) => {
    if (onSelectTransaction) onSelectTransaction(tx);
    setSelectedTx(tx);
  };

  // Tooltip for Grouped Bar Chart
  const GroupedBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] p-3 rounded-xl shadow-xl text-left pointer-events-none z-50 animate-fade-in text-xs space-y-1 min-w-[160px]">
          <p className="font-bold text-[#171717] dark:text-[#FAFAFA] border-b border-[#E5E5E5] dark:border-[#404040] pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium text-[#737373] dark:text-[#A3A3A3]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold tabular-nums text-[#171717] dark:text-[#FAFAFA]">
                {formatCurrency(entry.value, settings.baseCurrency, settings.privacyMode)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip for Donut Chart
  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] px-3.5 py-2 rounded-xl shadow-2xl text-left pointer-events-none z-50 animate-fade-in text-xs">
          <p className="font-bold text-[#171717] dark:text-[#FAFAFA]">{data.name}</p>
          <p className="text-[#737373] dark:text-[#A3A3A3] mt-0.5 font-medium tabular-nums">
            Spend: {formatCurrency(data.value, settings.baseCurrency, settings.privacyMode)} ({data.percentage?.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header with Back Button & Period Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 -ml-2 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors cursor-pointer"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-[#171717] dark:text-[#FAFAFA]">
              Analytics &amp; Breakdown
            </h2>
            <p className="text-sm text-[#737373] dark:text-[#A3A3A3] mt-0.5">
              Category income vs. expense comparison, expense distribution &amp; daily calendar
            </p>
          </div>
        </div>

        {/* Period Selector Dropdown */}
        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] text-[#171717] dark:text-[#FAFAFA] hover:border-[#737373] focus:outline-none cursor-pointer shadow-xs"
        >
          {periods.map(p => (
            <option key={p.id} value={p.id} className="bg-white dark:bg-[#171717] text-[#171717] dark:text-[#FAFAFA]">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-widest text-[#737373] dark:text-[#A3A3A3] block mb-1">
            Period Total Income
          </span>
          <div className="text-2xl font-bold tabular-nums currency-amount" style={{ color: palette.positive }}>
            +{formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-widest text-[#737373] dark:text-[#A3A3A3] block mb-1">
            Period Total Expenses
          </span>
          <div className="text-2xl font-bold tabular-nums currency-amount" style={{ color: palette.negative }}>
            -{formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: CHARTS (Bar Chart: Income vs Expense by Category + Donut Chart)
          ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] transition-colors shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-widest block mb-1">
              Visual Analytics
            </span>
            <h3 className="text-xl font-bold text-[#171717] dark:text-[#FAFAFA]">
              {activeChartTab === 'grouped_bar'
                ? 'Category Income vs Expense Comparison'
                : 'Expense Breakdown by Category'}
            </h3>
          </div>

          {/* Chart View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#F5F5F5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#404040] self-start sm:self-auto">
            <button
              onClick={() => setActiveChartTab('grouped_bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'grouped_bar'
                  ? 'bg-white dark:bg-[#171717] text-[#171717] dark:text-[#FAFAFA] shadow-xs'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Income vs Expense (Bars)</span>
            </button>
            <button
              onClick={() => setActiveChartTab('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'donut'
                  ? 'bg-white dark:bg-[#171717] text-[#171717] dark:text-[#FAFAFA] shadow-xs'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Expense Donut</span>
            </button>
          </div>
        </div>

        {/* 1. Grouped Bar Chart: Income vs Expense per Category */}
        {activeChartTab === 'grouped_bar' && (
          <div className="w-full">
            {categoryComparisonData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#737373] dark:text-[#A3A3A3]">
                No category transaction data available for this timeframe.
              </div>
            ) : (
              <div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryComparisonData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke={palette.textSecondary}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        stroke={palette.textSecondary}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val: number) => {
                          if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                          return `${val}`;
                        }}
                      />
                      <RechartsTooltip content={<GroupedBarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                      />
                      <Bar
                        dataKey="income"
                        name="Income"
                        fill={palette.positive}
                        maxBarSize={20}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Expense"
                        fill={palette.negative}
                        maxBarSize={20}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Donut Chart: Expenses by Category */}
        {activeChartTab === 'donut' && (
          <div className="w-full">
            {expenseDonutData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#737373] dark:text-[#A3A3A3]">
                No expense breakdown recorded for this timeframe.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 relative h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip content={<DonutTooltip />} />
                      <Pie
                        data={expenseDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        onClick={(entry: any) =>
                          setExpandedCategoryId(expandedCategoryId === entry?.categoryId ? null : entry?.categoryId)
                        }
                        cursor="pointer"
                      >
                        {expenseDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Summary */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider">
                      Total Spend
                    </span>
                    <span className="text-xl font-bold text-[#171717] dark:text-[#FAFAFA] tabular-nums font-display">
                      {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
                    </span>
                    {topExpenseCategory && (
                      <span className="text-[10px] font-medium text-[#737373] dark:text-[#A3A3A3] mt-0.5">
                        Top: {topExpenseCategory.name} ({topExpenseCategory.percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Donut Legend Grid */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expenseDonutData.map(item => (
                    <div
                      key={item.name}
                      onClick={() =>
                        setExpandedCategoryId(expandedCategoryId === item.categoryId ? null : item.categoryId)
                      }
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#404040] hover:border-[#2F6FED] dark:hover:border-[#C6FF3D] transition-colors cursor-pointer"
                    >
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] tabular-nums">
                          {formatCurrency(item.value, settings.baseCurrency, settings.privacyMode, false)} ({item.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: INTERACTIVE CALENDAR
          ========================================================================= */}
      <AnalyticsCalendar onSelectTransaction={handleTxSelect} />

      {/* =========================================================================
          SECTION 3: CATEGORY DRILLDOWN LIST
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#737373] dark:text-[#A3A3A3]">
            Itemized Category Outflows
          </h3>
          <span className="text-xs text-[#737373] dark:text-[#A3A3A3]">
            Tap any row to view inline transactions
          </span>
        </div>

        <div className="space-y-2">
          {categoryBreakdown.map((item: any) => {
            const isExpanded = expandedCategoryId === item.category.id;
            const categoryTxs = getTransactionsForCategory(item.category.id);

            return (
              <div
                key={item.category.id}
                className={`rounded-2xl bg-white dark:bg-[#171717] border transition-colors overflow-hidden shadow-xs ${
                  isExpanded
                    ? 'border-[#2F6FED] dark:border-[#C6FF3D] ring-1 ring-[#2F6FED]/20 dark:ring-[#C6FF3D]/20'
                    : 'border-[#E5E5E5] dark:border-[#404040] hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {/* Clickable Header Row */}
                <div
                  onClick={() => setExpandedCategoryId(isExpanded ? null : item.category.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#404040] text-[#171717] dark:text-[#FAFAFA] flex items-center justify-center shrink-0">
                      <CategoryIcon name={item.category.icon} className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA] truncate">
                          {item.category.name}
                        </span>
                        <span className="text-xs text-[#737373] dark:text-[#A3A3A3] tabular-nums">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>

                      {/* Progress Line */}
                      <div className="w-full h-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#262626] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.category.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amount & Trend & Chevron */}
                  <div className="text-right shrink-0 flex items-center space-x-3 ml-2">
                    <div>
                      <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] tabular-nums currency-amount">
                        {formatCurrency(item.total, settings.baseCurrency, settings.privacyMode)}
                      </div>
                      <div className="flex items-center justify-end space-x-0.5 text-[10px] font-bold mt-0.5 tabular-nums">
                        {item.trendPercentage > 0 ? (
                          <span className="flex items-center" style={{ color: palette.negative }}>
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +{item.trendPercentage.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="flex items-center" style={{ color: palette.positive }}>
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                            {item.trendPercentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight 
                      className={`w-4 h-4 text-[#737373] dark:text-[#A3A3A3] group-hover:text-[#171717] dark:group-hover:text-[#FAFAFA] transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-[#2F6FED] dark:!text-[#C6FF3D]' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Inline Accordion Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#E5E5E5] dark:border-[#404040] bg-[#FAFAFA] dark:bg-[#0A0A0A]/60 animate-fade-in">
                    <div className="flex items-center justify-between py-1.5 text-xs font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider">
                      <span>{item.category.name} Transactions</span>
                      <span className="font-mono text-[#737373] dark:text-[#A3A3A3]">{categoryTxs.length} items</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {categoryTxs.length === 0 ? (
                        <p className="text-xs text-[#737373] dark:text-[#A3A3A3] py-3 text-center">
                          No transactions recorded in this category.
                        </p>
                      ) : (
                        categoryTxs.map((tx: any) => (
                          <div
                            key={tx.id}
                            onClick={() => handleTxSelect(tx)}
                            className="p-3 rounded-xl bg-white dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#404040] hover:border-[#2F6FED] dark:hover:border-[#C6FF3D] flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-[#171717] dark:text-[#FAFAFA] truncate">
                                {tx.merchant || tx.categoryName}
                              </p>
                              <p className="text-[10px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
                                {tx.accountName} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <span
                              className="font-bold tabular-nums shrink-0 font-display"
                              style={{
                                color: tx.type === 'income' ? palette.positive : palette.negative,
                              }}
                            >
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />

    </div>
  );
};
