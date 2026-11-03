import { useState, useEffect } from 'react';
import { isNative } from './platform';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener(deferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((listener) => listener(null));
  });
}

export const getDeferredPrompt = (): BeforeInstallPromptEvent | null => deferredPrompt;

export const isStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  return false;
};

export const isSafariBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS|OPR/.test(ua);
};

export const isMacPlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const plat = (window.navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || window.navigator.platform || '';
  return /Mac/i.test(plat) || /Macintosh/i.test(ua);
};

export const isIosPlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
};

export const subscribePromptChange = (callback: (prompt: BeforeInstallPromptEvent | null) => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export function usePwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(getDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState<boolean>(isStandaloneMode);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let media: MediaQueryList | null = null;
    let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

    if (typeof window.matchMedia === 'function') {
      media = window.matchMedia('(display-mode: standalone)');
      mediaHandler = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches);
      };
      media.addEventListener('change', mediaHandler);
    }

    const unsubscribePrompt = subscribePromptChange((p) => {
      setPrompt(p);
    });

    return () => {
      if (media && mediaHandler) {
        media.removeEventListener('change', mediaHandler);
      }
      unsubscribePrompt();
    };
  }, []);

  const triggerInstallPrompt = async (): Promise<boolean> => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          deferredPrompt = null;
          setPrompt(null);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    return false;
  };

  const triggerInstall = async (): Promise<'prompted' | 'manual'> => {
    const success = await triggerInstallPrompt();
    return success ? 'prompted' : 'manual';
  };

  const canPrompt = Boolean(prompt);

  return {
    canPrompt,
    isInstallable: canPrompt && !isStandalone && !isNative(),
    isStandalone,
    prompt,
    triggerInstall,
    triggerInstallPrompt,
    isSafariMac: isSafariBrowser() && isMacPlatform(),
    isSafariIos: isSafariBrowser() && isIosPlatform(),
  };
}
