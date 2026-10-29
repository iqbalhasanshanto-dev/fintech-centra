import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileInfoScreen } from './ProfileInfoScreen';
import { ThemeSelectionScreen } from './ThemeSelectionScreen';
import { SpendingCategoriesScreen } from './SpendingCategoriesScreen';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useBackHandler } from '../../utils/backButton';

export type OnboardingStep =
  | 'profile'
  | 'theme'
  | 'categories';

const STEP_ORDER: OnboardingStep[] = [
  'profile',
  'theme',
  'categories',
];

const ONBOARDING_STEP_STORAGE_KEY = 'centra_onboarding_step';

export const OnboardingFlow: React.FC = () => {
  const { logout, completeOnboarding } = useAuth();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

  // Handle hardware back button during onboarding
  useBackHandler(currentStep !== 'profile', () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1], 'backward');
    }
  });

  useBackHandler(currentStep === 'profile', () => {
    setShowExitConfirm(true);
  });

  const handleFinishOnboarding = async () => {
    localStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
    await completeOnboarding();
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white transition-colors overflow-x-hidden selection:bg-[#C6FF3D] selection:text-black">
      <div
        key={currentStep}
        className={`w-full min-h-screen flex flex-col ${
          transitionDirection === 'forward'
            ? 'animate-slide-left-fade'
            : 'animate-slide-right-fade'
        }`}
      >
        {currentStep === 'profile' && (
          <ProfileInfoScreen
            onBack={() => setShowExitConfirm(true)}
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
            onFinish={handleFinishOnboarding}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={logout}
        title="Exit Setup"
        message="Sign out and exit setup?"
        type="danger"
        confirmText="Sign Out"
      />
    </div>
  );
};
