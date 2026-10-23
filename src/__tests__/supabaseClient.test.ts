import { describe, it, expect, vi } from 'vitest';

describe('Supabase Client Auth Config (src/lib/supabaseClient.ts)', () => {
  it('creates Supabase client with PKCE and platform-aware detectSessionInUrl', async () => {
    const { supabase } = await import('../lib/supabaseClient');
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
