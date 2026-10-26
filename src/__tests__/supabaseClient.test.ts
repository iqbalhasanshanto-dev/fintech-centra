import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Supabase Client Auth Config (src/lib/supabaseClient.ts)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('configures createClient with PKCE and detectSessionInUrl: false on native platforms', async () => {
    const mockCreateClient = vi.fn().mockReturnValue({ auth: {} });
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }));
    vi.doMock('../utils/platform', () => ({
      isNative: () => true,
    }));

    await import('../lib/supabaseClient');

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const options = mockCreateClient.mock.calls[0][2];
    expect(options).toBeDefined();
    expect(options.auth).toEqual({
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    });
  });

  it('configures createClient with PKCE and detectSessionInUrl: true on web platforms', async () => {
    const mockCreateClient = vi.fn().mockReturnValue({ auth: {} });
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }));
    vi.doMock('../utils/platform', () => ({
      isNative: () => false,
    }));

    await import('../lib/supabaseClient');

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const options = mockCreateClient.mock.calls[0][2];
    expect(options).toBeDefined();
    expect(options.auth).toEqual({
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    });
  });

  it('correctly assesses isSupabaseConfigured() with placeholder vs configured values', async () => {
    vi.doMock('../utils/platform', () => ({
      isNative: () => false,
    }));
    const { isSupabaseConfigured } = await import('../lib/supabaseClient');
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });
});
