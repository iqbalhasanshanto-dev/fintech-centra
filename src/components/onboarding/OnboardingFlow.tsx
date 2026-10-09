import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileInfoScreen } from './ProfileInfoScreen';
import { ThemeSelectionScreen } from './ThemeSelectionScreen';
import { SpendingCategoriesScreen } from './SpendingCategoriesScreen';
import { AccountReadyScreen } from './AccountReadyScreen';

export type OnboardingStep =
  | 'profile'
  | 'theme'
  | 'categories'
  | 'ready';

const STEP_ORDER: OnboardingStep[] = [
  'profile',
  'theme',
  'categories',
  'ready',
];

const ONBOARDING_STEP_STORAGE_KEY = 'centra_onboarding_step';

export const OnboardingFlow: React.FC = () => {
  const { logout } = useAuth();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    const savedStep = localStorage.getItem(ONBOARDING_STEP_STORAGE_KEY);
    if (savedStep && STEP_ORDER.includes(savedStep as OnboardingStep)) {
      return savedStep as OnboardingStep;
    }
    return 'profile';
  });

  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  const goToStep = (step: OnboardingStep, direction: 'forward' | 'backward' = 'forward') => {
    setTransitionDirection(direction);
    setCurrentStep(step);
    localStorage.setItem(ONBOARDING_STEP_STORAGE_KEY, step);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex items-center justify-center transition-colors overflow-x-hidden selection:bg-teal-500 selection:text-white">
      {/* Desktop Ambient Background Accents */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="w-full h-full min-h-screen md:min-h-[720px] md:h-auto md:max-w-lg lg:max-w-xl md:my-8 bg-white dark:bg-[#0D1220] md:rounded-[36px] md:border md:border-gray-200/80 md:dark:border-[#1e263c] md:shadow-2xl md:shadow-black/20 flex flex-col justify-between relative overflow-hidden transition-all">
        <div
          key={currentStep}
          className={`w-full flex-1 flex flex-col justify-between ${
            transitionDirection === 'forward'
              ? 'animate-slide-left-fade'
              : 'animate-slide-right-fade'
          }`}
        >
          {currentStep === 'profile' && (
            <ProfileInfoScreen
              onBack={() => {
                if (window.confirm('Sign out and exit setup?')) {
                  logout();
                }
              }}
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
