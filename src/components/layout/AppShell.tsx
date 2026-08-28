import React, { useState } from 'react';
import { Shield } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-[#0A0A0A] text-gray-100 flex flex-col antialiased">
      
      {/* Persistent Slim Top Header */}
      <Header
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onNavigateToSettings={() => setActiveTab('settings')}
      />

      {/* Main Screen Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
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

      {/* Target Carbon Footer */}
      <footer id="footer" className="max-w-7xl mx-auto w-full px-6 py-12 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 mb-20">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
            <Shield className="w-3 h-3 text-gray-400" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase">Centra Secure Systems</span>
        </div>
        <div className="flex items-center gap-8 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <button onClick={() => setActiveTab('settings')} className="hover:text-white transition-colors">Privacy Policy</button>
          <button onClick={() => setActiveTab('settings')} className="hover:text-white transition-colors">Support</button>
          <button onClick={() => setActiveTab('settings')} className="hover:text-white transition-colors">API Docs</button>
        </div>
      </footer>

      {/* Unified Floating Bottom Dock */}
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
