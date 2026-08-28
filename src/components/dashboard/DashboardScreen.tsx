import React, { useState } from 'react';
import { DashboardNavBar } from './DashboardNavBar';
import { IncomeExpenseCard } from './IncomeExpenseCard';
import { DonutChartCard } from './DonutChartCard';
import { AccountsCarousel } from './AccountsCarousel';
import { Transaction } from '../../types';
import { TransactionDetailModal } from '../home/TransactionDetailModal';
import { TransactionDrawer } from '../home/TransactionDrawer';
import { TransactionsList } from '../home/TransactionsList';
import { FloatingNav } from './FloatingNav';

export const DashboardScreen: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSeeAllDrawer, setShowSeeAllDrawer] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
      <DashboardNavBar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 pb-32">
        {/* Top Stats - Cash Flow */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IncomeExpenseCard type="income" amount="৳711,764.71" />
          <IncomeExpenseCard type="expenses" amount="৳275,481.18" />
        </section>

        {/* Spend Breakdown */}
        <section>
          <DonutChartCard />
        </section>

        {/* Accounts Section */}
        <AccountsCarousel />

        {/* Transactions List */}
        <section className="mt-8">
          <TransactionsList
            onSelectTransaction={tx => setSelectedTransaction(tx)}
            onOpenSeeAll={() => setShowSeeAllDrawer(true)}
          />
        </section>
      </main>
      <FloatingNav />

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
