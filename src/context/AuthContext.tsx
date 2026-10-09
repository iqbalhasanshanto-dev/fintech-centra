import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Category } from '../types';
import { CentraDB, CATEGORY_STYLE_MAP } from '../db/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Types & State Machine
// ---------------------------------------------------------------------------

export type AuthState =
  | 'loading'     // Cold start resolving session (splash screen)
  | 'signedOut'   // Landing screen (Google, Apple, Email OTP)
  | 'otp'         // 6-digit OTP verification screen
  | 'onboarding'  // Setup wizard (Profile info, currency, theme, categories)
  | 'locked'      // App lock screen (PIN lock)
  | 'app'         // Authenticated user in the app
  | 'guest';      // Local-only demo user

export type AuthView = AuthState;

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLockedByPin: boolean;
  authView: AuthState;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  setAuthView: (view: AuthState) => void;
  sendOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  enterGuestMode: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  unlockPin: (pin: string) => boolean;
  lockApp: () => void;
  saveOnboardingProfile: (data: {
    name: string;
    dob?: string;
    country?: string;
    address?: string;
    avatarUrl?: string;
    currency?: any;
    theme?: 'dark' | 'light';
    categories?: string[];
  }) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_FLAG_KEY = 'centra_is_guest_v2';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => CentraDB.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLockedByPin, setIsLockedByPin] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [authView, setAuthView] = useState<AuthState>('loading');

  const lastUserIdRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // Handle authenticated session and route appropriately
  // -------------------------------------------------------------------------
  const handleSession = useCallback(async (session: any) => {
    if (!session?.user) return;

    const userId = session.user.id;
    const userEmail = session.user.email || session.user.user_metadata?.email || '';
    const userName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      '';

    lastUserIdRef.current = userId;

    // Check onboarding status once from Supabase profile
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, name, email, avatar_url, base_currency')
        .eq('id', userId)
        .maybeSingle();

      await CentraDB.syncFromSupabase(userId, userEmail, userName);
      const currentUser = CentraDB.getUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsGuest(false);

      if (profile?.onboarding_completed) {
        setAuthView('app');
      } else {
        setAuthView('onboarding');
      }
    } catch (err) {
      console.warn('Failed to resolve user profile:', err);
      // Fallback: stay authenticated and proceed to app
      setIsAuthenticated(true);
      setIsGuest(false);
      setAuthView('app');
    }
  }, []);

  // -------------------------------------------------------------------------
  // Cold start initialization
  // -------------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      // 1. Guest mode check
      const isGuestMode = localStorage.getItem(GUEST_FLAG_KEY) === 'true';
      if (isGuestMode) {
        setIsGuest(true);
        setIsAuthenticated(true);
        setAuthView('guest');
        return;
      }

      // 2. Supabase configuration check
      if (!isSupabaseConfigured()) {
        setAuthView('signedOut');
        return;
      }

      // 3. Supabase session check
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleSession(session);
        } else {
          setAuthView('signedOut');
        }
      } catch (err) {
        console.warn('Cold start getSession error:', err);
        setAuthView('signedOut');
      }
    };

    initAuth();
  }, [handleSession]);

  // -------------------------------------------------------------------------
  // Supabase Auth listener (non-blocking handoff, skip redundant syncs)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Hand off asynchronously via setTimeout to avoid awaiting in callback
      setTimeout(() => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Skip redundant full syncs if user hasn't changed and already active
          if (lastUserIdRef.current === session.user.id && (authView === 'app' || authView === 'guest')) {
            return;
          }
          handleSession(session);
        } else if (event === 'SIGNED_OUT') {
          lastUserIdRef.current = null;
          setIsAuthenticated(false);
          setIsGuest(false);
          setPendingEmail('');
          setAuthView('signedOut');
          CentraDB.clearAllData();
          setUser(CentraDB.getUser());
        }
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [authView, handleSession]);

  // Keep local user persistence in sync
  useEffect(() => {
    if (user && user.id) {
      CentraDB.saveUser(user);
    }
  }, [user]);

  // -------------------------------------------------------------------------
  // Send Email OTP
  // -------------------------------------------------------------------------
  const sendOtp = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase backend is not configured.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      setPendingEmail(cleanEmail);
      setAuthView('otp');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to send verification code.' };
    }
  };

  // -------------------------------------------------------------------------
  // Verify Email OTP
  // -------------------------------------------------------------------------
  const verifyOtp = async (email: string, token: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail || !cleanToken) {
      return { ok: false, error: 'Email and 6-digit code are required.' };
    }

    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase backend is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.session) {
        await handleSession(data.session);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await handleSession(sessionData.session);
        }
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Verification failed. Please try again.' };
    }
  };

  // -------------------------------------------------------------------------
  // Resend OTP
  // -------------------------------------------------------------------------
  const resendOtp = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    return sendOtp(email);
  };

  // -------------------------------------------------------------------------
  // OAuth (Google / Apple)
  // -------------------------------------------------------------------------
  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase backend is not configured.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  // -------------------------------------------------------------------------
  // Guest Mode (Explicit local-only demo)
  // -------------------------------------------------------------------------
  const enterGuestMode = useCallback(() => {
    const guestId = `guest_${Date.now()}`;
    CentraDB.seedUserData(guestId, 'guest@centra.local', 'Guest User').then(() => {
      setUser(CentraDB.getUser());
    });
    localStorage.setItem(GUEST_FLAG_KEY, 'true');
    setIsGuest(true);
    setIsAuthenticated(true);
    setAuthView('guest');
  }, []);

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    // Clear all centra_* localStorage keys and local cache
    CentraDB.clearAllData();
    setUser(CentraDB.getUser());
    lastUserIdRef.current = null;
    setIsAuthenticated(false);
    setIsGuest(false);
    setIsLockedByPin(false);
    setPendingEmail('');
    setAuthView('signedOut');
  };

  // -------------------------------------------------------------------------
  // User Profile, PIN Lock Stubs (Phase 2)
  // -------------------------------------------------------------------------
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      CentraDB.saveUser(next);
      return next;
    });
  };

  const unlockPin = (pin: string): boolean => {
    const settings = CentraDB.getSettings();
    const targetPin = settings.security.pinCode || '1234';
    if (pin === targetPin) {
      setIsLockedByPin(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    const settings = CentraDB.getSettings();
    if (settings.security.pinLockEnabled) {
      setIsLockedByPin(true);
      setAuthView('locked');
    }
  };

  // -------------------------------------------------------------------------
  // Onboarding Helpers
  // -------------------------------------------------------------------------
  const saveOnboardingProfile = async (data: {
    name: string;
    dob?: string;
    country?: string;
    address?: string;
    avatarUrl?: string;
    currency?: any;
    theme?: 'dark' | 'light';
    categories?: string[];
  }) => {
    const updatedUser: UserProfile = {
      ...user,
      name: data.name || user.name,
      avatarUrl: data.avatarUrl || user.avatarUrl,
      baseCurrency: data.currency || user.baseCurrency,
    };
    setUser(updatedUser);
    await CentraDB.saveUser(updatedUser);

    const currentSettings = CentraDB.getSettings();
    const updatedSettings = {
      ...currentSettings,
      baseCurrency: data.currency || currentSettings.baseCurrency,
      theme: data.theme || currentSettings.theme,
    };
    await CentraDB.saveSettings(updatedSettings);

    if (data.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (data.theme === 'light') {
      document.documentElement.classList.remove('dark');
    }

    if (data.categories !== undefined) {
      const defaultIncomeAndSystemCategories: Category[] = [
        { id: 'cat_salary', name: 'Salary & Wages', icon: 'Briefcase', color: '#1FAE71', type: 'income' },
        { id: 'cat_freelance', name: 'Freelance & Bonus', icon: 'TrendingUp', color: '#00B894', type: 'income' },
        { id: 'cat_invest_inc', name: 'Dividends & Yield', icon: 'Coins', color: '#55EFC4', type: 'income' },
        { id: 'cat_transfer', name: 'Transfer & Payment', icon: 'ArrowRightLeft', color: '#636E72', type: 'expense' },
      ];
      const expenseCategories: Category[] = (data.categories || []).map((catName, index) => {
        const meta = CATEGORY_STYLE_MAP[catName] || {
          icon: 'Tag',
          color: '#6366F1',
          type: 'expense' as const,
        };
        return {
          id: `cat_${catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`,
          name: catName,
          icon: meta.icon,
          color: meta.color,
          type: meta.type,
          budgetLimit: undefined,
        };
      });
      const categories: Category[] = [...expenseCategories, ...defaultIncomeAndSystemCategories];
      await CentraDB.saveCategories(categories);
    }
  };

  const completeOnboarding = async () => {
    if (user?.id) {
      await CentraDB.markOnboardingCompleted(user.id);
      setUser(prev => ({ ...prev, onboardingCompleted: true }));
    }
    setIsAuthenticated(true);
    setAuthView('app');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        isLockedByPin,
        authView,
        pendingEmail,
        setPendingEmail,
        setAuthView,
        sendOtp,
        verifyOtp,
        resendOtp,
        signInWithOAuth,
        enterGuestMode,
        logout,
        updateUser,
        unlockPin,
        lockApp,
        saveOnboardingProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
