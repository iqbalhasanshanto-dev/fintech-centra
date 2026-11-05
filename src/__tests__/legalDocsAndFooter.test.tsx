import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LegalDocsModal } from '../components/modals/LegalDocsModal';
import { AppShell } from '../components/layout/AppShell';
import { SettingsScreen } from '../components/settings/SettingsScreen';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { ThemeProvider } from '../context/ThemeContext';

describe('LegalDocsModal, Upgraded App Footer & Support Center', () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  describe('1. LegalDocsModal 4-Tab Hub', () => {
    it('renders all 4 tabs and defaults to Privacy Policy', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="privacy"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Privacy Policy$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Terms & Conditions$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^License$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Support$/i })).toBeInTheDocument();

      expect(screen.getByText(/Zero Data Selling • Offline-First Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy-First & Offline-First Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Information We Collect & Store/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Synchronization & Cryptographic Security/i)).toBeInTheDocument();
      expect(screen.getByText(/Rolling 2-Month Data Retention & CSV Backups/i)).toBeInTheDocument();
      expect(screen.getByText(/Third-Party Infrastructure & Zero Tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Data Rights & Instant Deletion/i)).toBeInTheDocument();
    });

    it('switches to Terms & Conditions tab and displays terms content', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="terms"
        />
      );

      expect(screen.getByText(/Transparent Usage Terms • Personal Finance & Budgeting Tool/i)).toBeInTheDocument();
      expect(screen.getByText(/Acceptance of Terms/i)).toBeInTheDocument();
      expect(screen.getByText(/Scope of Service & Financial Disclaimer/i)).toBeInTheDocument();
      expect(screen.getByText(/Centra is not a bank, licensed depository institution/i)).toBeInTheDocument();
      expect(screen.getByText(/Account Security & User Responsibility/i)).toBeInTheDocument();
      expect(screen.getByText(/Multi-Currency Conversions & Calculations/i)).toBeInTheDocument();
      expect(screen.getByText(/Intellectual Property & Brand Protection/i)).toBeInTheDocument();
      expect(screen.getByText(/Disclaimer of Warranties & Limitation of Liability/i)).toBeInTheDocument();
    });

    it('renders License with protected copyright and permissions cards', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="license"
        />
      );

      expect(screen.getByText(/^Permitted$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Conditions$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Restricted$/i)).toBeInTheDocument();
      expect(screen.getByText(/No Commercial Clones/i)).toBeInTheDocument();
      expect(screen.getByText(/No Paid Redistribution/i)).toBeInTheDocument();
      expect(screen.getByText(/No Rebranding or App Store Republishing/i)).toBeInTheDocument();
      expect(screen.getByText(/All Rights Reserved on Brand, Trademarks, and Commercial Distribution/i)).toBeInTheDocument();
      expect(screen.getByText(/View on GitHub/i)).toBeInTheDocument();
    });

    it('renders Support tab with direct email, GitHub issues, website, and FAQs', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="support"
        />
      );

      expect(screen.getByText(/Developer Email/i)).toBeInTheDocument();
      expect(screen.getByText(/mdiqbalhasan\.dev@gmail\.com/i)).toBeInTheDocument();
      expect(screen.getByText(/GitHub Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/Official Website/i)).toBeInTheDocument();
      expect(screen.getByText(/https:\/\/try-centra\.netlify\.app\//i)).toBeInTheDocument();
      expect(screen.getByText(/Frequently Asked Questions \(FAQ\)/i)).toBeInTheDocument();
      expect(screen.getByText(/How does Offline Sync work\?/i)).toBeInTheDocument();
      expect(screen.getByText(/How do I export a CSV backup\?/i)).toBeInTheDocument();
      expect(screen.getByText(/How does the 2-Month Retention Policy work\?/i)).toBeInTheDocument();
      expect(screen.getByText(/How do I reset my App PIN\?/i)).toBeInTheDocument();
    });

    it('maps "api" initialDoc to license tab per specification', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="api"
        />
      );

      expect(screen.getByText(/All Rights Reserved on Brand, Trademarks, and Commercial Distribution/i)).toBeInTheDocument();
    });
  });

  describe('2. Upgraded AppShell Footer', () => {
    it('renders footer brand, status dot, and all legal modal link buttons', () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </FinanceProvider>
        </AuthProvider>
      );

      const footer = document.querySelector('#footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent(/Centra/);
      expect(footer).toHaveTextContent(/Personal Finance & Expense Tracker/);
      expect(footer).toHaveTextContent(/Offline-First/);

      // Verify clicking links in footer opens modal
      const licenseBtn = screen.getByRole('button', { name: /^License$/i });
      expect(licenseBtn).toBeInTheDocument();
      fireEvent.click(licenseBtn);

      expect(screen.getByText(/All Rights Reserved on Brand, Trademarks, and Commercial Distribution/i)).toBeInTheDocument();
    });
  });

  describe('3. SettingsScreen Data & Support Rows', () => {
    it('renders all 5 rows under Data & Support and opens LegalDocsModal', () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <ThemeProvider>
              <SettingsScreen onBack={() => {}} />
            </ThemeProvider>
          </FinanceProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Download your data')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      expect(screen.getByText('Software License')).toBeInTheDocument();
      expect(screen.getByText('Help & Support')).toBeInTheDocument();

      // Open Software License modal from Settings
      const licenseRow = screen.getByText('Software License');
      fireEvent.click(licenseRow);

      expect(screen.getByText(/Commercial & brand rights reserved • © 2026 Md\. Iqbal Hasan Shanto/i)).toBeInTheDocument();
      expect(screen.getByText(/All Rights Reserved on Brand, Trademarks, and Commercial Distribution/i)).toBeInTheDocument();
    });
  });
});
