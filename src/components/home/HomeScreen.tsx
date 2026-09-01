import React, { useState } from 'react';
import { YourMoneySection } from './YourMoneySection';
import { IncomeExpenseLineChart } from './IncomeExpenseLineChart';
import { InsightBanner } from './InsightBanner';
import { TransactionsList } from './TransactionsList';
import { TransactionDetailModal } from './TransactionDetailModal';
import { TransactionDrawer } from './TransactionDrawer';
import { Transaction } from '../../types';

interface HomeScreenProps {
  onNavigateToReport: () => void;
  onOpenTransfer: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToReport,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSeeAllDrawer, setShowSeeAllDrawer] = useState(false);

  return (
    <div className="animate-fade-in pb-4">
      
      {/* =========================================================================
          1. MOBILE COMPOSITION (below `md` breakpoint)
          ========================================================================= */}
      <div className="md:hidden space-y-6">
        {/* Inflow / Outflow Cash Flow Cards */}
        <YourMoneySection onNavigateToReport={onNavigateToReport} />

        {/* Income vs Expense Over Time Line Chart */}
        <IncomeExpenseLineChart />

        {/* Transactions List */}
        <TransactionsList
          onSelectTransaction={tx => setSelectedTransaction(tx)}
          onOpenSeeAll={() => setShowSeeAllDrawer(true)}
        />
      </div>

      {/* =========================================================================
          2. DESKTOP COMPOSITION (`md:` and up only)
          ========================================================================= */}
      <div className="hidden md:block space-y-8">
        {/* 1. "Your Money" Heading, subtitle, "Details →" and two side-by-side cards */}
        <YourMoneySection onNavigateToReport={onNavigateToReport} />

        {/* 2. Income vs Expense Over Time Line Chart */}
        <IncomeExpenseLineChart />

        {/* 3. Financial Intelligence Insight Card */}
        <InsightBanner onActionClick={onNavigateToReport} />

        {/* 4. Transactions List */}
        <TransactionsList
          onSelectTransaction={tx => setSelectedTransaction(tx)}
          onOpenSeeAll={() => setShowSeeAllDrawer(true)}
        />
      </div>

      {/* Shared Modals & Drawers */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <TransactionDrawer
        isOpen={showSeeAllDrawer}
        onClose={() => setShowSeeAllDrawer(false)}
        onSelectTransaction={tx => {
          setShowSeeAllDrawer(false);
          setSelectedTransaction(tx);
        }}
      />
    </div>
  );
};
