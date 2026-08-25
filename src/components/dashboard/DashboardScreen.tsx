import React, { useState } from 'react';
import { DashboardNavBar } from './DashboardNavBar';
import { IncomeExpenseCard } from './IncomeExpenseCard';
import { DonutChartCard } from './DonutChartCard';
import { AccountsCarousel } from './AccountsCarousel';
import { Transaction } from '../../types';
import { TransactionsList } from '../home/TransactionsList';
import { FloatingNav } from './FloatingNav';

export const DashboardScreen: React.FC = () => {
  const handleSelectTransaction = (tx: Transaction) => {
    console.log('Transaction selected', tx);
    // TODO: Implement transaction detail view
  };

  const handleOpenSeeAll = () => {
    console.log('Open see all transactions');
    // TODO: Navigate to full transactions page
  };
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={isDark ? 'dark' : ''}>
      <DashboardNavBar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8 bg-slate-900 dark:bg-slate-900 text-white">
        {/* Hero Section - Your Money */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IncomeExpenseCard type="income" amount="$12,340" />
          <IncomeExpenseCard type="expenses" amount="$8,560" />
        </section>

        {/* Middle Section - Donut Chart */}
        <section>
          <DonutChartCard />
        </section>

        {/* Accounts Section */}
        <AccountsCarousel />

        {/* Transactions List Header */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Transactions</h2>
          <TransactionsList onSelectTransaction={handleSelectTransaction} onOpenSeeAll={handleOpenSeeAll} />
        </section>
      </main>
      <FloatingNav />
    </div>
  );
};
