import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Shield,
  FileText,
  Scale,
  LifeBuoy,
  ExternalLink,
  CheckCircle2,
  Lock,
  Check,
  AlertCircle,
  Mail,
  HelpCircle,
  Server,
} from 'lucide-react';
import { useBackHandler } from '../../utils/backButton';
import { getAppVersion } from '../../utils/version';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export type LegalDocType = 'privacy' | 'terms' | 'license' | 'support' | 'api';

interface LegalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

type TabKey = 'privacy' | 'terms' | 'license' | 'support';

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'privacy',
}) => {
  const resolveTab = (doc: LegalDocType): TabKey => {
    if (doc === 'api') return 'support';
    if (doc === 'license') return 'license';
    if (doc === 'terms') return 'terms';
    if (doc === 'support') return 'support';
    return 'privacy';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(() => resolveTab(initialDoc));
  const [prevInitialDoc, setPrevInitialDoc] = useState<LegalDocType>(initialDoc);
  if (initialDoc !== prevInitialDoc) {
    setPrevInitialDoc(initialDoc);
    setActiveTab(resolveTab(initialDoc));
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
        className="relative z-[121] max-w-2xl w-full max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden text-gray-900 dark:text-white"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/15 dark:bg-[#C6FF3D]/20 text-[#0A0E1A] dark:text-[#C6FF3D] flex items-center justify-center shrink-0">
              {activeTab === 'privacy' && <Shield className="w-4 h-4 stroke-[2.5]" />}
              {activeTab === 'terms' && <FileText className="w-4 h-4 stroke-[2.5]" />}
              {activeTab === 'license' && <Scale className="w-4 h-4 stroke-[2.5]" />}
              {activeTab === 'support' && <LifeBuoy className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">
                {activeTab === 'privacy' && 'Privacy Policy'}
                {activeTab === 'terms' && 'Terms & Conditions'}
                {activeTab === 'license' && 'Open-Source License'}
                {activeTab === 'support' && 'Support & Help Center'}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Centra — Personal Finance &amp; Expense Tracker • Offline-First • v{getAppVersion()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Navigation Pill Tabs */}
        <div className="px-6 pt-3 pb-2.5 flex gap-2 overflow-x-auto no-scrollbar border-b border-black/5 dark:border-white/10 shrink-0 bg-[#F9FAFB]/50 dark:bg-[#141414]/50">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold shadow-xs'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold shadow-xs'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'license'
                ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold shadow-xs'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            License (MIT)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold shadow-xs'
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            Support
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed overscroll-contain">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {/* Highlight Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Zero Data Selling • Offline-First Architecture • End-to-End Row-Level Security</span>
                </div>
                <span className="text-[11px] font-normal text-emerald-700/80 dark:text-emerald-400/80">
                  Last Updated: March 30, 2026
                </span>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-[#56791E] dark:text-[#C6FF3D]">1.</span>
                  <span>Privacy-First &amp; Offline-First Architecture</span>
                </h3>
                <p>
                  Centra is built from the ground up on an offline-first architecture. All of your personal financial records—including transactions, accounts, category budgets, and savings goals—are stored locally on your device within secure, namespaced client databases (<span className="font-mono text-xs">CentraDB</span>). Centra functions with zero latency, complete privacy, and full capability whether you are connected to the internet or entirely offline. When using Centra in Guest or Demo mode, your data never leaves your device and is never transmitted over any network.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-[#56791E] dark:text-[#C6FF3D]">2.</span>
                  <span>Information We Collect &amp; Store</span>
                </h3>
                <p>
                  We collect and process only the minimal data strictly necessary to provide personal finance tracking and synchronization:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
                  <li>
                    <strong className="text-gray-900 dark:text-white">Account &amp; Profile Data:</strong> Display name, email address, optional profile picture, date of birth, country, and selected base currency when you authenticate via Google OAuth or Email OTP.
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Financial Records:</strong> Account names and balances, income and expense transactions, inter-account transfers, category budgets, savings goals, and optional receipt images. All receipt image attachments are pre-compressed and sanitized locally on your device prior to saving.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-[#56791E] dark:text-[#C6FF3D]">3.</span>
                  <span>Cloud Synchronization &amp; Cryptographic Security</span>
                </h3>
                <p>
                  When you sign in to enable multi-device sync, Centra safeguards your cloud records using industry-leading security practices:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                      <Server className="w-3.5 h-3.5 text-[#56791E] dark:text-[#C6FF3D]" />
                      <span>Supabase Row-Level Security (RLS)</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      Data is secured in transit (TLS 1.3) and at rest (AES-256). Strict PostgreSQL Row-Level Security (<span className="font-mono">auth.uid() = user_id</span>) guarantees only your cryptographic token can read or mutate your records.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                      <Lock className="w-3.5 h-3.5 text-[#56791E] dark:text-[#C6FF3D]" />
                      <span>Local App PIN Protection</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      When PIN Lock is active, your PIN is derived and validated on-device using PBKDF2-SHA256 with 100,000 iterations and an isolated salt. Your raw PIN is never stored or transmitted over the network.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-[#56791E] dark:text-[#C6FF3D]">4.</span>
                  <span>Rolling 2-Month Data Retention &amp; CSV Backups</span>
                </h3>
                <p>
                  To ensure instant query execution, snappy mobile performance, and rapid client-side hydration, Centra automatically maintains active transaction history for the <strong className="text-gray-900 dark:text-white">Current Month and Previous Month (2 months total)</strong>. You can export a complete, uncompressed CSV backup of all historical ledgers at any time directly from <span className="font-semibold text-gray-900 dark:text-white">Settings → Download your data</span>.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-[#56791E] dark:text-[#C6FF3D]">5.</span>
                  <span>Third-Party Infrastructure &amp; Zero Tracking</span>
                </h3>
                <p>
                  Centra uses Supabase (database &amp; auth), Google OAuth (optional authentication), and Vercel (web hosting). We do not include any advertising SDKs, behavioral analytics trackers, or third-party data broker scripts. We never sell, rent, monetize, or trade your personal financial data to advertisers or third parties.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-[#56791E] dark:text-[#C6FF3D]">6.</span>
                  <span>Your Data Rights &amp; Instant Deletion</span>
                </h3>
                <p>
                  You retain complete ownership over your financial records. You can export all accounts, transactions, categories, budgets, and goals to CSV in one click (<span className="font-semibold text-gray-900 dark:text-white">Settings → Download your data</span>). Additionally, you can permanently wipe all cloud database records and local storage immediately via <span className="font-semibold text-rose-600 dark:text-rose-400">Settings → Delete All My Data</span>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              {/* Highlight Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Clear, Transparent Terms • Open-Source Personal Finance Tool</span>
                </div>
                <span className="text-[11px] font-normal text-blue-700/80 dark:text-blue-400/80">
                  Effective Date: March 30, 2026
                </span>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">1.</span>
                  <span>Acceptance of Terms</span>
                </h3>
                <p>
                  By accessing, browsing, downloading, installing, or using Centra on Web, Android, or iOS, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree with any part of these terms, you must not use or access the service.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">2.</span>
                  <span>Scope of Service &amp; Financial Disclaimer</span>
                </h3>
                <p>
                  Centra is an offline-first personal budgeting, expense logging, and financial productivity tool. <strong className="text-gray-900 dark:text-white">Centra is not a bank, licensed depository institution, certified financial advisor, tax specialist, or investment broker.</strong> All visual graphs, savings pace projections, budget progress bars, and currency conversions are provided strictly for personal record-keeping, organization, and informational purposes. You should not rely on Centra as a substitute for professional financial, tax, or investment advice.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">3.</span>
                  <span>Account Security &amp; User Responsibility</span>
                </h3>
                <p>
                  You are solely responsible for safeguarding your device, local App PIN, Google account credentials, and email security. If you use Centra in purely offline Guest mode or clear your browser/app storage before pending offline outbox items synchronize to the cloud, un-synced local records cannot be recovered by Centra.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">4.</span>
                  <span>Currency Conversion &amp; Calculations</span>
                </h3>
                <p>
                  Multi-currency balances and transactions are converted into your chosen Base Currency using bundled reference exchange rates. Actual conversion rates applied by your credit card issuer, bank, or currency exchange provider may differ due to spread margins and foreign transaction fees.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">5.</span>
                  <span>Acceptable Use</span>
                </h3>
                <p>
                  You agree to use Centra solely for lawful personal finance tracking. You agree not to abuse the backend database infrastructure, perform denial-of-service attacks, attempt unauthorized privilege escalation, or interfere with other users' isolated data partitions.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">6.</span>
                  <span>Disclaimer of Warranties &amp; Limitation of Liability</span>
                </h3>
                <p>
                  Centra is provided on an <strong className="text-gray-900 dark:text-white">"AS IS"</strong> and <strong className="text-gray-900 dark:text-white">"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. Under no legal theory shall the author, contributors, or distributors be held liable for any indirect, incidental, special, or consequential damages resulting from data loss, sync failures, or financial actions taken in connection with the application.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LICENSE (MIT) */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              {/* Summary 3-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Permissions */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Permissions</span>
                  </div>
                  <ul className="text-[11px] space-y-1 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Commercial Use</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Modification</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Distribution</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Private Use</span>
                    </li>
                  </ul>
                </div>

                {/* Conditions */}
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Conditions</span>
                  </div>
                  <ul className="text-[11px] space-y-1 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span>Include Copyright Notice</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span>Include License Notice</span>
                    </li>
                  </ul>
                </div>

                {/* Limitations */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Limitations</span>
                  </div>
                  <ul className="text-[11px] space-y-1 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>No Liability</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>No Warranty</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Monospace Verbatim MIT License Card */}
              <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/10 dark:border-white/10 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed select-all">
{`MIT License

Copyright (c) 2026 Md. Iqbal Hasan Shanto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
              </div>

              {/* GitHub Repository Link Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <GithubIcon className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Centra Open-Source Repository</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">View source code, star on GitHub, or submit pull requests</p>
                  </div>
                </div>
                <a
                  href="https://github.com/iqbalhasanshanto-dev/fintech-centra"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#18212F] text-white dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              {/* Direct Contact Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Support Card */}
                <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">Direct Email Support</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Get assistance from the core maintainer</p>
                      </div>
                    </div>
                    <p className="font-mono text-xs text-gray-700 dark:text-gray-300 pt-1 truncate">
                      mdiqbalhasan.dev@gmail.com
                    </p>
                  </div>
                  <a
                    href="mailto:mdiqbalhasan.dev@gmail.com?subject=Centra%20Support%20%26%20Feedback"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-full bg-[#18212F] text-white dark:bg-white dark:text-[#0A0E1A] font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </a>
                </div>

                {/* GitHub Issue Tracker Card */}
                <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <GithubIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">GitHub Issue Tracker</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Report bugs or request new features</p>
                      </div>
                    </div>
                    <p className="font-mono text-xs text-gray-700 dark:text-gray-300 pt-1 truncate">
                      iqbalhasanshanto-dev/fintech-centra
                    </p>
                  </div>
                  <a
                    href="https://github.com/iqbalhasanshanto-dev/fintech-centra/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-full bg-black text-[#C6FF3D] dark:bg-[#C6FF3D] dark:text-[#0A0E1A] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <span>Open Issue</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Frequently Asked Questions (FAQ) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#56791E] dark:text-[#C6FF3D] shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Frequently Asked Questions (FAQ)
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                      How does Offline-First Sync work?
                    </h5>
                    <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Every transaction, goal, or budget you add offline is saved immediately to your device and queued in the local outbox. As soon as your internet connection returns, Centra syncs your changes to Supabase automatically.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                      How do I export a backup of my financial data?
                    </h5>
                    <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Open <strong className="text-gray-800 dark:text-gray-200">Settings → Data &amp; support → Download your data</strong> to export a complete CSV file containing your accounts, transactions, categories, budgets, and goals.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                      Why do transactions older than 2 months roll over?
                    </h5>
                    <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Centra keeps the Current Month and Previous Month active to ensure instant load times. Export a CSV backup anytime to archive historical months.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1C1C] border border-black/5 dark:border-white/10 space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                      How do I switch between System, Dark, and Light themes?
                    </h5>
                    <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Centra follows your device's System theme by default, and you can toggle Dark/Light mode anytime in <strong className="text-gray-800 dark:text-gray-200">Settings → Appearance &amp; Currency</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 bg-[#F7F8FA] dark:bg-[#1A1A1A]">
          <a
            href="https://github.com/iqbalhasanshanto-dev/fintech-centra"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>fintech-centra</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#18212F] text-white dark:bg-white dark:text-[#0A0E1A] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
