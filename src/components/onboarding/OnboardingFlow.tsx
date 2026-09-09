import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IntroScreen } from './IntroScreen';
import { CreateAccountScreen } from './CreateAccountScreen';
import { VerifyEmailScreen } from './VerifyEmailScreen';
import { ProfileInfoScreen } from './ProfileInfoScreen';
import { ThemeSelectionScreen } from './ThemeSelectionScreen';
import { SpendingCategoriesScreen } from './SpendingCategoriesScreen';
import { AccountReadyScreen } from './AccountReadyScreen';
import logoImg from '../../assets/brand/logo.png';
import { ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export type OnboardingStep =
  | 'intro'
  | 'signup'
  | 'verify'
  | 'profile'
  | 'theme'
  | 'categories'
  | 'ready';

const STEP_ORDER: OnboardingStep[] = [
  'intro',
  'signup',
  'verify',
  'profile',
  'theme',
  'categories',
  'ready',
];

const ONBOARDING_STEP_STORAGE_KEY = 'centra_onboarding_step';
const ONBOARDING_EMAIL_STORAGE_KEY = 'centra_pending_onboarding_email';

interface OnboardingFlowProps {
  initialView?: 'intro' | 'onboarding';
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ initialView = 'intro' }) => {
  const { setAuthView, pendingEmail, setPendingEmail } = useAuth();

  // Restore step from localStorage if returning user was mid-onboarding
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    const savedStep = localStorage.getItem(ONBOARDING_STEP_STORAGE_KEY);
    if (savedStep && STEP_ORDER.includes(savedStep as OnboardingStep)) {
      // If user had reached signup or beyond, resume there
      return savedStep as OnboardingStep;
    }
    return initialView === 'onboarding' ? 'signup' : 'intro';
  });

  const [signupEmail, setSignupEmail] = useState<string>(() => {
    return (
      pendingEmail ||
      localStorage.getItem(ONBOARDING_EMAIL_STORAGE_KEY) ||
      ''
    );
  });

  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  // Sync step to localStorage
  const goToStep = (step: OnboardingStep, direction: 'forward' | 'backward' = 'forward') => {
    setTransitionDirection(direction);
    setCurrentStep(step);

    if (step === 'intro') {
      localStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
    } else {
      localStorage.setItem(ONBOARDING_STEP_STORAGE_KEY, step);
    }
  };

  const handleSignedUp = (email: string) => {
    setSignupEmail(email);
    setPendingEmail(email);
    localStorage.setItem(ONBOARDING_EMAIL_STORAGE_KEY, email);
    goToStep('verify', 'forward');
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex items-center justify-center transition-colors overflow-x-hidden selection:bg-teal-500 selection:text-white">
      {/* Desktop Ambient Background Accents */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container: Mobile is edge-to-edge native app feel; Desktop is centered sleek app container */}
      <div className="w-full h-full min-h-screen md:min-h-[720px] md:h-auto md:max-w-lg lg:max-w-xl md:my-8 bg-white dark:bg-[#0D1220] md:rounded-[36px] md:border md:border-gray-200/80 md:dark:border-[#1e263c] md:shadow-2xl md:shadow-black/20 flex flex-col justify-between relative overflow-hidden transition-all">
        
        {/* Animated Step Container with Slide & Fade Transitions */}
        <div
          key={currentStep}
          className={`w-full flex-1 flex flex-col justify-between ${
            transitionDirection === 'forward'
              ? 'animate-slide-left-fade'
              : 'animate-slide-right-fade'
          }`}
        >
          {currentStep === 'intro' && (
            <IntroScreen
              onGetStarted={() => goToStep('signup', 'forward')}
              onSignIn={() => setAuthView('login')}
            />
          )}

          {currentStep === 'signup' && (
            <CreateAccountScreen
              onBack={() => goToStep('intro', 'backward')}
              onSignedUp={handleSignedUp}
              onSwitchToSignIn={() => setAuthView('login')}
            />
          )}

          {currentStep === 'verify' && (
            <VerifyEmailScreen
              email={signupEmail}
              onBack={() => goToStep('signup', 'backward')}
              onVerified={() => goToStep('profile', 'forward')}
            />
          )}

          {currentStep === 'profile' && (
            <ProfileInfoScreen
              onBack={() => goToStep('verify', 'backward')}
              onContinue={() => goToStep('theme', 'forward')}
            />
          )}

          {currentStep === 'theme' && (
            <ThemeSelectionScreen
              onBack={() => goToStep('profile', 'backward')}
              onContinue={() => goToStep('categories', 'forward')}
            />
          )}

          {currentStep === 'categories' && (
            <SpendingCategoriesScreen
              onBack={() => goToStep('theme', 'backward')}
              onFinish={() => goToStep('ready', 'forward')}
            />
          )}

          {currentStep === 'ready' && <AccountReadyScreen />}
        </div>
      </div>
    </div>
  );
};
