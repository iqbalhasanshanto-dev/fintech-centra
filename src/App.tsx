import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { AppShell } from './components/layout/AppShell';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { IntroScreen } from './components/onboarding/IntroScreen';
import { OtpScreen } from './components/auth/OtpScreen';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { AuthCallbackScreen } from './components/auth/AuthCallbackScreen';
import { LoadingSplashScreen } from './components/auth/LoadingSplashScreen';
import { SupabaseConfigErrorScreen } from './components/auth/SupabaseConfigErrorScreen';
import { NoAccountFoundScreen } from './components/auth/NoAccountFoundScreen';
import { AccountIncompleteScreen } from './components/auth/AccountIncompleteScreen';
import { ProfileErrorScreen } from './components/auth/ProfileErrorScreen';
import { isSupabaseConfigured } from './lib/supabaseClient';

const MainApp: React.FC = () => {
  const { authView, isLockedByPin } = useAuth();

  // If Supabase backend is missing and user is not in guest mode
  if (!isSupabaseConfigured() && authView !== 'guest') {
    return <SupabaseConfigErrorScreen />;
  }

  // App lock state (PIN lock)
  if (isLockedByPin || authView === 'locked') {
    return <PinLockScreen />;
  }

  // OAuth return callback detected in URL
  const params = new URLSearchParams(window.location.search);
  const hasCallbackCode = params.has('code') || window.location.hash.includes('access_token=');
  if (hasCallbackCode) {
    return <AuthCallbackScreen />;
  }

  // Cold start resolving session (splash screen)
  if (authView === 'loading') {
    return <LoadingSplashScreen />;
  }

  // Profile fetch failed -> Safe retry screen
  if (authView === 'profileError') {
    return <ProfileErrorScreen />;
  }

  // OAuth sign-in when no completed account exists
  if (authView === 'noAccountFound') {
    return <NoAccountFoundScreen />;
  }

  // Email sign-in when onboarding setup is not completed
  if (authView === 'accountIncomplete') {
    return <AccountIncompleteScreen />;
  }

  // Email OTP verification screen
  if (authView === 'otp') {
    return <OtpScreen />;
  }

  // Landing screen (Sign in / Create account tabs)
  if (authView === 'signedOut') {
    return <IntroScreen />;
  }

  // Setup wizard for users who haven't completed onboarding
  if (authView === 'onboarding') {
    return <OnboardingFlow />;
  }

  // Authenticated user (or guest demo) inside main app
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
