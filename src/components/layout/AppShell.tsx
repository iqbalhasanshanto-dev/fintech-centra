import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
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
  const { transactions } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'transaction' | 'transfer' | 'goal' | 'budget' | 'spend' | 'income' | 'create-goal'>('spend');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExitToast, setShowExitToast] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const lastBackPressRef = useRef<number>(0);
  const exitToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (exitToastTimerRef.current) {
        clearTimeout(exitToastTimerRef.current);
      }
    };
  }, []);

  // Synchronously ensure Demo Mode never renders settings screen
  const effectiveTab: TabType = (isGuest && activeTab === 'settings') ? 'home' : activeTab;

  // Hardware back button root handler: switches to 'home' tab first, then requires double-back to prompt exit
  useEffect(() => {
    const unregister = BackButtonManager.registerRootHandler(() => {
      if (effectiveTab !== 'home') {
        setActiveTab('home');
        return;
      }

      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        if (exitToastTimerRef.current) {
          clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = null;
        }
        setShowExitToast(false);
        setShowExitConfirm(true);
      } else {
        lastBackPressRef.current = now;
        setShowExitToast(true);
        if (exitToastTimerRef.current) {
          clearTimeout(exitToastTimerRef.current);
        }
        exitToastTimerRef.current = setTimeout(() => {
          setShowExitToast(false);
          exitToastTimerRef.current = null;
        }, 2000);
      }
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
    <div className="min-h-[100dvh] w-full bg-[#F7F8FA] dark:bg-[#000000] text-gray-900 dark:text-gray-100 flex antialiased transition-colors duration-200">

      {/* 1. Desktop Left Sidebar Navigation (Visible on lg: ≥1024px) */}
      <Sidebar
        activeTab={effectiveTab}
        onSelectTab={handleSelectTab}
        onOpenAddAction={() => handleOpenAddWithTab('transaction')}
      />

      {/* 2. Main Area (Header + Scrollable Content + Footer) */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-[100dvh] bg-[#F7F8FA] dark:bg-[#000000]">

        {/* Top Header Toolbar */}
        <div className={effectiveTab === 'settings' ? 'hidden lg:block' : ''}>
          <Header
            activeTab={effectiveTab}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onNavigateToSettings={() => handleSelectTab('settings')}
            onOpenAddAction={() => handleOpenAddWithTab('transaction')}
          />
        </div>

        {/* Guest Mode Warning Banner */}
        {isGuest && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
            <GuestBanner />
          </div>
        )}

        {/* Main Screen Content Container */}
        <main ref={mainContentRef} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-4 md:py-6 bg-[#F7F8FA] dark:bg-[#000000]">
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
              />
            </LazyErrorBoundary>
          )}

          {effectiveTab === 'settings' && (
            <LazyErrorBoundary fallbackTitle="Unable to load Settings">
              <SettingsScreen onBack={() => handleSelectTab('home')} />
            </LazyErrorBoundary>
          )}
        </main>

        {/* Centra Footer */}
        <footer id="footer" className="max-w-7xl mx-auto w-full px-6 py-6 pb-24 lg:pb-6 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
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

      </div>

      {/* 3. Mobile Floating Bottom Navigation (Hidden on lg: ≥1024px) */}
      <div className="lg:hidden">
        <BottomNav
          activeTab={effectiveTab}
          onSelectTab={handleSelectTab}
          onOpenAddAction={handleOpenAddWithTab}
        />
      </div>

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

      {/* Floating Exit Toast Pill (Above Bottom Nav on Mobile) */}
      {showExitToast && (
        <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-black/90 dark:bg-white text-white dark:text-black text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 animate-fade-in pointer-events-none select-none flex items-center gap-2">
          <span>Swipe back again to exit</span>
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
