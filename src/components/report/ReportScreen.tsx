import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  CreditCard,
  ShoppingBag
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
  Cell 
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Transaction, PeriodFilter, Category } from '../../types';

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
    incomeBreakdown,
    periodIncome,
    periodExpenses,
    periodFilter,
    setPeriodFilter,
    settings,
    transactions,
  } = useFinance();

  const [datasetType, setDatasetType] = useState<'expense' | 'income'>('expense');
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [selectedCategoryDrilldown, setSelectedCategoryDrilldown] = useState<Category | null>(null);

  const activeBreakdown = datasetType === 'expense' ? categoryBreakdown : incomeBreakdown;
  const currentTotal = datasetType === 'expense' ? periodExpenses : periodIncome;

  // Prepare chart data for Recharts
  const chartData = useMemo(() => {
    return activeBreakdown.map(item => ({
      name: item.category.name,
      value: item.total,
      color: item.category.color,
      percent: item.percentage,
      count: item.transactionCount,
    }));
  }, [activeBreakdown]);

  // Drilldown transactions for selected category
  const drilldownTransactions = useMemo(() => {
    if (!selectedCategoryDrilldown) return [];
    return transactions.filter(t => t.categoryId === selectedCategoryDrilldown.id);
  }, [selectedCategoryDrilldown, transactions]);

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
  ];

  // Custom Chart Tooltip component with dark rounded design
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#131722] border border-[#1e2638] px-3.5 py-2 rounded-xl shadow-xl text-left pointer-events-none z-50 animate-fade-in">
          <p className="text-xs font-bold text-[#f8fafc]">{data.name}</p>
          <p className="text-[11px] text-gray-300 mt-0.5 font-medium">
            Amount : {formatCurrency(data.value, settings.baseCurrency, settings.privacyMode)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      
      {/* Header with back button & period switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:text-ink dark:hover:text-[#f8fafc] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold font-display text-ink dark:text-[#f8fafc]">
              Financial Report
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#64748b]">
              Breakdown & visual spend analytics
            </p>
          </div>
        </div>

        {/* Period Selector Dropdown */}
        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] shadow-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          {periods.map(p => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dataset Toggle (Expenses vs Income) */}
      <div className="p-1 rounded-2xl bg-gray-200/80 dark:bg-[#1e2638]/60 flex items-center">
        <button
          onClick={() => setDatasetType('expense')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            datasetType === 'expense'
              ? 'bg-white dark:bg-[#131722] text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-gray-500 dark:text-[#64748b] hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Expenses ({formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode, false)})
        </button>
        <button
          onClick={() => setDatasetType('income')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            datasetType === 'income'
              ? 'bg-white dark:bg-[#131722] text-growth shadow-sm'
              : 'text-gray-500 dark:text-[#64748b] hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Income ({formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode, false)})
        </button>
      </div>

      {/* Chart Card with Chart-Type Toggle */}
      <div className="p-5 rounded-4xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-gray-400 dark:text-[#64748b] uppercase tracking-wider">
              Total {datasetType === 'expense' ? 'Spend' : 'Income'}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-ink dark:text-[#f8fafc] currency-amount mt-0.5">
              {formatCurrency(currentTotal, settings.baseCurrency, settings.privacyMode)}
            </div>
          </div>

          {/* Chart Type Toggle Button */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#1e2638]/70">
            <button
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-[#131722] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Donut Chart"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-[#131722] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Chart Rendering */}
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400 dark:text-[#64748b]">
            No {datasetType} data recorded for this period.
          </div>
        ) : (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'donut' ? (
                <PieChart>
                  <RechartsTooltip
                    content={<CustomChartTooltip />}
                    isAnimationActive={false}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
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
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `$${val}`}
                  />
                  <RechartsTooltip
                    content={<CustomChartTooltip />}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)', radius: 8 }}
                    isAnimationActive={false}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold font-display text-ink dark:text-[#f8fafc]">
            Category Breakdown
          </h3>
          <span className="text-xs text-gray-400 dark:text-[#64748b]">
            Tap to drill down
          </span>
        </div>

        <div className="space-y-2.5">
          {activeBreakdown.map(item => (
            <div
              key={item.category.id}
              onClick={() => setSelectedCategoryDrilldown(item.category)}
              className="p-4 rounded-3xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
            >
              {/* Left: Icon & Name & % Bar */}
              <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                  style={{
                    backgroundColor: `${item.category.color}20`,
                    color: item.category.color,
                  }}
                >
                  <CategoryIcon name={item.category.icon} className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-ink dark:text-[#f8fafc] truncate">
                      {item.category.name}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-[#64748b] font-display">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#1e2638] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Amount & Trend */}
              <div className="text-right shrink-0 flex items-center space-x-2">
                <div>
                  <div className="text-sm font-extrabold font-display text-ink dark:text-[#f8fafc] currency-amount">
                    {formatCurrency(item.total, settings.baseCurrency, settings.privacyMode)}
                  </div>
                  <div className="flex items-center justify-end space-x-0.5 text-[11px] font-bold mt-0.5">
                    {item.trendPercentage > 0 ? (
                      <span className="text-rose-500 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        +{item.trendPercentage.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-growth flex items-center">
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                        {item.trendPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Drilldown Modal */}
      <Modal
        isOpen={!!selectedCategoryDrilldown}
        onClose={() => setSelectedCategoryDrilldown(null)}
        title={selectedCategoryDrilldown?.name}
        subtitle={`${drilldownTransactions.length} transactions recorded`}
      >
        <div className="space-y-3">
          <div className="divide-y divide-gray-100 dark:divide-[#1e2638] max-h-[50vh] overflow-y-auto">
            {drilldownTransactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 dark:text-[#64748b]">
                No transactions for this category.
              </div>
            ) : (
              drilldownTransactions.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => {
                    if (onSelectTransaction) onSelectTransaction(tx);
                  }}
                  className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2638]/40 rounded-xl px-2 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-ink dark:text-[#f8fafc]">
                      {tx.merchant || tx.categoryName}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-[#64748b]">
                      {tx.accountName} • {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold font-display text-ink dark:text-[#f8fafc]">
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency, settings.privacyMode)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};
