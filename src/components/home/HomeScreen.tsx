import React, { useState } from 'react';
import { YourMoneySection } from './YourMoneySection';
import { TotalSpendSummary } from './TotalSpendSummary';
import { ConnectedAccountsRow } from './ConnectedAccountsRow';
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
    <div className="space-y-6 animate-fade-in pb-4">
      {/* 1. "Your Money" Cash-Flow Inflow/Outflow Cards */}
      <YourMoneySection onNavigateToReport={onNavigateToReport} />

      {/* 2. Total Spend Chart Overview Card */}
      <TotalSpendSummary onNavigateToReport={onNavigateToReport} />

      {/* 3. Connected Accounts Strip */}
      <ConnectedAccountsRow
        onSelectAccount={setActiveAccountFilter}
        onOpenTransfer={onOpenTransfer}
      />

      {/* 5. Transactions List with Date Grouping & Filtering */}
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
