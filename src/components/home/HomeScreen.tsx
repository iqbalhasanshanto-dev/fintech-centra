import React, { useState } from 'react';
import { YourMoneySection } from './YourMoneySection';
import { IncomeExpenseLineChart } from './IncomeExpenseLineChart';
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
    <div className="animate-fade-in pb-2 w-full space-y-6">
      {/* Side-by-side on desktop (lg:grid lg:grid-cols-12 lg:gap-5 lg:items-stretch), stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-stretch w-full">
        {/* Left column: Account Information card */}
        <div className="lg:col-span-5 flex flex-col">
          <YourMoneySection
            onNavigateToReport={onNavigateToReport}
            onOpenAddTransaction={onOpenAddTransaction}
          />
        </div>

        {/* Right column: Cash Flow Trend card */}
        <div className="lg:col-span-7 flex flex-col">
          <IncomeExpenseLineChart />
        </div>
      </div>

      {/* Directly below: Full-width Recent Activity */}
      <TransactionsList
        onSelectTransaction={tx => setSelectedTransaction(tx)}
        onOpenSeeAll={() => setShowSeeAllDrawer(true)}
      />

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
          setSelectedTransaction(tx);
        }}
      />
    </div>
  );
};
