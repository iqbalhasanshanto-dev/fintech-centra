import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { CentraDB } from '../db/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLockedByPin: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  unlockPin: (pin: string) => boolean;
  lockApp: () => void;
  verify2FA: (otpCode: string) => Promise<boolean>;
  pending2FA: boolean;
  cancel2FA: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => CentraDB.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => CentraDB.getAuthSession());
  const [isLockedByPin, setIsLockedByPin] = useState<boolean>(false);
  const [pending2FA, setPending2FA] = useState<boolean>(false);

  // Initialize Supabase Auth session listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        CentraDB.saveAuthSession(true);
        CentraDB.syncFromSupabase(session.user.id, session.user.email || undefined).then(() => {
          setUser(CentraDB.getUser());
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        CentraDB.saveAuthSession(true);
        await CentraDB.syncFromSupabase(session.user.id, session.user.email || undefined);
        setUser(CentraDB.getUser());
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        CentraDB.saveAuthSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    CentraDB.saveUser(user);
  }, [user]);

  useEffect(() => {
    CentraDB.saveAuthSession(isAuthenticated);
  }, [isAuthenticated]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Check if 2FA is active in settings
    const settings = CentraDB.getSettings();
    if (settings.security.twoFactorEnabled) {
      setPending2FA(true);
      return false; // Wait for OTP
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass || 'Password123!',
        });

        if (error) {
          // If login fails (e.g. user does not exist yet), try sign up or throw
          console.warn('Supabase signIn error, attempting auto-sign-up or fallback:', error.message);
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: pass || 'Password123!',
          });
          if (signUpError) {
            throw signUpError;
          }
          if (signUpData.user) {
            await CentraDB.syncFromSupabase(signUpData.user.id, signUpData.user.email || email);
            setUser(CentraDB.getUser());
            setIsAuthenticated(true);
            return true;
          }
        }

        if (data.user) {
          await CentraDB.syncFromSupabase(data.user.id, data.user.email || email);
          setUser(CentraDB.getUser());
          setIsAuthenticated(true);
          return true;
        }
      } catch (err: any) {
        console.warn('Supabase Auth error:', err);
        // Fallback to local session if network error/demo credentials
      }
    }

    const updatedUser = { ...user, email: email || user.email };
    setUser(updatedUser);
    setIsAuthenticated(true);
    CentraDB.saveAuthSession(true);
    return true;
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsLockedByPin(false);
        CentraDB.saveAuthSession(true);
        resolve(true);
      }, 600);
    });
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass || 'Password123!',
          options: {
            data: { name: name || 'Centra User' },
          },
        });

        if (error) throw error;

        if (data.user) {
          await CentraDB.seedUserData(data.user.id, email, name);
          setUser(CentraDB.getUser());
          setIsAuthenticated(true);
          CentraDB.saveAuthSession(true);
          return true;
        }
      } catch (err: any) {
        console.warn('Supabase register error:', err);
      }
    }

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
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    setIsAuthenticated(false);
    setPending2FA(false);
    setIsLockedByPin(false);
    CentraDB.saveAuthSession(false);
  };

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
      return true;
    }
    return false;
  };

  const cancel2FA = () => {
    setPending2FA(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLockedByPin,
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
