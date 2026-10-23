import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Category, Account } from '../types';
import { CentraDB, CATEGORY_STYLE_MAP, DEFAULT_INCOME_CATEGORIES_DEFINITIONS } from '../db/storage';
import { OutboxQueue } from '../db/outbox';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { hasDevicePin, verifyDevicePin } from '../utils/pinLock';
import { getAuthRedirectUrl } from '../utils/authRedirect';
import { isNative } from '../utils/platform';
import { startNativeOAuth, handleNativeDeepLink } from '../utils/nativeOAuth';
import { initNativeApp } from '../utils/nativeApp';
import { BackButtonManager } from '../utils/backButton';

// ---------------------------------------------------------------------------
// Types & State Machine
// ---------------------------------------------------------------------------

export type AuthState =
  | 'loading'           // Cold start resolving session (splash screen)
  | 'signedOut'         // Landing screen (Sign in / Create account)
  | 'otp'               // 6-digit OTP verification screen
  | 'onboarding'        // Setup wizard (Profile info, currency, theme, categories)
  | 'locked'            // App lock screen (PIN lock)
  | 'app'               // Authenticated user in the app
  | 'guest'             // Local-only demo user
  | 'accountIncomplete' // Email sign-in when account onboarding is incomplete
  | 'noAccountFound'    // OAuth sign-in when no completed account exists
  | 'profileError';     // Profile fetch failed -> Safe retry screen

export type AuthView = AuthState;
export type AuthMode = 'signin' | 'signup';

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLockedByPin: boolean;
  authView: AuthState;
  authMode: AuthMode;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  setAuthMode: (mode: AuthMode) => void;
  setAuthView: (view: AuthState) => void;
  sendOtp: (email: string, mode?: AuthMode) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple', mode?: AuthMode) => Promise<void>;
  retryProfileFetch: () => Promise<void>;
  enterGuestMode: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  unlockPin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
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
  createAccountFromGuest: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_FLAG_KEY = 'centra_is_guest_v2';
