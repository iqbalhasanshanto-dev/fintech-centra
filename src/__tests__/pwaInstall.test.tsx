import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  isStandaloneMode,
  isSafariBrowser,
  isMacPlatform,
  isIosPlatform,
} from '../utils/pwaInstall';
import { InstallAppModal } from '../components/ui/InstallAppModal';

describe('PWA Install Utilities & Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Browser & Platform Detection', () => {
    it('detects standalone mode from navigator.standalone', () => {
      const origNav = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: { ...origNav, standalone: true },
        configurable: true,
      });

      expect(isStandaloneMode()).toBe(true);

      Object.defineProperty(window, 'navigator', {
        value: origNav,
        configurable: true,
      });
    });

    it('detects safari correctly', () => {
      const origUa = window.navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        configurable: true,
      });

      expect(isSafariBrowser()).toBe(true);

      // Chrome UA contains both Chrome and Safari
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });

      expect(isSafariBrowser()).toBe(false);

      Object.defineProperty(window.navigator, 'userAgent', {
        value: origUa,
        configurable: true,
      });
    });

    it('detects macOS and iOS correctly', () => {
      const origUa = window.navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      expect(isMacPlatform()).toBe(true);

      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        configurable: true,
      });

      expect(isIosPlatform()).toBe(true);

      Object.defineProperty(window.navigator, 'userAgent', {
        value: origUa,
        configurable: true,
      });
    });
  });

  describe('InstallAppModal', () => {
    it('renders modal content and responds to onClose', () => {
      const handleClose = vi.fn();
      render(<InstallAppModal isOpen={true} onClose={handleClose} />);

      expect(screen.getByText('Install Centra App')).toBeInTheDocument();
      expect(screen.getByText('Got it')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Got it'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('renders Safari on macOS specific 1-step instruction when on Safari Mac', () => {
      const origUa = window.navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        configurable: true,
      });

      render(<InstallAppModal isOpen={true} onClose={() => {}} />);
      expect(screen.getByText('Safari on macOS (1-Step Install)')).toBeInTheDocument();
      expect(screen.getByText('Add to Dock...')).toBeInTheDocument();

      Object.defineProperty(window.navigator, 'userAgent', {
        value: origUa,
        configurable: true,
      });
    });
  });
});
