import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthCallbackScreen } from '../components/auth/AuthCallbackScreen';
import { GUEST_SESSION_FLAG_KEY } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const mockSetAuthView = vi.fn();
const mockHandleSession = vi.fn();

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      setAuthView: mockSetAuthView,
      handleSession: mockHandleSession,
    }),
  };
});

vi.mock('../lib/supabaseClient', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      auth: {
        getSession: vi.fn(),
        exchangeCodeForSession: vi.fn(),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
    isSupabaseConfigured: vi.fn().mockReturnValue(true),
  };
});

describe('AuthCallbackScreen (Web PKCE Code Exchange & Clean Root URL)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('exchanges code for session if getSession returns null, calls handleSession, clears guest flag and cleans URL to /', async () => {
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');
    window.history.replaceState({}, '', '/?code=pkce-auth-code-123');

    const fakeSession = {
      user: { id: 'usr-123', email: 'test@example.com' },
      access_token: 'fake-jwt',
    };

    // First getSession returns null (detectSessionInUrl hasn't completed or PKCE required)
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
      data: { session: fakeSession as unknown, user: fakeSession.user } as unknown as { session: import('@supabase/supabase-js').Session; user: import('@supabase/supabase-js').User },
      error: null,
    });

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('pkce-auth-code-123');
    });

    await waitFor(() => {
      expect(mockHandleSession).toHaveBeenCalledWith(fakeSession);
    });

    // Clean URL to root '/'
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBeNull();
  });

  it('handles already-exchanged code error gracefully and retries getSession', async () => {
    window.history.replaceState({}, '', '/?code=already-exchanged-code');

    const fakeSession = {
      user: { id: 'usr-456', email: 'test2@example.com' },
      access_token: 'fake-jwt-2',
    };

    // getSession initially null
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // exchangeCodeForSession fails because detectSessionInUrl already consumed it
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Code already used', name: 'AuthApiError', status: 400 } as unknown as import('@supabase/supabase-js').AuthError,
    });

    // Retry getSession succeeds with session created by detectSessionInUrl
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: fakeSession as unknown as import('@supabase/supabase-js').Session },
      error: null,
    });

    render(<AuthCallbackScreen />);

    await waitFor(() => {
      expect(mockHandleSession).toHaveBeenCalledWith(fakeSession);
    });

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });

  it('navigates to signedOut if Supabase is not configured', () => {
    vi.mocked(isSupabaseConfigured).mockReturnValueOnce(false);
    render(<AuthCallbackScreen />);
    expect(mockSetAuthView).toHaveBeenCalledWith('signedOut');
  });
});
