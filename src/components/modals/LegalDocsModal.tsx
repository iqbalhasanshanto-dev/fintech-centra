import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, FileText, LifeBuoy, Code2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useBackHandler } from '../../utils/backButton';
import { APP_VERSION } from '../../utils/version';

export type LegalDocType = 'privacy' | 'terms' | 'support' | 'api';

interface LegalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc);
  const [prevInitialDoc, setPrevInitialDoc] = useState<LegalDocType>(initialDoc);
  if (initialDoc !== prevInitialDoc) {
    setPrevInitialDoc(initialDoc);
    setActiveTab(initialDoc);
  }
  useBackHandler(isOpen, onClose, 8);

  if (!isOpen) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative z-[121] w-full max-w-2xl bg-white dark:bg-[#121212] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C6FF3D]/15 dark:bg-[#C6FF3D]/20 text-[#0A0E1A] dark:text-[#C6FF3D] flex items-center justify-center">
              {activeTab === 'privacy' && <Shield className="w-4 h-4 stroke-[2.5]" />}
              {activeTab === 'terms' && <FileText className="w-4 h-4 stroke-[2.5]" />}
              {activeTab === 'support' && <LifeBuoy className="w-4 h-4 stroke-[2.5]" />}
              {activeTab === 'api' && <Code2 className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {activeTab === 'privacy' && 'Privacy Policy'}
                {activeTab === 'terms' && 'Terms of Service'}
                {activeTab === 'support' && 'Support & Feedback'}
                {activeTab === 'api' && 'Developer & Supabase API'}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Centra Financial OS • Version {APP_VERSION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-black/5 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'support'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            Support
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            API &amp; Architecture
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero Tracking • Offline-First Storage • Client-Side Protection</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">1. Data Ownership &amp; Storage</h3>
              <p>
                Centra is designed with an offline-first philosophy. Your transactions, accounts, budgets, and savings goals are stored locally on your device within namespaced storage. We do not sell, rent, or monetize your personal financial records under any circumstances.
              </p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">2. Supabase Cloud Sync</h3>
              <p>
                When you sign in with Google or Email OTP, data is synchronized with your private Supabase database protected by PostgreSQL Row-Level Security (RLS). Only your authenticated cryptographic user token can query or mutate your records.
              </p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">3. Device Security &amp; PIN Lock</h3>
              <p>
                When PIN Lock is enabled, Centra protects your local access using PBKDF2 key derivation with 100,000 salt iterations. Your raw PIN is never transmitted over any network or stored in plain text.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">1. License &amp; Open-Source Terms</h3>
              <p>
                Centra is licensed under the permissive MIT Open Source License. You are free to inspect the source code, fork the repository, build custom distributions, or contribute enhancements to the project.
              </p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">2. Financial Disclaimer</h3>
              <p>
                Centra is a personal budgeting, record-keeping, and financial visualization tool. It does not provide certified financial planning, tax advice, investment brokering, or legal counseling. All financial calculations and currency conversions are provided for informational tracking purposes.
              </p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">3. Account Responsibility</h3>
              <p>
                You are responsible for maintaining the confidentiality of your PIN, device access, and authentication tokens. Centra cannot recover data lost due to device erasure without cloud synchronization enabled.
              </p>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <p>
                Need help with your Centra installation, sync status, or feature requests? Our open-source team and developer community are readily available.
              </p>
              <div className="p-4 rounded-2xl bg-[#F1F2F4] dark:bg-[#1D1D1D] border border-black/5 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">GitHub Discussions &amp; Issues</span>
                  <a
                    href="https://github.com/iqbalhasanshanto-dev/fintech-centra/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#C6FF3D] font-bold text-xs bg-black px-3 py-1.5 rounded-full hover:bg-gray-800"
                  >
                    <span>Open Issue</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10">
                  <span className="font-semibold text-gray-900 dark:text-white">Direct Developer Email</span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">iqbalhasanshanto@gmail.com</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <p>
                Centra is powered by a high-throughput modern stack consisting of React 18, TypeScript, Supabase PostgreSQL, Capacitor 8 Native Bridge, and Tauri 2 Desktop Shell.
              </p>
              <div className="p-3.5 rounded-2xl bg-[#F1F2F4] dark:bg-[#1D1D1D] border border-black/5 dark:border-white/10 font-mono text-xs space-y-1">
                <div className="text-gray-500"># Database Schema &amp; RLS Policies</div>
                <div>TABLE public.profiles (id, onboarding_completed, name, email)</div>
                <div>TABLE public.accounts (id, user_id, balance, currency, type)</div>
                <div>TABLE public.transactions (id, user_id, amount, category_id)</div>
                <div>TABLE public.budgets (id, user_id, category_id, budget_limit)</div>
                <div>TABLE public.goals (id, user_id, target_amount, current_amount)</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/5 dark:border-white/10 flex items-center justify-end shrink-0 bg-[#F7F8FA] dark:bg-[#1A1A1A]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
