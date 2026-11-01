import React, { useState, useEffect, useRef } from 'react';
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

export interface OnboardingDraftState {
  step: OnboardingStep;
  name?: string;
  fullName?: string;
  dob?: string;
  country?: string;
  address?: string;
  avatarUrl?: string;
  currency?: string;
  theme?: 'dark' | 'light';
  selectedCategories?: string[];
}

export const getOnboardingDraftKey = (userId?: string | null): string => {
  return `centra:onboarding_draft:${userId || 'pending'}`;
};

export const OnboardingFlow: React.FC = () => {
  const { user, logout, completeOnboarding } = useAuth();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const storageKey = getOnboardingDraftKey(user?.id);

  // Load initial draft from localStorage (checking user-specific key first, then pending fallback)
  const [draft, setDraft] = useState<OnboardingDraftState>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const key = getOnboardingDraftKey(user?.id);
        const saved = localStorage.getItem(key) || localStorage.getItem('centra:onboarding_draft:pending');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            step: STEP_ORDER.includes(parsed?.step) ? parsed.step : 'profile',
            ...parsed,
          };
        }
      }
    } catch {}
    return { step: 'profile' };
  });

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const key = getOnboardingDraftKey(user?.id);
        const saved = localStorage.getItem(key) || localStorage.getItem('centra:onboarding_draft:pending');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.step && STEP_ORDER.includes(parsed.step)) {
            return parsed.step;
          }
        }
      }
    } catch {}
    return 'profile';
  });

  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  const currentStepRef = useRef<OnboardingStep>(currentStep);
  currentStepRef.current = currentStep;

  const userIdRef = useRef<string | undefined>(user?.id);
  userIdRef.current = user?.id;

  const isFinishedRef = useRef(false);

  const updateDraft = React.useCallback((patch: Partial<OnboardingDraftState>) => {
    if (isFinishedRef.current) return;
    setDraft(prev => {
      const next: OnboardingDraftState = {
        ...prev,
        ...patch,
        step: patch.step || prev.step || currentStepRef.current,
      };
      try {
        if (typeof localStorage !== 'undefined' && !isFinishedRef.current) {
          const key = getOnboardingDraftKey(userIdRef.current);
          localStorage.setItem(key, JSON.stringify(next));
          if (userIdRef.current) {
            localStorage.setItem(`centra:onboarding_draft:${userIdRef.current}`, JSON.stringify(next));
          }
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Sync draft when user.id becomes available
  useEffect(() => {
    if (user?.id && typeof localStorage !== 'undefined') {
      try {
        const pending = localStorage.getItem('centra:onboarding_draft:pending');
        const userSpecific = localStorage.getItem(`centra:onboarding_draft:${user.id}`);
        if (!userSpecific && pending) {
          localStorage.setItem(`centra:onboarding_draft:${user.id}`, pending);
        }
      } catch {}
    }
  }, [user?.id]);

  const goToStep = (step: OnboardingStep, direction: 'forward' | 'backward' = 'forward') => {
    setTransitionDirection(direction);
    setCurrentStep(step);
    updateDraft({ step });
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
    isFinishedRef.current = true;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(storageKey);
        if (user?.id) {
          localStorage.removeItem(`centra:onboarding_draft:${user.id}`);
        }
        localStorage.removeItem('centra:onboarding_draft:pending');
        localStorage.removeItem('centra_onboarding_step');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('centra_onboarding_draft');
      }
    } catch {}
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
            onDraftChange={(profileData) => updateDraft(profileData)}
            onBack={() => setShowExitConfirm(true)}
            onContinue={(profileData) => {
              updateDraft({ ...profileData, step: 'theme' });
              goToStep('theme', 'forward');
            }}
          />
        )}

        {currentStep === 'theme' && (
          <ThemeSelectionScreen
            initialTheme={draft.theme}
            onDraftChange={(themeData) => updateDraft(themeData)}
            onBack={() => goToStep('profile', 'backward')}
            onContinue={(theme) => {
              updateDraft({ theme, step: 'categories' });
              goToStep('categories', 'forward');
            }}
          />
        )}

        {currentStep === 'categories' && (
          <SpendingCategoriesScreen
            initialCategories={draft.selectedCategories}
            onDraftChange={(catData) => updateDraft(catData)}
            onBack={() => goToStep('theme', 'backward')}
            onFinish={() => {
              handleFinishOnboarding();
            }}
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
