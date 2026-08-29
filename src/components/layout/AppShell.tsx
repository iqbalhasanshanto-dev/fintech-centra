import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Header } from './Header';
import { BottomNav, TabType } from './BottomNav';
import { DesktopDock } from './DesktopDock';
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
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-gray-100 flex flex-col antialiased transition-colors duration-200">
      
      {/* Persistent Slim Top Header with Desktop Quick Add + */}
      <Header
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onNavigateToSettings={() => setActiveTab('settings')}
        onOpenAddAction={() => handleOpenAddWithTab('transaction')}
      />

      {/* Main Screen Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 pb-32">
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

      {/* Centra Footer */}
      <footer id="footer" className="max-w-7xl mx-auto w-full px-6 py-10 border-t border-gray-200 dark:border-[#232C45] flex flex-col md:flex-row items-center justify-between gap-6 mb-20 transition-colors">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <div className="w-6 h-6 bg-gray-200 dark:bg-[#121A2C] border border-gray-300 dark:border-[#232C45] rounded flex items-center justify-center">
            <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase">Centra Secure Systems</span>
        </div>
        <div className="flex items-center gap-8 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          <button onClick={() => setActiveTab('settings')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
          <button onClick={() => setActiveTab('settings')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Support</button>
          <button onClick={() => setActiveTab('settings')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">API Docs</button>
        </div>
      </footer>

      {/* Mobile Floating Bottom Dock (below md) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddAction={() => handleOpenAddWithTab('transaction')}
      />

      {/* Desktop Floating Pill Dock (md: and up) */}
      <DesktopDock
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
