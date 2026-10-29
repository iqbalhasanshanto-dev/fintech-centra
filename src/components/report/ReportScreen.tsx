import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { TransactionDetailModal } from '../home/TransactionDetailModal';
import { AnalyticsCalendar } from './AnalyticsCalendar';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';

interface ReportScreenProps {
  onSelectTransaction?: (tx: Transaction) => void;
}

const FIGMA_LIME_PALETTE_DARK = ['#C6FF3D', '#84CC16', '#65A30D', '#3F6212', '#4D6E18', '#A3E635'];
const FIGMA_LIME_PALETTE_LIGHT = ['#4D6E18', '#84CC16', '#65A30D', '#365314', '#15803D', '#65A30D'];

export const ReportScreen: React.FC<ReportScreenProps> = ({
  onSelectTransaction,
}) => {
  const {
    categoryBreakdown,
    periodExpenses,
    settings,
  } = useFinance();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Donut Chart Data: Expenses by Category with Figma lime/olive palette
  const expenseDonutData = useMemo(() => {
    const limePalette = isDark ? FIGMA_LIME_PALETTE_DARK : FIGMA_LIME_PALETTE_LIGHT;
    return categoryBreakdown.map((item, idx) => ({
      name: item.category.name,
      value: Math.round(item.total * 100) / 100,
      color: limePalette[idx % limePalette.length],
      percentage: item.percentage,
      count: item.transactionCount,
      categoryId: item.category.id,
    }));
  }, [categoryBreakdown, isDark]);

  const handleTxSelect = (tx: Transaction) => {
    if (onSelectTransaction) onSelectTransaction(tx);
    setSelectedTx(tx);
  };

  const currentMonthYearLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-36 sm:pb-40 lg:pb-12">
      
      {/* Header (Figma 12-analytics--full.png) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analysis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Category breakdown &amp; daily spending calendar
          </p>
        </div>
      </div>

      {/* =========================================================================
          CARD 1: Expenses by category (12-analytics--full.png)
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.12] transition-colors shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#18212F] dark:text-white">
            Expenses by category
          </h3>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {currentMonthYearLabel}
          </span>
        </div>

        {expenseDonutData.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.12] bg-[#F1F2F4]/50 dark:bg-[#262626]/40 text-center my-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No expense breakdown recorded</p>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
              Record your expenses to visualize itemized category analytics.
            </p>
          </div>
        ) : (
          <div>
            {/* Centered Donut Chart with Total expenses inside hole */}
            <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
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
                    cursor="pointer"
                  >
                    {expenseDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total expenses
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#18212F] dark:text-white tabular-nums mt-0.5">
                    {formatCurrency(periodExpenses, settings.baseCurrency, settings.privacyMode)}
                  </span>
                </div>
              </div>
            </div>

            {/* Clean vertical list of categories (12-analytics--full.png) */}
            <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
              {expenseDonutData.map(item => (
                <div
                  key={item.categoryId}
                  className="flex items-center justify-between py-1 select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-semibold text-[#18212F] dark:text-white truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums">
                      {item.percentage.toFixed(0)}%
                    </span>
                    <span className="text-sm font-bold tabular-nums text-[#18212F] dark:text-white min-w-[70px] text-right">
                      {formatCurrency(item.value, settings.baseCurrency, settings.privacyMode)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CARD 2: Spending calendar & CARD 3: Selected date Breakdown (AnalyticsCalendar)
          ========================================================================= */}
      <AnalyticsCalendar onSelectTransaction={handleTxSelect} />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />

    </div>
  );
};
