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
import { Button } from '../ui/Button';
import { TransactionDetailModal } from '../home/TransactionDetailModal';
import { AnalyticsCalendar } from './AnalyticsCalendar';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';
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

  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'grouped_bar'>('donut');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<{
    name: string;
    value: number;
    color: string;
    percentage: number;
    count: number;
    categoryId: string;
  } | null>(null);

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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
              icon={<ArrowLeft className="w-4 h-4" />}
              aria-label="Back to Dashboard"
            >
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics &amp; Breakdown
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Category income vs. expense comparison, expense distribution &amp; daily calendar
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
            Period total income
          </span>
          <div className="text-2xl font-bold tabular-nums currency-amount" style={{ color: palette.positive }}>
            +{formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
            Period total expenses
          </span>
          <div className="text-2xl font-bold tabular-nums currency-amount" style={{ color: palette.negative }}>
            -{formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: CHARTS (Bar Chart: Income vs Expense by Category + Donut Chart)
          ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] transition-colors shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Visual analytics
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeChartTab === 'donut'
                ? 'Expense Breakdown by Category'
                : 'Category Income vs Expense Comparison'}
            </h3>
          </div>

          {/* Chart View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] self-start sm:self-auto">
            <button
              onClick={() => setActiveChartTab('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'donut'
                  ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Expense Donut</span>
            </button>
            <button
              onClick={() => setActiveChartTab('grouped_bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'grouped_bar'
                  ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Income vs Expense (Bars)</span>
            </button>
          </div>
        </div>

        {/* 1. Grouped Bar Chart: Income vs Expense per Category */}
        {activeChartTab === 'grouped_bar' && (
          <div className="w-full">
            {categoryComparisonData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
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
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
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
                      <RechartsTooltip content={<GroupedBarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', paddingBottom: '8px', top: -5 }}
                      />
                      <Bar
                        dataKey="income"
                        name="Income"
                        fill={palette.positive}
                        maxBarSize={22}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Expense"
                        fill={palette.negative}
                        maxBarSize={22}
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
              <div className="h-72 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                No expense breakdown recorded for this timeframe.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 relative h-72 sm:h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={78}
                        outerRadius={112}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        onMouseEnter={(_, index) => {
                          setHoveredSlice(expenseDonutData[index] || null);
                        }}
                        onMouseLeave={() => {
                          setHoveredSlice(null);
                        }}
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

                  {/* Clean Non-overlapping Dynamic Centered Summary contained strictly within inner circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                    <div className="w-[130px] max-w-[130px] flex flex-col items-center justify-center text-center px-1">
                      {hoveredSlice ? (
                        <div className="animate-fade-in flex flex-col items-center w-full">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider line-clamp-1 truncate w-full text-center">
                            {hoveredSlice.name}
                          </span>
                          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums font-display leading-tight my-0.5 truncate w-full text-center">
                            {formatCurrency(hoveredSlice.value, settings.baseCurrency, settings.privacyMode)}
                          </span>
                          <span
                            className="text-[11px] font-bold tabular-nums leading-tight"
                            style={{ color: hoveredSlice.color }}
                          >
                            {hoveredSlice.percentage.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <div className="animate-fade-in flex flex-col items-center w-full">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total spend
                          </span>
                          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums font-display leading-tight my-0.5 truncate w-full text-center">
                            {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
                          </span>
                          {topExpenseCategory && (
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-tight line-clamp-1 truncate w-full text-center">
                              Top: {topExpenseCategory.name} ({topExpenseCategory.percentage.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Donut Legend Grid */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expenseDonutData.map(item => {
                    const isHovered = hoveredSlice?.categoryId === item.categoryId;
                    return (
                      <div
                        key={item.name}
                        onMouseEnter={() => setHoveredSlice(item)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() =>
                          setExpandedCategoryId(expandedCategoryId === item.categoryId ? null : item.categoryId)
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#0A0E1A] border transition-all cursor-pointer ${
                          isHovered
                            ? 'border-brand-500 shadow-xs scale-[1.02]'
                            : 'border-gray-200 dark:border-[#232C45] hover:border-brand-500'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                            {formatCurrency(item.value, settings.baseCurrency, settings.privacyMode, false)} ({item.percentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-2">
            <span>Itemized Category Outflows</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full font-mono">
              {categoryBreakdown.length}
            </span>
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
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
                className={`rounded-2xl bg-white dark:bg-[#121A2C] border transition-colors overflow-hidden shadow-xs ${
                  isExpanded
                    ? 'border-brand-500 ring-1 ring-brand-500/20'
                    : 'border-gray-200 dark:border-[#232C45] hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {/* Clickable Header Row */}
                <div
                  onClick={() => setExpandedCategoryId(isExpanded ? null : item.category.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200/80 dark:border-[#232C45] text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
                      <CategoryIcon name={item.category.icon} className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {item.category.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>

                      {/* Progress Line */}
                      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-[#0A0E1A] overflow-hidden">
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
                      <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
                        {formatCurrency(item.total, settings.baseCurrency, settings.privacyMode)}
                      </div>
                      <div className="flex items-center justify-end space-x-0.5 text-xs font-bold mt-0.5 tabular-nums">
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
                      className={`w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-brand-600 dark:!text-[#C6FF3D]' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Inline Accordion Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-[#232C45] bg-gray-50/50 dark:bg-[#0A0E1A]/60 animate-fade-in">
                    <div className="flex items-center justify-between py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <span>{item.category.name} Transactions</span>
                      <span className="font-mono text-gray-500 dark:text-gray-400">{categoryTxs.length} items</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {categoryTxs.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">
                          No transactions recorded in this category.
                        </p>
                      ) : (
                        categoryTxs.map((tx: any) => (
                          <div
                            key={tx.id}
                            onClick={() => handleTxSelect(tx)}
                            className="p-3 rounded-xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] hover:border-brand-500 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {tx.merchant || tx.categoryName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {tx.accountName} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <span
                              className="font-bold tabular-nums shrink-0 font-display text-xs"
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
