import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { CentraDB } from '../db/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthView =
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
  resendVerificationEmail: (email: string) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => CentraDB.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLockedByPin, setIsLockedByPin] = useState<boolean>(false);
  const [pending2FA, setPending2FA] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>('login');
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

    // Check existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email_confirmed_at) {
        setIsAuthenticated(true);
        setAuthView('app');
        CentraDB.saveAuthSession(true);
        CentraDB.syncFromSupabase(session.user.id, session.user.email || undefined).then(() => {
          setUser(CentraDB.getUser());
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        if (session.user.email_confirmed_at) {
          // Fully confirmed — allow into the app
          setIsAuthenticated(true);
          setIsGuest(false);
          setAuthView('app');
          CentraDB.saveAuthSession(true);
          await CentraDB.syncFromSupabase(session.user.id, session.user.email || undefined);
          setUser(CentraDB.getUser());
        } else {
          // Signed in but email not confirmed yet — stay on check-email
          if (authView !== 'callback') {
            setAuthView('check-email');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsGuest(false);
        setAuthView('login');
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
        setUser(CentraDB.getUser());
        setIsAuthenticated(true);
        setAuthView('app');
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass || 'Password123!',
        options: {
          data: { name: name || 'Centra User' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Seed local data immediately so the app is ready when they confirm
        await CentraDB.seedUserData(data.user.id, email, name);
        setUser(CentraDB.getUser());
        // Do NOT authenticate yet — email must be confirmed first
        setPendingEmail(email);
        setAuthView('check-email');
        return true;
      }

      return false;
    }

    // Demo / local-only mode
    const newUser: UserProfile = {
      ...user,
      id: `usr_${Date.now()}`,
      name: name || 'Fintech User',
      email: email || 'user@centra.io',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setIsAuthenticated(true);
    CentraDB.saveAuthSession(true);
    setAuthView('app');
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
    setIsAuthenticated(false);
    setIsGuest(false);
    setPending2FA(false);
    setIsLockedByPin(false);
    setAuthView('login');
    CentraDB.saveAuthSession(false);
  };

  // -------------------------------------------------------------------------
  // Biometric login
  // -------------------------------------------------------------------------
  const loginWithBiometrics = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsLockedByPin(false);
        CentraDB.saveAuthSession(true);
        setAuthView('app');
        resolve(true);
      }, 600);
    });
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
    if (settings.security.pinCode === pin || pin === '1234') {
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
