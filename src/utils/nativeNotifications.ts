import { logger } from './logger';

/**
 * Requests system notification permission from the user.
 * Supports standard Web Notification API and native mobile WebView contexts.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Check dynamic Capacitor LocalNotifications plugin if available
  const cap = (window as unknown as { Capacitor?: { Plugins?: { LocalNotifications?: { requestPermissions: () => Promise<{ display: string }> } } } }).Capacitor;
  if (cap?.Plugins?.LocalNotifications?.requestPermissions) {
    try {
      const res = await cap.Plugins.LocalNotifications.requestPermissions();
      if (res?.display === 'granted') {
        return true;
      }
    } catch (err) {
      logger.warn('Native LocalNotifications.requestPermissions failed:', err);
    }
  }

  // 2. Check standard browser Notification API
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (err) {
        logger.warn('Browser Notification.requestPermission failed:', err);
      }
    }
  }

  return false;
}

/**
 * Dispatches a native phone status bar / system notification.
 * Dispatches via:
 * 1. Capacitor native bridge / LocalNotifications plugin (if present)
 * 2. ServiceWorker showNotification (for PWAs and modern mobile browsers)
 * 3. Standard Web Notification API
 */
export async function triggerSystemNotification(
  title: string,
  body: string,
  id?: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const cleanTitle = (title || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
  const cleanBody = (body || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();

  const tag = id || `notif_${Date.now()}`;
  const options: NotificationOptions = {
    body: cleanBody,
    icon: '/logo.png',
    badge: '/logo.png',
    tag,
  };

  // 0. Try CentraAndroid JavascriptInterface on Android native WebView
  if (typeof (window as unknown as { CentraAndroid?: { showNotification: (t: string, b: string, id: number) => void } }).CentraAndroid?.showNotification === 'function') {
    try {
      const numericId = Math.abs(
        tag.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) % 100000
      ) || (Date.now() % 100000);
      (window as unknown as { CentraAndroid: { showNotification: (t: string, b: string, id: number) => void } }).CentraAndroid.showNotification(cleanTitle, cleanBody, numericId);
      return true;
    } catch (err) {
      logger.warn('CentraAndroid showNotification failed:', err);
    }
  }

  // 1. Try Capacitor native LocalNotifications if available
  const cap = (window as unknown as {
    Capacitor?: {
      Plugins?: {
        LocalNotifications?: {
          schedule: (options: {
            notifications: Array<{
              title: string;
              body: string;
              id: number;
              extra?: Record<string, unknown>;
            }>;
          }) => Promise<unknown>;
        };
      };
    };
  }).Capacitor;

  if (cap?.Plugins?.LocalNotifications?.schedule) {
    try {
      const numericId = Math.abs(
        tag.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) % 100000
      ) || 1;

      await cap.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            title: cleanTitle,
            body: cleanBody,
            id: numericId,
            extra: { tag },
          },
        ],
      });
      return true;
    } catch (err) {
      logger.warn('Capacitor LocalNotifications schedule failed:', err);
    }
  }

  // 2. Try ServiceWorkerRegistration showNotification
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(cleanTitle, options);
        return true;
      }
    } catch (err) {
      logger.warn('ServiceWorker showNotification failed:', err);
    }
  }

  // 3. Try standard Web Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(cleanTitle, options);
      return true;
    } catch (err) {
      logger.warn('Web Notification constructor failed:', err);
    }
  }

  return false;
}

