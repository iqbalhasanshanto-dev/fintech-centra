import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationsModal } from '../components/modals/NotificationsModal';
import { AppShell } from '../components/layout/AppShell';
import * as updateCheckerModule from '../utils/updateChecker';
import * as nativeNotificationsModule from '../utils/nativeNotifications';
import { getAppVersion } from '../utils/version';
import { NotificationItem } from '../types';

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
