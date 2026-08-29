import React, { useState } from 'react';
import { BalanceCard } from './BalanceCard';
import { YourMoneySection } from './YourMoneySection';
import { TotalSpendSummary } from './TotalSpendSummary';
import { ConnectedAccountsRow } from './ConnectedAccountsRow';
import { SpendBreakdownCard } from './SpendBreakdownCard';
import { ConnectedAccountsSection } from './ConnectedAccountsSection';
import { InsightBanner } from './InsightBanner';
import { TransactionsList } from './TransactionsList';
import { TransactionDetailModal } from './TransactionDetailModal';
import { TransactionDrawer } from './TransactionDrawer';
import { Transaction, Account } from '../../types';

interface HomeScreenProps {
  onNavigateToReport: () => void;
  onOpenTransfer: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToReport,
  onOpenTransfer,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSeeAllDrawer, setShowSeeAllDrawer] = useState(false);
  const [activeAccountFilter, setActiveAccountFilter] = useState<Account | null>(null);

  return (
    <div className="animate-fade-in pb-4">
      
      {/* =========================================================================
          1. MOBILE COMPOSITION (below `md` breakpoint)
          Structure is 100% pixel-identical to mobile layout
          ========================================================================= */}
      <div className="md:hidden space-y-6">
        {/* Mobile Hero Balance Card */}
        <BalanceCard
          onSelectAccount={setActiveAccountFilter}
          onOpenTransfer={onOpenTransfer}
        />

        {/* Inflow / Outflow Cash Flow Cards */}
        <YourMoneySection onNavigateToReport={onNavigateToReport} />

        {/* Total Spend Chart Overview Card */}
        <TotalSpendSummary onNavigateToReport={onNavigateToReport} />

        {/* Connected Accounts Strip */}
        <ConnectedAccountsRow
          onSelectAccount={setActiveAccountFilter}
          onOpenTransfer={onOpenTransfer}
        />

        {/* Transactions List */}
        <TransactionsList
          onSelectTransaction={tx => setSelectedTransaction(tx)}
          onOpenSeeAll={() => setShowSeeAllDrawer(true)}
        />
      </div>

      {/* =========================================================================
          2. DESKTOP COMPOSITION (`md:` and up only)
          Custom desktop-only dashboard hierarchy
          ========================================================================= */}
      <div className="hidden md:block space-y-8">
        {/* 1. "Your Money" Heading, subtitle, "Details →" and two side-by-side cards */}
        <YourMoneySection onNavigateToReport={onNavigateToReport} />

        {/* 2. Compact Spend Breakdown with Donut/Bar toggle & legend */}
        <SpendBreakdownCard onNavigateToReport={onNavigateToReport} />

        {/* 3. Connected Accounts Standalone Grid */}
        <ConnectedAccountsSection
          onSelectAccount={setActiveAccountFilter}
          onOpenTransfer={onOpenTransfer}
        />

        {/* 4. Financial Intelligence Insight Card */}
        <InsightBanner onActionClick={onNavigateToReport} />

        {/* 5. Transactions List */}
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
