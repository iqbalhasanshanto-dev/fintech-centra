import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Header } from './Header';
import { BottomNav, TabType } from './BottomNav';
import { GuestBanner } from './GuestBanner';
import { HomeScreen } from '../home/HomeScreen';
import { ReportScreen } from '../report/ReportScreen';
import { PlanScreen } from '../plan/PlanScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { LazyErrorBoundary } from '../ui/LazyErrorBoundary';
import { AddActionModal } from '../modals/AddActionModal';
import { NotificationsModal } from '../modals/NotificationsModal';
import { LegalDocsModal, LegalDocType } from '../modals/LegalDocsModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { BackButtonManager, exitNativeApp } from '../../utils/backButton';

export const AppShell: React.FC = () => {
  const { isGuest } = useAuth();
  const { transactions, pendingUndo, undoLastDelete } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'transaction' | 'transfer' | 'goal' | 'budget' | 'spend' | 'income' | 'create-goal'>('spend');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const tabHistoryRef = useRef<TabType[]>(['home']);

  // Synchronously ensure Demo Mode never renders settings screen
  const effectiveTab: TabType = (isGuest && activeTab === 'settings') ? 'home' : activeTab;

  // Hardware back button root handler: pops tab history stack, and immediately minimizes/exits when at root 'home'
  useEffect(() => {
    const unregister = BackButtonManager.registerRootHandler(() => {
      // Whenever the user is on Home (and no modal/drawer is open), immediately minimize/exit to phone home screen
      if (effectiveTab === 'home') {
        exitNativeApp();
        return;
      }

      // If we are on another tab and have back history across tabs, pop and navigate back
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current.pop();
        const prevTab = tabHistoryRef.current[tabHistoryRef.current.length - 1] || 'home';
        setActiveTab(prevTab);
        return;
      }

      // Fallback: return to home
      tabHistoryRef.current = ['home'];
      setActiveTab('home');
    });
    return unregister;
  }, [effectiveTab]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  useLayoutEffect(() => {
    scrollToTop();
  }, [effectiveTab]);

  const handleSelectTab = (tab: TabType) => {
    const targetTab = (isGuest && tab === 'settings') ? 'home' : tab;
    if (targetTab === effectiveTab) {
      scrollToTop();
    } else {
      if (targetTab === 'home') {
        tabHistoryRef.current = ['home'];
      } else if (tabHistoryRef.current[tabHistoryRef.current.length - 1] !== targetTab) {
        tabHistoryRef.current.push(targetTab);
      }
      setActiveTab(targetTab);
    }
  };

  const handleOpenAddWithTab = (tab: 'transaction' | 'transfer' | 'goal' | 'budget' | 'spend' | 'income' | 'create-goal' = 'spend') => {
    if (tab === 'transaction') {
      const resolved = transactions.length === 0 ? 'income' : 'spend';
      setAddModalDefaultTab(resolved);
    } else {
      setAddModalDefaultTab(tab);
    }
    setShowAddModal(true);
  };

  return (
    <div className="h-[100dvh] overflow-hidden w-full bg-[#F7F8FA] dark:bg-[#000000] text-gray-900 dark:text-gray-100 flex antialiased">

      {/* Main Area (Header + Scrollable Content + Floating Bottom Dock) */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-[100dvh] overflow-hidden bg-[#F7F8FA] dark:bg-[#000000]">

        {/* Top Header Toolbar */}
        <div className={effectiveTab === 'settings' ? 'hidden lg:block shrink-0 z-40' : 'shrink-0 z-40'}>
          <Header
            activeTab={effectiveTab}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onNavigateToSettings={() => handleSelectTab('settings')}
            onOpenAddAction={() => handleOpenAddWithTab('transaction')}
          />
        </div>

        {/* Guest Mode Warning Banner */}
        {isGuest && (
          <div className="w-full max-w-[1040px] mx-auto px-5 sm:px-8 pt-3 shrink-0">
            <GuestBanner />
          </div>
        )}

        {/* Main Screen Content Container (Locked Scrollable Area with pb-28 for Bottom Nav) */}
        <main ref={mainContentRef} className={`flex-1 min-h-0 overflow-y-auto w-full max-w-[1040px] mx-auto px-5 sm:px-8 ${effectiveTab === 'settings' ? 'pt-0' : 'pt-3'} pb-28 md:pt-6 md:pb-28 bg-[#F7F8FA] dark:bg-[#000000]`}>
          {effectiveTab === 'home' && (
            <HomeScreen
              onNavigateToReport={() => handleSelectTab('report')}
              onOpenTransfer={() => handleOpenAddWithTab('transfer')}
              onOpenAddTransaction={() => handleOpenAddWithTab('transaction')}
            />
          )}

          {effectiveTab === 'report' && (
            <LazyErrorBoundary fallbackTitle="Unable to load Report">
              <ReportScreen />
            </LazyErrorBoundary>
          )}

          {effectiveTab === 'plan' && (
            <LazyErrorBoundary fallbackTitle="Unable to load Goals & Budgets">
              <PlanScreen
                onOpenAddGoal={() => handleOpenAddWithTab('create-goal')}
                onOpenAddBudget={() => handleOpenAddWithTab('budget')}
              />
            </LazyErrorBoundary>
          )}

          {effectiveTab === 'settings' && (
            <LazyErrorBoundary fallbackTitle="Unable to load Settings">
              <SettingsScreen onBack={() => handleSelectTab('home')} />
            </LazyErrorBoundary>
          )}

          {/* Centra Footer */}
          <footer id="footer" className="max-w-7xl mx-auto w-full px-2 sm:px-6 py-6 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3 mt-8">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Centra Financial OS • Offline-First</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-medium text-gray-500 dark:text-gray-400">
              <button type="button" onClick={() => setLegalDoc('privacy')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
              <button type="button" onClick={() => setLegalDoc('terms')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Terms</button>
              <button type="button" onClick={() => setLegalDoc('support')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Support</button>
              <button type="button" onClick={() => setLegalDoc('api')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">API Docs</button>
            </div>
          </footer>
        </main>

      </div>

      {/* Floating Bottom Navigation (All screen sizes: Mobile, Tablet, Desktop) */}
      <BottomNav
        activeTab={effectiveTab}
        onSelectTab={handleSelectTab}
        onOpenAddAction={handleOpenAddWithTab}
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
        onOpenQuickAction={() => handleOpenAddWithTab('income')}
        onNavigateToTab={handleSelectTab}
        onNavigateToSettings={() => handleSelectTab('settings')}
        onOpenRecentActivities={() => handleSelectTab('home')}
      />

      {/* Dedicated Legal & Support Modal */}
      <LegalDocsModal
        isOpen={!!legalDoc}
        initialDoc={legalDoc || 'privacy'}
        onClose={() => setLegalDoc(null)}
      />

      {/* 5-Second Undo Delete Toast Bar (Above Bottom Nav & Modals) */}
      {pendingUndo && (
        <div className="fixed bottom-24 lg:bottom-10 inset-x-4 z-[220] flex justify-center pointer-events-none">
          <div className="w-full max-w-sm rounded-2xl bg-[#1D1D1D]/95 text-white border border-white/15 shadow-2xl backdrop-blur-md overflow-hidden animate-fade-in flex flex-col pointer-events-auto">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-xs font-semibold text-white truncate">
                  {pendingUndo.label}
                </span>
              </div>
              <button
                type="button"
                onClick={undoLastDelete}
                className="px-3.5 py-1.5 rounded-full bg-[#C6FF3D] hover:bg-[#b8f52e] active:scale-95 text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              >
                UNDO
              </button>
            </div>
            {/* 5-second shrinking progress bar */}
            <div className="w-full h-1 bg-white/10 overflow-hidden">
              <div className="h-full bg-[#C6FF3D] animate-undo-progress" />
            </div>
          </div>
        </div>
      )}

      {/* Hardware Back Root Exit Confirmation Modal */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          exitNativeApp();
        }}
        title="Exit Centra?"
        message="Are you sure you want to exit the application?"
        confirmText="Exit"
        cancelText="Stay"
        type="warning"
      />

    </div>
  );
};
