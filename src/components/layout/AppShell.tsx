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
  const { transactions, pendingUndo, undoLastDelete } = useFinance();
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
  const tabHistoryRef = useRef<TabType[]>(['home']);

  useEffect(() => {
    return () => {
      if (exitToastTimerRef.current) {
        clearTimeout(exitToastTimerRef.current);
      }
    };
  }, []);

  // Synchronously ensure Demo Mode never renders settings screen
  const effectiveTab: TabType = (isGuest && activeTab === 'settings') ? 'home' : activeTab;

  // Hardware back button root handler: pops tab history stack, and only prompts exit when at root 'home'
  useEffect(() => {
    const unregister = BackButtonManager.registerRootHandler(() => {
      // If we have back history across tabs, pop and navigate back
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current.pop();
        const prevTab = tabHistoryRef.current[tabHistoryRef.current.length - 1] || 'home';
        setActiveTab(prevTab);
        return;
      }

      // If activeTab is not home for any reason, navigate to home
      if (effectiveTab !== 'home') {
        tabHistoryRef.current = ['home'];
        setActiveTab('home');
        return;
      }

      // Only at root tab (home with no prior tab history): trigger double-back exit check
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
      // Push to history stack avoiding consecutive duplicates
      if (tabHistoryRef.current[tabHistoryRef.current.length - 1] !== targetTab) {
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

      {/* 1. Desktop Left Sidebar Navigation (Visible on lg: ≥1024px) */}
      <Sidebar
        activeTab={effectiveTab}
        onSelectTab={handleSelectTab}
        onOpenAddAction={() => handleOpenAddWithTab('transaction')}
      />

      {/* 2. Main Area (Header + Scrollable Content + Footer) */}
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
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 shrink-0">
            <GuestBanner />
          </div>
        )}

        {/* Main Screen Content Container (Locked Scrollable Area) */}
        <main ref={mainContentRef} className={`flex-1 min-h-0 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${effectiveTab === 'settings' ? 'pt-0 pb-4' : 'pt-3 pb-4'} md:py-6 bg-[#F7F8FA] dark:bg-[#000000]`}>
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

          {/* Centra Footer */}
          <footer id="footer" className="max-w-7xl mx-auto w-full px-2 sm:px-6 py-6 pb-28 lg:pb-6 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3 mt-8">
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

      {/* 5-Second Undo Delete Toast Bar (Above Bottom Nav) */}
      {pendingUndo && (
        <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-[#1D1D1D]/95 text-white border border-white/15 shadow-2xl backdrop-blur-md overflow-hidden animate-fade-in flex flex-col">
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
      )}

      {/* Floating Exit Toast Pill */}
      {showExitToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full bg-[#1D1D1D]/95 text-white border border-white/15 shadow-2xl backdrop-blur-md text-xs font-semibold animate-fade-in pointer-events-none select-none flex items-center gap-2">
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
