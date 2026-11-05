import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UpdatePromptModal } from '../components/modals/UpdatePromptModal';
import * as updateCheckerModule from '../utils/updateChecker';

describe('UpdatePromptModal Component (src/components/modals/UpdatePromptModal.tsx)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  const mockUpdateInfo: updateCheckerModule.AppUpdateInfo = {
    updateAvailable: true,
    platform: 'web',
    installedVersion: '1.0.4',
    latestVersion: '1.0.5',
    releaseNotes: [
      'Added zero-data-loss updater',
      'Added comprehensive legal center',
    ],
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <UpdatePromptModal
        isOpen={false}
        onClose={vi.fn()}
        updateInfo={mockUpdateInfo}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal details, badges, and notes when isOpen is true', () => {
    render(
      <UpdatePromptModal
        isOpen={true}
        onClose={vi.fn()}
        updateInfo={mockUpdateInfo}
      />
    );

    expect(screen.getByText('New Update Available')).toBeDefined();
    expect(screen.getByText('v1.0.4')).toBeDefined();
    expect(screen.getByText('v1.0.5')).toBeDefined();
    expect(screen.getByText(/Your accounts, transactions, and login session will be preserved/i)).toBeDefined();
    expect(screen.getByText('Added zero-data-loss updater')).toBeDefined();
    expect(screen.getByText('Added comprehensive legal center')).toBeDefined();
    expect(screen.getByText('Later')).toBeDefined();
    expect(screen.getByText('Update Now')).toBeDefined();
  });

  it('saves dismissed state in sessionStorage and calls onClose when Later is clicked', () => {
    const onClose = vi.fn();
    render(
      <UpdatePromptModal
        isOpen={true}
        onClose={onClose}
        updateInfo={mockUpdateInfo}
      />
    );

    fireEvent.click(screen.getByText('Later'));
    expect(sessionStorage.getItem('centra_dismissed_update_1.0.5')).toBe('1');
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers safe update and shows loading state when Update Now is clicked', async () => {
    const triggerSafeSpy = vi.spyOn(updateCheckerModule, 'triggerSafeAppUpdate').mockImplementation(async () => {
      // simulate delay
      await new Promise(r => setTimeout(r, 50));
    });
    const onClose = vi.fn();

    render(
      <UpdatePromptModal
        isOpen={true}
        onClose={onClose}
        updateInfo={mockUpdateInfo}
      />
    );

    const updateBtn = screen.getByText('Update Now');
    fireEvent.click(updateBtn);

    expect(screen.getByText(/Syncing & Updating.../i)).toBeDefined();

    await waitFor(() => {
      expect(triggerSafeSpy).toHaveBeenCalledWith(mockUpdateInfo);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
