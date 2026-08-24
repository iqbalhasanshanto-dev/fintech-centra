import React, { useState } from 'react';
import { Header } from './Header';
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
    <div className="min-h-screen w-full bg-[#E5E4EC] dark:bg-[#0b0d14] flex items-center justify-center p-0 sm:py-6 sm:px-4">
      {/* Mobile-First Frame Container (max-w-md, rounded frame on desktop, full screen on mobile) */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[844px] sm:max-h-[920px] bg-[#F3F2F7] dark:bg-[#0b0d14] text-[#15141F] dark:text-[#f8fafc] sm:rounded-4xl shadow-2xl sm:border sm:border-gray-200/60 dark:sm:border-[#1e2638] flex flex-col relative overflow-hidden transition-colors">
        
        {/* Persistent Top Header */}
        <Header
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onNavigateToSettings={() => setActiveTab('settings')}
        />

        {/* Scrollable Screen Content Area */}
        <main className="flex-1 overflow-y-auto px-5 pt-4 overscroll-contain">
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

        {/* Persistent Bottom Nav with floating centered '+' action */}
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
    </div>
  );
};