const INTENT_STORAGE_KEY = 'centra_auth_intent';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => CentraDB.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLockedByPin, setIsLockedByPin] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authView, setAuthView] = useState<AuthState>('loading');

  const lastUserIdRef = useRef<string | null>(null);

  const lockApp = useCallback(() => {
    setIsLockedByPin(true);
    setAuthView('locked');
  }, []);

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

    // Read and clear stored OAuth intent if present
    const storedIntent = localStorage.getItem(INTENT_STORAGE_KEY) as AuthMode | null;
    if (storedIntent) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
    }
    const effectiveMode = storedIntent || authMode;

    try {
      const { data: initialProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, name, email, avatar_url, base_currency')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        console.warn('Profile fetch error from Supabase:', profileErr);
        setAuthView('profileError');
        return;
      }

      let profile = initialProfile;

      let isNewUser = false;

      // If profile row is missing after login, create it with insert-if-missing and treat as NEW
      if (!profile) {
        const userAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
        const { data: newProfile, error: insertProfileErr } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: userName || '',
            email: userEmail || null,
            avatar_url: userAvatar,
            base_currency: null,
            is_pro: false,
            plan_expiry: null,
            onboarding_completed: false,
          })
          .select('id, onboarding_completed, name, email, avatar_url, base_currency')
          .maybeSingle();

        if (insertProfileErr) {
          console.warn('Insert-if-missing profile error:', insertProfileErr);
        } else {
          profile = newProfile;
        }
        isNewUser = true;
      }

      // Ensure settings row exists (insert-if-missing)
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingSettings) {
        await supabase.from('settings').upsert({
          user_id: userId,
          id: `settings_${userId}`,
          theme: 'light',
          base_currency: null,
          privacy_mode: false,
          security: { biometricEnabled: false, pinLockEnabled: false },
          notifications: {
            transactionAlerts: true,
            budgetOverruns: true,
            securityAlerts: true,
            billReminders: true,
            weeklyDigest: true,
          },
        }, { onConflict: 'user_id' });
      }

      // If user is existing and has completed onboarding, go straight to main app
      if (!isNewUser && profile?.onboarding_completed) {
        await CentraDB.syncFromSupabase(userId, userEmail, userName);
        const currentUser = CentraDB.getUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        setIsGuest(false);

        // Cold start lock trigger
        const settings = CentraDB.getSettings();
        if (settings.security.pinLockEnabled && hasDevicePin(userId)) {
          lockApp();
        } else {
          setAuthView('app');
        }
        return;
      }

      // User is either newly created or has not completed onboarding
      setIsAuthenticated(true);
      setIsGuest(false);

      if (effectiveMode === 'signin' && !isNewUser) {
        const isOAuth =
          session.user.app_metadata?.provider === 'google' ||
          session.user.app_metadata?.provider === 'apple';

        if (isOAuth) {
          // Google/Apple user on sign-in with no completed account
          setAuthView('noAccountFound');
        } else {
          // Email user on sign-in with incomplete account
          setAuthView('accountIncomplete');
        }
      } else {
        // Sign-up intent or brand-new user missing profile: proceed into onboarding wizard
        await CentraDB.createBlankUserData(userId, userEmail, userName);
        setUser(CentraDB.getUser());
        setAuthView('onboarding');
      }
    } catch (err) {
      console.warn('Failed to resolve user profile:', err);
      setAuthView('profileError');
    }
  }, [authMode]);

  // -------------------------------------------------------------------------
  // Retry profile fetch (for ProfileErrorScreen)
  // -------------------------------------------------------------------------
  const retryProfileFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleSession(session);
      } else {
        setAuthView('signedOut');
      }
    } catch {
      setAuthView('profileError');
    }
  };

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
      setTimeout(() => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
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
  // Send Email OTP (Distinct Sign in vs Create account)
  // -------------------------------------------------------------------------
  const sendOtp = async (email: string, mode?: AuthMode): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase backend is not configured.' };
    }

    const currentMode = mode || authMode;
    const shouldCreate = currentMode === 'signup';

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: shouldCreate,
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.log('[Dev Auth] signInWithOtp response error:', {
            mode: currentMode,
            shouldCreateUser: shouldCreate,
            status: (error as any).status,
            name: error.name,
            message: error.message,
          });
        }

        // On Sign in mode, never reveal account enumeration:
        // If user does not exist (status 422 or signup prevented message), treat as neutral success
        const isUserNotFoundOrSignupPrevented =
          !shouldCreate &&
          ((error as any).status === 422 ||
            (error as any).code === 'otp_disabled' ||
            (error as any).code === 'user_not_found' ||
            error.message?.toLowerCase().includes('signups not allowed') ||
            error.message?.toLowerCase().includes('user not found'));

        if (isUserNotFoundOrSignupPrevented) {
          setPendingEmail(cleanEmail);
          setAuthMode('signin');
          setAuthView('otp');
          return { ok: true };
        }

        return { ok: false, error: error.message };
      }

      setPendingEmail(cleanEmail);
      setAuthMode(currentMode);
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

      const activeSession = data.session || (await supabase.auth.getSession()).data.session;
      if (activeSession) {
        await handleSession(activeSession);
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
    return sendOtp(email, authMode);
  };

  // -------------------------------------------------------------------------
  // OAuth (Google / Apple) with intent tracking
  // -------------------------------------------------------------------------
  const signInWithOAuth = async (provider: 'google' | 'apple', mode?: AuthMode) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase backend is not configured.');
    }

    const currentMode = mode || authMode;

    if (isNative()) {
      await startNativeOAuth(provider, currentMode);
      return;
    }

    // Store intent in localStorage to survive the web OAuth redirect
    localStorage.setItem(INTENT_STORAGE_KEY, currentMode);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
      throw error;
    }
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

    CentraDB.clearAllData();
    setUser(CentraDB.getUser());
    lastUserIdRef.current = null;
    setIsAuthenticated(false);
    setIsGuest(false);
    setIsLockedByPin(false);
    setPendingEmail('');
    setAuthMode('signin');
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

  const unlockPin = async (pin: string): Promise<{ ok: boolean; error?: string }> => {
    const activeUid = lastUserIdRef.current || CentraDB.getUser()?.id || 'guest';
    const result = await verifyDevicePin(activeUid, pin);
    if (result.ok) {
      setIsLockedByPin(false);
      setAuthView('app');
      return { ok: true };
    }
    if (result.maxAttemptsExceeded) {
      await logout();
      return { ok: false, error: result.error };
    }
    return { ok: false, error: result.error };
  };

  // Background lock trigger (5 minutes timeout when app/tab is backgrounded)
  useEffect(() => {
    let hiddenTimestamp: number | null = null;
    const BACKGROUND_TIMEOUT_MS = 5 * 60 * 1000;

    const checkAndTriggerLock = () => {
      if (hiddenTimestamp && Date.now() - hiddenTimestamp >= BACKGROUND_TIMEOUT_MS) {
        const activeUid = lastUserIdRef.current || CentraDB.getUser()?.id;
        if (activeUid && activeUid !== 'guest') {
          const settings = CentraDB.getSettings();
          if (settings.security.pinLockEnabled && hasDevicePin(activeUid)) {
            lockApp();
          }
        }
      }
      hiddenTimestamp = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible') {
        checkAndTriggerLock();
      }
    };

    // Tauri Desktop window minimization / blur lock support
    const handleWindowBlur = () => {
      if (!hiddenTimestamp) {
        hiddenTimestamp = Date.now();
      }
    };
    const handleWindowFocus = () => {
      checkAndTriggerLock();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Native mobile app initialization (Capacitor)
    let cleanupNative: (() => Promise<void>) | null = null;
    if (isNative()) {
      initNativeApp({
        onUrlOpen: async (url: string) => {
          await handleNativeDeepLink(url, {
            onSuccess: async (session) => {
              if (session?.user) {
                await handleSession(session);
              }
            },
            onError: (err) => {
              console.warn('Native deep link error:', err);
            },
          });
        },
        onAppStateChange: (isActive: boolean) => {
          if (!isActive) {
            hiddenTimestamp = Date.now();
          } else {
            checkAndTriggerLock();
          }
        },
        onBackButton: () => {
          BackButtonManager.handleBackButton();
        },
      }).then(cleanup => {
        cleanupNative = cleanup;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (cleanupNative) {
        cleanupNative();
      }
    };
  }, [handleSession, lockApp]);

  const isCompletingRef = useRef(false);

  const createAccountFromGuest = useCallback(() => {
    CentraDB.clearGuestNamespace();
    setIsGuest(false);
    setIsAuthenticated(false);
    setIsLockedByPin(false);
    setPendingEmail('');
    setAuthMode('signup');
    setAuthView('signedOut');
  }, []);

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
      // 1. Load user's existing categories (idempotency: never duplicate category with same name & type)
      const currentCategories = [...CentraDB.getCategories()];
      const newCategoriesToAdd: Category[] = [];

      // Sensible default expense categories if user selected none
      const selectedOrDefaults = (data.categories && data.categories.length > 0)
        ? data.categories
        : ['Groceries', 'Food & Drinks', 'Bills & Utilities', 'Shopping', 'Transport'];

      for (const catName of selectedOrDefaults) {
        const nameLower = catName.trim().toLowerCase();
        const alreadyExists = currentCategories.some(
          c => c.name.trim().toLowerCase() === nameLower && c.type === 'expense'
        );
        if (!alreadyExists) {
          const meta = CATEGORY_STYLE_MAP[catName] || {
            icon: 'Tag',
            color: '#6366F1',
            type: 'expense' as const,
          };
          const newCat: Category = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: catName.trim(),
            icon: meta.icon,
            color: meta.color,
            type: 'expense',
            hidden: false,
          };
          newCategoriesToAdd.push(newCat);
          currentCategories.push(newCat);
        }
      }

      // Normal pickable income categories (Salary, Freelance, Investment)
      for (const inc of DEFAULT_INCOME_CATEGORIES_DEFINITIONS) {
        const incNameLower = inc.name.trim().toLowerCase();
        const alreadyExists = currentCategories.some(
          c => c.name.trim().toLowerCase() === incNameLower && c.type === 'income'
        );
        if (!alreadyExists) {
          const newIncCat: Category = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat_inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: inc.name,
            icon: inc.icon,
            color: inc.color,
            type: 'income',
            hidden: false,
          };
          newCategoriesToAdd.push(newIncCat);
          currentCategories.push(newIncCat);
        }
      }

      // Save categories locally
      await CentraDB.saveCategories(currentCategories);

      // Ensure hidden system categories (transfer, goal_contribution, uncategorized)
      await CentraDB.ensureSystemCategories(user?.id);

      // If user is real/logged in, enqueue new custom categories to outbox as a group
      if (newCategoriesToAdd.length > 0 && user?.id && !isGuest) {
        const outboxItems = newCategoriesToAdd.map(cat => ({
          userId: user.id,
          entity: 'categories' as const,
          op: 'upsert' as const,
          recordId: cat.id,
          payload: {
            id: cat.id,
            user_id: user.id,
            system_key: cat.systemKey || null,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
            budget_limit: cat.budgetLimit || null,
            updated_at: new Date().toISOString(),
          },
        }));
        OutboxQueue.enqueueGroup(outboxItems);
      }
    }
  };

  const completeOnboarding = async () => {
    // Idempotency guard against double-submits of the last step
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    try {
      // 1. Ensure accounts exist: never create a second default Cash account if the user already has an account
      const existingAccounts = CentraDB.getAccounts();
      if (existingAccounts.length === 0) {
        const defaultCash: Account = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`,
          name: 'Cash',
          type: 'cash',
          balance: 0,
          currency: user?.baseCurrency || 'USD',
          accountNumberMasked: '•••• CASH',
          bankName: 'Physical Cash',
          color: '#10B981',
          isPrimary: true,
        };
        await CentraDB.saveAccounts([defaultCash]);
        if (user?.id && !isGuest) {
          OutboxQueue.enqueue({
            userId: user.id,
            entity: 'accounts',
            op: 'upsert',
            recordId: defaultCash.id,
            payload: {
              id: defaultCash.id,
              user_id: user.id,
              name: defaultCash.name,
              type: defaultCash.type,
              balance: defaultCash.balance,
              currency: defaultCash.currency,
              account_number_masked: defaultCash.accountNumberMasked,
              bank_name: defaultCash.bankName,
              color: defaultCash.color,
              is_primary: true,
              updated_at: new Date().toISOString(),
            },
          });
        }
      }

      // 2. Ensure system categories exist
      await CentraDB.ensureSystemCategories(user?.id);

      // 3. Mark completed in DB
      if (user?.id && !isGuest) {
        const ok = await CentraDB.markOnboardingCompleted(user.id);
        if (!ok) {
          throw new Error('Failed to save completed setup status. Please retry.');
        }
        setUser(prev => ({ ...prev, onboardingCompleted: true }));
      }
      setIsAuthenticated(true);
      setAuthView('app');
    } finally {
      isCompletingRef.current = false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        isLockedByPin,
        authView,
        authMode,
        pendingEmail,
        setPendingEmail,
        setAuthMode,
        setAuthView,
        sendOtp,
        verifyOtp,
        resendOtp,
        signInWithOAuth,
        retryProfileFetch,
        enterGuestMode,
        logout,
        updateUser,
        unlockPin,
        lockApp,
        saveOnboardingProfile,
        completeOnboarding,
        createAccountFromGuest,
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
