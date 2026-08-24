import React, { useState } from 'react';
import { BalanceCard } from './BalanceCard';
import { YourMoneySection } from './YourMoneySection';
import { InsightBanner } from './InsightBanner';
import { TransactionsList } from './TransactionsList';
import { TransactionDetailModal } from './TransactionDetailModal';
import { TransactionDrawer } from './TransactionDrawer';
import { Transaction, Account } from '../../types';

interface HomeScreenProps {
  onNavigateToReport: () => void;
  onOpenProModal: () => void;
  onOpenTransfer: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToReport,
  onOpenProModal,
  onOpenTransfer,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSeeAllDrawer, setShowSeeAllDrawer] = useState(false);
  const [activeAccountFilter, setActiveAccountFilter] = useState<Account | null>(null);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 1. Live Balance Card with period-over-period delta */}
      <BalanceCard
        onSelectAccount={setActiveAccountFilter}
        onOpenTransfer={onOpenTransfer}
      />

      {/* 2. "Your Money" Income / Expenses Summary */}
      <YourMoneySection onNavigateToReport={onNavigateToReport} />

      {/* 3. Dynamic Smart AI Insight Banner with "Get Pro" upsell */}
      <InsightBanner onOpenProModal={onOpenProModal} />

      {/* 4. Transactions List with Date Grouping & Pinning */}
      <TransactionsList
        onSelectTransaction={tx => setSelectedTransaction(tx)}
        onOpenSeeAll={() => setShowSeeAllDrawer(true)}
      />

      {/* Transaction Detail & Edit Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      {/* Full "See all" Search & Filter Drawer */}
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
