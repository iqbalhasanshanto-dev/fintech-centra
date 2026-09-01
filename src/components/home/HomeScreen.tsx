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
  onOpenAddTransaction?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToReport,
  onOpenAddTransaction,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSeeAllDrawer, setShowSeeAllDrawer] = useState(false);

  return (
    <div className="animate-fade-in pb-4 w-full">
      
      {/* =========================================================================
          1. MOBILE COMPOSITION (below `lg` breakpoint)
          - Solid opaque background on container level to prevent card bleed
          ========================================================================= */}
      <div className="lg:hidden space-y-6 w-full bg-[#FAFAFA] dark:bg-[#0A0E1A]">
        {/* Inflow / Outflow Cash Flow Cards */}
        <YourMoneySection
          onNavigateToReport={onNavigateToReport}
          onOpenAddTransaction={onOpenAddTransaction}
        />

        {/* Income vs Expense Over Time Line Chart */}
        <IncomeExpenseLineChart />

        {/* Transactions List */}
        <TransactionsList
          onSelectTransaction={tx => setSelectedTransaction(tx)}
          onOpenSeeAll={() => setShowSeeAllDrawer(true)}
        />
      </div>

      {/* =========================================================================
          2. DESKTOP COMPOSITION (`lg:` and up)
          - Wide responsive layout filling the area to the right of the sidebar
          ========================================================================= */}
      <div className="hidden lg:block space-y-8 w-full">
        {/* 1. "Your Money" Heading, "+ New transaction" button, and two side-by-side cards */}
        <YourMoneySection
          onNavigateToReport={onNavigateToReport}
          onOpenAddTransaction={onOpenAddTransaction}
        />

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
