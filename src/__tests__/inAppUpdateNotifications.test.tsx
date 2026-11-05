import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationsModal } from '../components/modals/NotificationsModal';
import { AppShell } from '../components/layout/AppShell';
import * as updateCheckerModule from '../utils/updateChecker';
import * as nativeNotificationsModule from '../utils/nativeNotifications';
import { getAppVersion } from '../utils/version';
import { NotificationItem } from '../types';
import { Browser } from '@capacitor/browser';
import * as platformModule from '../utils/platform';

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  },
}));

let mockNotifications: NotificationItem[] = [];
const mockAddNotification = vi.fn((notif) => {
  mockNotifications.push({
    ...notif,
    id: notif.id || 'gen-id',
    timestamp: new Date().toISOString(),
    isRead: false,
  });
});
const mockMarkNotificationAsRead = vi.fn((id: string) => {
  const target = mockNotifications.find(n => n.id === id);
  if (target) target.isRead = true;
});

vi.mock('../context/FinanceContext', () => ({
  useFinance: () => ({
    transactions: [],
    pendingUndo: null,
    undoLastDelete: vi.fn(),
    notifications: mockNotifications,
    addNotification: mockAddNotification,
    markNotificationAsRead: mockMarkNotificationAsRead,
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    clearNotifications: vi.fn(),
    unreadNotificationsCount: mockNotifications.filter(n => !n.isRead).length,
    periodFilter: 'this_month',
    setPeriodFilter: vi.fn(),
    syncStatus: 'synced',
    categories: [],
    accounts: [],
    goals: [],
    budgets: [],
    settings: {
      theme: 'dark',
      baseCurrency: 'USD',
      currency: 'USD',
      offlineMode: false,
    },
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
    isGuest: false,
  }),
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
}));

