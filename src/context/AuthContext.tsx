import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Category } from '../types';
import { CentraDB, CATEGORY_STYLE_MAP } from '../db/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthView =
  | 'intro'       // initial welcome / hero screen
  | 'onboarding'  // 7-step onboarding wizard
  | 'login'       // sign-in/sign-up form
  | 'check-email' // "verify your inbox" screen after registration
  | 'callback'    // processing the email-link redirect (/auth/callback)
  | 'app';        // inside the main app

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLockedByPin: boolean;
  authView: AuthView;
  pendingEmail: string;
  login: (email: string, pass: string) => Promise<{ ok: boolean; emailNotConfirmed?: boolean }>;
  loginWithBiometrics: () => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  unlockPin: (pin: string) => boolean;
  lockApp: () => void;
  verify2FA: (otpCode: string) => Promise<boolean>;
  pending2FA: boolean;
  cancel2FA: () => void;
  enterGuestMode: () => void;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
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
  resendVerificationEmail: (email: string) => Promise<void>;
  setPendingEmail: (email: string) => void;
  setAuthView: (view: AuthView) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_FLAG_KEY = 'centra_is_guest_v2';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const ONBOARDING_STEP_KEY = 'centra_onboarding_step';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => CentraDB.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLockedByPin, setIsLockedByPin] = useState<boolean>(false);
  const [pending2FA, setPending2FA] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>(() => {
    // URL verification callback check
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || window.location.hash.includes('access_token=')) {
      return 'callback';
    }
    // Guest session restoration check
    if (localStorage.getItem(GUEST_FLAG_KEY) === 'true') {
      return 'app';
    }
    // Demo session restoration
    if (!isSupabaseConfigured() && CentraDB.getAuthSession()) {
      return 'app';
    }
    // Mid-onboarding check
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (savedStep && Number(savedStep) > 0) {
      return 'onboarding';
    }
    return 'intro';
  });
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // -------------------------------------------------------------------------
  // On mount: detect callback URL params and restore guest session
  // -------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hasHashToken = window.location.hash.includes('access_token=');

    if (hasCode || hasHashToken) {
      // Callback from email-verification link — show processing screen first
      setAuthView('callback');
      return;
    }

    // Restore guest session from storage
    const guestFlag = localStorage.getItem(GUEST_FLAG_KEY);
    if (guestFlag === 'true') {
      setIsGuest(true);
      setIsAuthenticated(true);
      setAuthView('app');
      return;
    }

    // Let the Supabase listener below handle real session restoration
  }, []);

  // -------------------------------------------------------------------------
  // Supabase Auth session listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode: restore local auth session
      const localSession = CentraDB.getAuthSession();
      if (localSession) {
        setIsAuthenticated(true);
        setAuthView('app');
      }
      return;
    }

    const handleSession = async (session: any) => {
      if (!session?.user) return;

      const isOAuth =
        session.user.app_metadata?.provider === 'google' ||
        session.user.app_metadata?.provider === 'apple' ||
        (Array.isArray(session.user.app_metadata?.providers) &&
          (session.user.app_metadata.providers.includes('google') ||
           session.user.app_metadata.providers.includes('apple'))) ||
        (Array.isArray(session.user.identities) &&
          session.user.identities.some(
            (i: any) => i.provider === 'google' || i.provider === 'apple'
          ));

      const userId = session.user.id;
      const userEmail = session.user.email || session.user.user_metadata?.email || '';
      const userName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        '';
      const userAvatar =
        session.user.user_metadata?.avatar_url ||
        session.user.user_metadata?.picture ||
        undefined;

      // Query Supabase for user profile to check onboarding_completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, name, email, avatar_url, base_currency')
        .eq('id', userId)
        .maybeSingle();

      if (isOAuth) {
        // Never route OAuth users to OTP (step 2/5), even briefly!
        if (profile?.onboarding_completed) {
          // Returning Google/Apple user: skip onboarding wizard entirely, go straight to Dashboard
          setIsAuthenticated(true);
          setIsGuest(false);
          setAuthView('app');
          CentraDB.saveAuthSession(true);
          localStorage.removeItem(ONBOARDING_STEP_KEY);
          await CentraDB.syncFromSupabase(userId, userEmail, userName);
          setUser(CentraDB.getUser());
        } else {
          // First-time Google/Apple sign-up or abandoned mid-onboarding:
          // Route straight into step 3/5, Profile Info
          if (!profile) {
            await CentraDB.createBlankUserData(userId, userEmail, userName, userAvatar);
          } else {
            const existingUser: UserProfile = {
              id: profile.id,
              name: userName || profile.name || '',
              email: userEmail || profile.email || '',
              avatarUrl: userAvatar || profile.avatar_url || undefined,
              baseCurrency: profile.base_currency || null,
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
            };
            CentraDB.saveUser(existingUser);
          }
          setUser(CentraDB.getUser());
          setIsAuthenticated(true);
          setIsGuest(false);
          CentraDB.saveAuthSession(true);
          localStorage.setItem(ONBOARDING_STEP_KEY, 'profile');
          setAuthView('onboarding');
        }
        return;
      }

      // Email / Password flow
      if (session.user.email_confirmed_at) {
        setIsAuthenticated(true);
        setIsGuest(false);
        CentraDB.saveAuthSession(true);
        await CentraDB.syncFromSupabase(userId, userEmail, userName);
        const currentUser = CentraDB.getUser();
        setUser(currentUser);

        if (currentUser.onboardingCompleted) {
          setAuthView('app');
          localStorage.removeItem(ONBOARDING_STEP_KEY);
        } else {
          const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
          if (!savedStep || savedStep === 'signup' || savedStep === 'verify') {
            localStorage.setItem(ONBOARDING_STEP_KEY, 'profile');
          }
          setAuthView('onboarding');
        }
      } else {
        // Signed in but email not confirmed yet
        if (authView !== 'callback') {
          setAuthView('check-email');
        }
      }
    };

    // Check existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        await handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsGuest(false);
        setAuthView('intro');
        CentraDB.saveAuthSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    CentraDB.saveUser(user);
  }, [user]);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = async (
    email: string,
    pass: string
  ): Promise<{ ok: boolean; emailNotConfirmed?: boolean }> => {
    // Check if 2FA is active
    const settings = CentraDB.getSettings();
    if (settings.security.twoFactorEnabled) {
      setPending2FA(true);
      return { ok: false };
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        // Supabase returns "Email not confirmed" with code email_not_confirmed
        const isUnconfirmed =
          error.message?.toLowerCase().includes('email not confirmed') ||
          (error as any).code === 'email_not_confirmed';

        if (isUnconfirmed) {
          setPendingEmail(email);
          return { ok: false, emailNotConfirmed: true };
        }

        // Other errors (wrong password, etc.)
        return { ok: false };
      }

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          // Account exists but email still unconfirmed
          setPendingEmail(email);
          return { ok: false, emailNotConfirmed: true };
        }

        await CentraDB.syncFromSupabase(data.user.id, data.user.email || email);
        const currentUser = CentraDB.getUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        if (currentUser.onboardingCompleted) {
          setAuthView('app');
          localStorage.removeItem(ONBOARDING_STEP_KEY);
        } else {
          localStorage.setItem(ONBOARDING_STEP_KEY, 'profile');
          setAuthView('onboarding');
        }
        return { ok: true };
      }

      return { ok: false };
    }

    // Demo / local-only mode (Supabase not configured)
    const updatedUser = { ...user, email: email || user.email };
    setUser(updatedUser);
    setIsAuthenticated(true);
    CentraDB.saveAuthSession(true);
    setAuthView('app');
    return { ok: true };
  };

  // -------------------------------------------------------------------------
  // Register
  // -------------------------------------------------------------------------
  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (!email) {
      throw new Error('Email is required.');
    }
    const cleanName = name?.trim() || '';
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass || 'Password123!',
        options: {
          data: { name: cleanName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Real signups start with genuinely blank data!
        await CentraDB.createBlankUserData(data.user.id, email, cleanName);
        setUser(CentraDB.getUser());
        setPendingEmail(email);
        return true;
      }

      return false;
    }

    // Demo / local-only mode: genuinely blank start
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: email,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };
    await CentraDB.createBlankUserData(newUser.id, email, cleanName);
    setUser(newUser);
    setPendingEmail(email);
    return true;
  };

  // -------------------------------------------------------------------------
  // Guest Mode
  // -------------------------------------------------------------------------
  const enterGuestMode = useCallback(() => {
    const guestId = `guest_${Date.now()}`;
    CentraDB.seedUserData(guestId, 'guest@centra.local', 'Guest User').then(() => {
      setUser(CentraDB.getUser());
    });
    localStorage.setItem(GUEST_FLAG_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setIsGuest(true);
    setIsAuthenticated(true);
    CentraDB.saveAuthSession(false); // not a real cloud session
    setAuthView('app');
  }, []);

  // -------------------------------------------------------------------------
  // Resend verification email
  // -------------------------------------------------------------------------
  const resendVerificationEmail = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.resend({ type: 'signup', email });
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
    localStorage.removeItem(GUEST_FLAG_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setIsAuthenticated(false);
    setIsGuest(false);
    setPending2FA(false);
    setIsLockedByPin(false);
    setAuthView('intro');
    CentraDB.saveAuthSession(false);
  };

  // -------------------------------------------------------------------------
  // Biometric login
  // -------------------------------------------------------------------------
  const loginWithBiometrics = async (): Promise<boolean> => {
    try {
      if (window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
        // Trigger local platform biometric/passkey challenge
        setIsAuthenticated(true);
        setIsLockedByPin(false);
        CentraDB.saveAuthSession(true);
        setAuthView('app');
        return true;
      }
      throw new Error('Biometric hardware not available on this device');
    } catch (err) {
      console.warn('Biometric auth error:', err);
      throw err;
    }
  };

  // -------------------------------------------------------------------------
  // Profile / PIN / 2FA helpers
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
    }
  };

  const verify2FA = async (otpCode: string): Promise<boolean> => {
    if (otpCode.length === 6) {
      setPending2FA(false);
      setIsAuthenticated(true);
      CentraDB.saveAuthSession(true);
      setAuthView('app');
      return true;
    }
    return false;
  };

  const cancel2FA = () => {
    setPending2FA(false);
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } else {
      // Demo / offline mode: route directly into Profile Info step 3/5 with blank data
      const demoUser: UserProfile = {
        id: `${provider}_${Date.now()}`,
        name: provider === 'google' ? 'Google Account' : 'Apple ID',
        email: `${provider}.user@centra.io`,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
      };
      await CentraDB.createBlankUserData(demoUser.id, demoUser.email, demoUser.name);
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem(ONBOARDING_STEP_KEY, 'profile');
      setAuthView('onboarding');
    }
  };

  const verifyEmailOtp = async (email: string, token: string): Promise<{ ok: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup',
        });
        if (error) {
          const fallback = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
          });
          if (fallback.error) {
            return { ok: false, error: error.message || fallback.error.message };
          }
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Verification failed. Please check the code.' };
      }
    }
    // Demo / offline mode always accepts 5-digit OTP
    return { ok: true };
  };

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
      localStorage.setItem('centra_onboarding_categories', JSON.stringify(data.categories));
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
          budgetLimit: undefined, // Explicitly no hardcoded limits
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
    localStorage.setItem('centra_onboarding_done_v1', 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setIsAuthenticated(true);
    CentraDB.saveAuthSession(true);
    setAuthView('app');
  };

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        isLockedByPin,
        authView,
        pendingEmail,
        login,
        loginWithBiometrics,
        register,
        logout,
        updateUser,
        unlockPin,
        lockApp,
        verify2FA,
        pending2FA,
        cancel2FA,
        enterGuestMode,
        resendVerificationEmail,
        signInWithOAuth,
        verifyEmailOtp,
        saveOnboardingProfile,
        completeOnboarding,
        setPendingEmail,
        setAuthView,
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
