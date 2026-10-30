import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileInfoScreen, ProfileDraftData } from './ProfileInfoScreen';
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
const ONBOARDING_DRAFT_STORAGE_KEY = 'centra_onboarding_draft';

export const OnboardingFlow: React.FC = () => {
  const { logout, completeOnboarding, setAuthView } = useAuth();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [draft, setDraft] = useState<ProfileDraftData>(() => {
    try {
      const saved = sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  const updateDraft = (patch: Partial<ProfileDraftData>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // When app is minimized or backgrounded during unfinished onboarding, reset draft and show accountIncomplete
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        try {
          sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
        } catch {}
        setAuthView('accountIncomplete');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setAuthView]);

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
    try {
      sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    } catch {}
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
            initialData={draft}
            onBack={() => setShowExitConfirm(true)}
            onContinue={(profileData) => {
              updateDraft(profileData);
              goToStep('theme', 'forward');
            }}
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