describe('In-App Update Notifications System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNotifications = [];
  });

  describe('NotificationsModal Update Notification Handling', () => {
    it('renders "Update now" action label for update notification cards', () => {
      mockNotifications = [
        {
          id: 'update-available:4.1.4',
          type: 'system',
          title: 'New Update Available (v4.1.4)',
          message: 'Centra v4.1.4 is ready with bug fixes and improvements. Tap to update now.',
          timestamp: new Date().toISOString(),
          isRead: false,
          severity: 'info',
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Update now')).toBeDefined();
    });

    it('marks notification as read, closes modal, and calls onOpenUpdateModal when clicked', () => {
      const onOpenUpdateModal = vi.fn();
      const onClose = vi.fn();

      mockNotifications = [
        {
          id: 'update-available:4.1.4',
          type: 'system',
          title: 'New Update Available (v4.1.4)',
          message: 'Centra v4.1.4 is ready with bug fixes. Tap to update now.',
          timestamp: new Date().toISOString(),
          isRead: false,
          severity: 'info',
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={onClose}
          onOpenUpdateModal={onOpenUpdateModal}
        />
      );

      const updateCard = screen.getByText('New Update Available (v4.1.4)');
      fireEvent.click(updateCard);

      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('update-available:4.1.4');
      expect(onClose).toHaveBeenCalled();
      expect(onOpenUpdateModal).toHaveBeenCalled();
    });

    it('renders "Visit website" and opens URL in new window when actionUrl is http/https', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const onOpenQuickAction = vi.fn();
      mockNotifications = [
        {
          id: 'custom-url-notif',
          type: 'system',
          title: 'Special Event',
          message: 'Check out our announcement online.',
          timestamp: new Date().toISOString(),
          isRead: false,
          actionUrl: 'https://centra.app/announcement',
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
          onOpenQuickAction={onOpenQuickAction}
        />
      );

      expect(screen.getByText('Visit website')).toBeDefined();
      const card = screen.getByText('Special Event');
      fireEvent.click(card);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://centra.app/announcement', '_blank', 'noopener,noreferrer');
      expect(onOpenQuickAction).not.toHaveBeenCalled();
      windowOpenSpy.mockRestore();
    });

    it('renders "Download update" when notification mentions download update or .apk link', () => {
      mockNotifications = [
        {
          id: 'download-url-notif',
          type: 'system',
          title: 'New APK Release',
          message: 'Download update at https://try-centra.netlify.app/Centra-v4.1.3.apk',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Download update')).toBeDefined();
    });

    it('opens external URL via Browser.open on native Android/iOS', () => {
      vi.spyOn(platformModule, 'isNative').mockReturnValue(true);
      const browserOpenSpy = vi.spyOn(Browser, 'open').mockResolvedValue(undefined as never);
      mockNotifications = [
        {
          id: 'native-browser-notif',
          type: 'security',
          title: 'Security Alert',
          message: 'Verify at https://try-centra.netlify.app',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Visit website')).toBeDefined();
      const card = screen.getByText('Security Alert');
      fireEvent.click(card);

      expect(browserOpenSpy).toHaveBeenCalledWith({ url: 'https://try-centra.netlify.app' });
    });

    it('extracts URL from message text and opens it when notification has no actionUrl', () => {
      vi.spyOn(platformModule, 'isNative').mockReturnValue(false);
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      mockNotifications = [
        {
          id: 'extracted-url-notif',
          type: 'system',
          title: 'Latest Updates',
          message: 'Explore our web release at https://try-centra.netlify.app — thank you!',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const card = screen.getByText('Latest Updates');
      fireEvent.click(card);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://try-centra.netlify.app', '_blank', 'noopener,noreferrer');
      windowOpenSpy.mockRestore();
    });

    it('renders inline https URL in message body as clickable link that opens external URL', () => {
      vi.spyOn(platformModule, 'isNative').mockReturnValue(false);
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      mockNotifications = [
        {
          id: 'inline-link-notif',
          type: 'system',
          title: 'Visit Us',
          message: 'Official website: https://try-centra.netlify.app',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const inlineLink = screen.getByRole('link', { name: 'https://try-centra.netlify.app' });
      expect(inlineLink).toBeDefined();
      expect(inlineLink.className).toContain('text-[#4D6E18]');
      expect(inlineLink.className).toContain('underline');

      fireEvent.click(inlineLink);
      expect(windowOpenSpy).toHaveBeenCalledWith('https://try-centra.netlify.app', '_blank', 'noopener,noreferrer');
      windowOpenSpy.mockRestore();
    });

    it('does not trigger onOpenQuickAction for generic system notifications without welcome', () => {
      const onOpenQuickAction = vi.fn();
      mockNotifications = [
        {
          id: 'generic-system-notif',
          type: 'system',
          title: 'System Maintenance Notice',
          message: 'Server maintenance scheduled tonight.',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
          onOpenQuickAction={onOpenQuickAction}
        />
      );

      const card = screen.getByText('System Maintenance Notice');
      fireEvent.click(card);

      expect(onOpenQuickAction).not.toHaveBeenCalled();
    });

    it('triggers onOpenQuickAction for welcome notifications', () => {
      const onOpenQuickAction = vi.fn();
      mockNotifications = [
        {
          id: 'welcome-notif',
          type: 'system',
          title: 'Welcome to Centra',
          message: 'Add your first transaction now.',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(
        <NotificationsModal
          isOpen={true}
          onClose={vi.fn()}
          onOpenQuickAction={onOpenQuickAction}
        />
      );

      const card = screen.getByText('Welcome to Centra');
      fireEvent.click(card);

      expect(onOpenQuickAction).toHaveBeenCalled();
    });
  });

  describe('AppShell In-App Update Trigger and Auto-Clean', () => {
    it('dispatches status-bar notification and in-app notification when an update is available', async () => {
      const triggerSystemSpy = vi.spyOn(nativeNotificationsModule, 'triggerSystemNotification').mockResolvedValue(true);
      vi.spyOn(updateCheckerModule, 'checkForAppUpdate').mockResolvedValue({
        updateAvailable: true,
        installedVersion: '4.1.3',
        latestVersion: '4.1.4',
        releaseNotes: ['Improved sync', 'Fixed modal animation'],
      });

      render(<AppShell />);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'update-available:4.1.4',
            title: 'New Update Available (v4.1.4)',
            type: 'system',
          })
        );
        expect(triggerSystemSpy).toHaveBeenCalledWith(
          'Update Available: Centra v4.1.4',
          'Tap to update to the latest version with bug fixes and improvements.',
          'update-4.1.4'
        );
      });
    });

    it('auto-cleans already-installed update notifications on mount', async () => {
      const currentVer = getAppVersion();
      mockNotifications = [
        {
          id: `update-available:${currentVer}`,
          type: 'system',
          title: `New Update Available (v${currentVer})`,
          message: 'Stale update notification',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        {
          id: 'update-alert-v4.1.3-patch',
          type: 'system',
          title: 'Update alert',
          message: 'Stale alert',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ];

      render(<AppShell />);

      await waitFor(() => {
        expect(mockMarkNotificationAsRead).toHaveBeenCalledWith(`update-available:${currentVer}`);
        expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('update-alert-v4.1.3-patch');
      });
    });
  });
});
