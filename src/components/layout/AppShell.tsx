import React, { useState } from 'react';
import { Header } from './Header';
import { BottomNav, TabType } from './BottomNav';
import { HomeScreen } from '../home/HomeScreen';
import { ReportScreen } from '../report/ReportScreen';
import { PlanScreen } from '../plan/PlanScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AddActionModal } from '../modals/AddActionModal';
import { NotificationsModal } from '../modals/NotificationsModal';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'transaction' | 'transfer' | 'goal' | 'budget'>('transaction');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const handleOpenAddWithTab = (tab: 'transaction' | 'transfer' | 'goal' | 'budget') => {
    setAddModalDefaultTab(tab);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#FFFFFF] flex flex-col transition-colors duration-300">
      
      {/* Persistent Slim Top Header */}
      <Header
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onNavigateToSettings={() => setActiveTab('settings')}
      />

      {/* Main Screen Content Container (Centered with max-width, pb-32 safe padding for bottom dock) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-5 pb-32">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigateToReport={() => setActiveTab('report')}
            onOpenTransfer={() => handleOpenAddWithTab('transfer')}
          />
        )}

        {activeTab === 'report' && (
          <ReportScreen
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'plan' && (
          <PlanScreen
            onBackToHome={() => setActiveTab('home')}
            onOpenAddGoal={() => handleOpenAddWithTab('goal')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen />
        )}
      </main>

      {/* Unified Floating Bottom Dock (Active on both Web and Mobile) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddAction={() => handleOpenAddWithTab('transaction')}
      />

      {/* Quick Action Sheet Modal */}
      <AddActionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultTab={addModalDefaultTab}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

    </div>
  );
};
