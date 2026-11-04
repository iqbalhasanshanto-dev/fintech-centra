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
      expect(screen.getByRole('button', { name: /^License \(MIT\)$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Support$/i })).toBeInTheDocument();

      expect(screen.getByText(/Zero Data Selling • Offline-First Architecture/i)).toBeInTheDocument();
    });

    it('switches to Terms & Conditions tab and displays terms content', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="terms"
        />
      );

      expect(screen.getByText(/Clear, Transparent Terms • Open-Source Personal Finance Tool/i)).toBeInTheDocument();
      expect(screen.getByText(/Scope of Service & Financial Disclaimer/i)).toBeInTheDocument();
      expect(screen.getByText(/Centra is not a bank, licensed depository institution/i)).toBeInTheDocument();
    });

    it('renders License (MIT) with verbatim copyright and permissions cards', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="license"
        />
      );

      expect(screen.getByText(/^Permissions$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Conditions$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Limitations$/i)).toBeInTheDocument();
      expect(screen.getByText(/Copyright \(c\) 2026 Md\. Iqbal Hasan Shanto/i)).toBeInTheDocument();
      expect(screen.getByText(/View on GitHub/i)).toBeInTheDocument();
    });

    it('renders Support tab with direct email, GitHub issues, and FAQs', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="support"
        />
      );

      expect(screen.getByText(/Direct Email Support/i)).toBeInTheDocument();
      expect(screen.getByText(/mdiqbalhasan\.dev@gmail\.com/i)).toBeInTheDocument();
      expect(screen.getByText(/GitHub Issue Tracker/i)).toBeInTheDocument();
      expect(screen.getByText(/Frequently Asked Questions \(FAQ\)/i)).toBeInTheDocument();
      expect(screen.getByText(/How does Offline-First Sync work\?/i)).toBeInTheDocument();
    });

    it('maps "api" initialDoc to support tab gracefully', () => {
      render(
        <LegalDocsModal
          isOpen={true}
          onClose={() => {}}
          initialDoc="api"
        />
      );

      expect(screen.getByText(/Frequently Asked Questions \(FAQ\)/i)).toBeInTheDocument();
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

      expect(screen.getByText(/Open-Source License/i)).toBeInTheDocument();
      expect(screen.getByText(/Copyright \(c\) 2026 Md\. Iqbal Hasan Shanto/i)).toBeInTheDocument();
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
      expect(screen.getByText('Open-Source License')).toBeInTheDocument();
      expect(screen.getByText('Help & Support')).toBeInTheDocument();

      // Open Open-Source License modal from Settings
      const licenseRow = screen.getByText('Open-Source License');
      fireEvent.click(licenseRow);

      expect(screen.getByText(/MIT License • Copyright © 2026 Md\. Iqbal Hasan Shanto/i)).toBeInTheDocument();
    });
  });
});
