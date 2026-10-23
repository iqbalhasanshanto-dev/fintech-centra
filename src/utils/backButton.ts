import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';

interface BackHandlerEntry {
  id: string;
  onClose: () => void;
  priority: number;
  timestamp: number;
}

class BackButtonManagerImpl {
  private stack: BackHandlerEntry[] = [];
  private idCounter = 0;
  private rootHandler: (() => void) | null = null;

  /**
   * Registers a back-button handler on the LIFO stack.
   * Higher priority runs first; for equal priority, the most recently added runs first.
   */
  public register(onClose: () => void, priority = 0): () => void {
    const id = `back_${++this.idCounter}_${Date.now()}`;
    const entry: BackHandlerEntry = {
      id,
      onClose,
      priority,
      timestamp: Date.now(),
    };

    this.stack.push(entry);

    return () => {
      this.unregister(id);
    };
  }

  public unregister(id: string): void {
    this.stack = this.stack.filter(entry => entry.id !== id);
  }

  /**
   * Registers a fallback handler when the overlay stack is completely empty.
   */
  public registerRootHandler(handler: () => void): () => void {
    this.rootHandler = handler;
    return () => {
      if (this.rootHandler === handler) {
        this.rootHandler = null;
      }
    };
  }

  /**
   * Dispatches a back-button event. Returns true if handled by an overlay or root handler.
   */
  public handleBackButton(): boolean {
    if (this.stack.length > 0) {
      // Sort ascending: lower priority/older entries first, so pop() takes the highest priority / newest entry
      this.stack.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.timestamp - b.timestamp;
      });

      const top = this.stack.pop();
      if (top) {
        top.onClose();
        return true;
      }
    }

    if (this.rootHandler) {
      this.rootHandler();
      return true;
    }

    return false;
  }

  public getStackSize(): number {
    return this.stack.length;
  }

  public clear(): void {
    this.stack = [];
    this.rootHandler = null;
  }
}

export const BackButtonManager = new BackButtonManagerImpl();

/**
 * Hook to automatically register an overlay close handler with the back button stack.
 *
 * @param isOpen boolean flag whether the modal/drawer/sheet is open
 * @param onClose callback to close the overlay
 * @param priority optional priority (default 0)
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, priority = 0): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const unregister = BackButtonManager.register(() => {
      onCloseRef.current();
    }, priority);

    return () => {
      unregister();
    };
  }, [isOpen, priority]);
}

/**
 * Exits the native app (Capacitor App.exitApp)
 */
export const exitNativeApp = async (): Promise<void> => {
  try {
    await CapApp.exitApp();
  } catch {
    // exitApp is not available on web
  }
};
