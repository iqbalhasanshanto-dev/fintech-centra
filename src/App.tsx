import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { AppShell } from './components/layout/AppShell';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AuthScreen } from './components/auth/AuthScreen';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { CheckEmailScreen } from './components/auth/CheckEmailScreen';
import { AuthCallbackScreen } from './components/auth/AuthCallbackScreen';

const MainApp: React.FC = () => {
  const { authView, isLockedByPin } = useAuth();

  // PIN lock takes priority over any view
  if (isLockedByPin) return <PinLockScreen />;

  // Email-verification callback link was opened
  if (authView === 'callback') return <AuthCallbackScreen />;

  // Post-registration "check your email" holding screen
  if (authView === 'check-email') return <CheckEmailScreen />;

  // Returning user sign-in only form
  if (authView === 'login') return <AuthScreen />;

  // Intro or full 7-step onboarding flow
  if (authView === 'intro' || authView === 'onboarding') {
    return <OnboardingFlow initialView={authView} />;
  }

  // Authenticated (real session or guest) → main app
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
