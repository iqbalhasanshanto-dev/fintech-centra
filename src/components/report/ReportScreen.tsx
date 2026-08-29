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
  Cell 
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../ui/CategoryIcon';
import { TransactionDetailModal } from '../home/TransactionDetailModal';
import { formatCurrency } from '../../utils/formatters';
import { Transaction, PeriodFilter } from '../../types';

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
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const activeBreakdown = datasetType === 'expense' ? categoryBreakdown : incomeBreakdown;
  const currentTotal = datasetType === 'expense' ? periodExpenses : periodIncome;

  // Prepare chart data for Recharts
  const chartData = useMemo(() => {
    return activeBreakdown.map((item: any) => ({
      name: item.category.name,
      value: item.total,
      color: item.category.color,
      percent: item.percentage,
      count: item.transactionCount,
      categoryId: item.category.id,
    }));
  }, [activeBreakdown]);

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
  ];

  const getTransactionsForCategory = (catId: string) => {
    return transactions.filter((t: any) => t.categoryId === catId);
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] px-3.5 py-2 rounded-xl shadow-2xl text-left pointer-events-none z-50 animate-fade-in">
          <p className="text-xs font-bold text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium tabular-nums">
            Amount : {formatCurrency(data.value, settings.baseCurrency, settings.privacyMode)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      {/* Header with back button & period switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 -ml-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics &amp; Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Interactive visualization and category cash outflows
            </p>
          </div>
        </div>

        {/* Period Selector Dropdown */}
        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none cursor-pointer shadow-xs"
        >
          {periods.map(p => (
            <option key={p.id} value={p.id} className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dataset Toggle (Expenses vs Income) */}
      <div className="p-1 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] flex items-center">
        <button
          onClick={() => {
            setDatasetType('expense');
            setExpandedCategoryId(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors tabular-nums cursor-pointer ${
            datasetType === 'expense'
              ? 'bg-white dark:bg-[#121A2C] text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Expenses ({formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode, false)})
        </button>
        <button
          onClick={() => {
            setDatasetType('income');
            setExpandedCategoryId(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors tabular-nums cursor-pointer ${
            datasetType === 'income'
              ? 'bg-white dark:bg-[#121A2C] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Income ({formatCurrency(periodIncome, settings.baseCurrency, settings.privacyMode, false)})
        </button>
      </div>

      {/* Chart Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] transition-colors shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Total {datasetType === 'expense' ? 'Spend' : 'Income'}
            </span>
            <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums currency-amount mt-0.5">
              {formatCurrency(currentTotal, settings.baseCurrency, settings.privacyMode)}
            </div>
          </div>

          {/* Chart Type Toggle Button */}
          <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45]">
            <button
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Donut Chart"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-[#121A2C] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Chart Rendering */}
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400">
            No {datasetType} data recorded for this period.
          </div>
        ) : (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'donut' ? (
                <PieChart>
                  <RechartsTooltip content={<CustomChartTooltip />} isAnimationActive={false} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive={false}
                    onClick={(entry: any) => setExpandedCategoryId(expandedCategoryId === entry?.categoryId ? null : entry?.categoryId)}
                    cursor="pointer"
                    stroke="none"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }} barCategoryGap="16%">
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `৳${val}`}
                  />
                  <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} isAnimationActive={false} />
                  <Bar 
                    dataKey="value" 
                    maxBarSize={28}
                    radius={[4, 4, 0, 0]} 
                    isAnimationActive={false}
                    onClick={(entry: any) => setExpandedCategoryId(expandedCategoryId === entry?.categoryId ? null : entry?.categoryId)}
                    cursor="pointer"
                  >
                    {chartData.map((entry: any, index: number) => (
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
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Category Breakdown
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Tap a row to view inline transactions
          </span>
        </div>

        <div className="space-y-2">
          {activeBreakdown.map((item: any) => {
            const isExpanded = expandedCategoryId === item.category.id;
            const categoryTxs = getTransactionsForCategory(item.category.id);

            return (
              <div
                key={item.category.id}
                className={`rounded-2xl bg-white dark:bg-[#121A2C] border transition-colors overflow-hidden shadow-xs ${
                  isExpanded
                    ? 'border-brand-500 ring-1 ring-brand-500/20'
                    : 'border-gray-200 dark:border-[#232C45] hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {/* Clickable Header Row */}
                <div
                  onClick={() => setExpandedCategoryId(isExpanded ? null : item.category.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none group"
                >
                  {/* Left: Icon & Name & % Bar */}
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

                  {/* Right: Amount & Trend & Chevron */}
                  <div className="text-right shrink-0 flex items-center space-x-3 ml-2">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums currency-amount">
                        {formatCurrency(item.total, settings.baseCurrency, settings.privacyMode)}
                      </div>
                      <div className="flex items-center justify-end space-x-0.5 text-[10px] font-bold mt-0.5 tabular-nums">
                        {item.trendPercentage > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +{item.trendPercentage.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                            {item.trendPercentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight 
                      className={`w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-brand-600 dark:text-brand-400' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* INLINE ACCORDION DRAWER */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#232C45] bg-gray-50/70 dark:bg-[#0A0E1A]/40 animate-fade-in">
                    <div className="flex items-center justify-between py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>{item.category.name} Transactions</span>
                      <span className="font-mono text-gray-400 dark:text-gray-500">{categoryTxs.length} items</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {categoryTxs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">
                          No transactions recorded in this category.
                        </p>
                      ) : (
                        categoryTxs.map((tx: any) => (
                          <div
                            key={tx.id}
                            onClick={() => {
                              if (onSelectTransaction) onSelectTransaction(tx);
                              setSelectedTx(tx);
                            }}
                            className="p-3 rounded-xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] hover:border-brand-500/40 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {tx.merchant || tx.categoryName}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {tx.accountName} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <span className="font-bold tabular-nums text-gray-900 dark:text-white shrink-0 font-display">
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

      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />

    </div>
  );
};
