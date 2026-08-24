import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav, TabType } from './BottomNav';
import { HomeScreen } from '../home/HomeScreen';
import { ReportScreen } from '../report/ReportScreen';
import { PlanScreen } from '../plan/PlanScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AddActionModal } from '../modals/AddActionModal';
import { NotificationsModal } from '../modals/NotificationsModal';
import { ProModal } from '../modals/ProModal';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'transaction' | 'transfer' | 'goal' | 'budget'>('transaction');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const handleOpenAddWithTab = (tab: 'transaction' | 'transfer' | 'goal' | 'budget') => {
    setAddModalDefaultTab(tab);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#F3F2F7] dark:bg-[#0b0d14] text-[#15141F] dark:text-[#f8fafc] flex flex-col md:flex-row transition-colors">
      
      {/* Desktop Left Sidebar (hidden below md) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddAction={() => handleOpenAddWithTab('transaction')}
      />

      {/* Main Content Area (Full width on mobile, flexible remaining width on desktop) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen md:h-screen md:overflow-y-auto overscroll-contain">
        
        {/* Persistent Top Header */}
        <Header
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onNavigateToSettings={() => setActiveTab('settings')}
        />

        {/* Screen Content Container (Centered with max-readable width on desktop) */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-12 max-w-5xl mx-auto w-full">
          {activeTab === 'home' && (
            <HomeScreen
              onNavigateToReport={() => setActiveTab('report')}
              onOpenProModal={() => setShowProModal(true)}
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
      </div>

      {/* Mobile Bottom Dock (hidden on md+ screens) */}
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

      {/* Centra Pro Paywall / Upgrade Modal */}
      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
      />

    </div>
  );
};
