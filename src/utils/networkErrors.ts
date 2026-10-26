import { Network } from '@capacitor/network';
import { isNative } from './platform';

export const NO_INTERNET_ERROR_MESSAGE = 'No internet connection. Check your connection and try again.';

/**
 * Synchronous network check using browser navigator.onLine.
 */
export function isOnlineSync(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  return true;
}

/**
 * Asynchronous network check taking into account Capacitor Network status on native devices.
 */
export async function isNetworkConnected(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  if (isNative()) {
    try {
      const status = await Network.getStatus();
      if (!status.connected) {
        return false;
      }
    } catch {
      // Fallback to navigator.onLine if Network plugin throws
    }
  }

  return true;
}

/**
 * Checks if an error or exception corresponds to a network connection failure.
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  if (!error) return false;

  let name = '';
  let message = '';
  let status: number | undefined;

  if (error instanceof Error) {
    name = error.name || '';
    message = error.message || '';
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.name === 'string') name = errObj.name;
    if (typeof errObj.message === 'string') message = errObj.message;
    if (typeof errObj.status === 'number') status = errObj.status;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (name === 'AuthRetryableFetchError') {
    return true;
  }

  if (status === 0) {
    return true;
  }

  const lowerMsg = message.toLowerCase();
  return (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network request failed') ||
    lowerMsg.includes('load failed') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('net::err_') ||
    lowerMsg.includes('authretryablefetcherror') ||
    lowerMsg.includes('internet disconnected')
  );
}

/**
 * Maps any network error to the friendly user message while preserving specific auth error messages.
 */
export function getFriendlyAuthErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isNetworkError(error)) {
    return NO_INTERNET_ERROR_MESSAGE;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg;
    }
  }

  return fallbackMessage;
}
