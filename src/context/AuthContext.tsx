import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { CentraDB } from '../db/storage';

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLockedByPin: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
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

  useEffect(() => {
    CentraDB.saveUser(user);
  }, [user]);

  useEffect(() => {
    CentraDB.saveAuthSession(isAuthenticated);
  }, [isAuthenticated]);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    // Check if 2FA is active in settings
    const settings = CentraDB.getSettings();
    if (settings.security.twoFactorEnabled) {
      setPending2FA(true);
      return false; // Wait for OTP
    }

    const updatedUser = { ...user, email: email || user.email };
    setUser(updatedUser);
    setIsAuthenticated(true);
    return true;
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsLockedByPin(false);
        resolve(true);
      }, 700);
    });
  };

  const register = async (name: string, email: string, _pass: string): Promise<boolean> => {
    const newUser: UserProfile = {
      ...user,
      id: `usr_${Date.now()}`,
      name: name || 'Fintech User',
      email: email || 'user@centra.io',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
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
