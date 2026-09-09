import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CurrencyCode } from '../../types';
import { IntroStep } from './steps/IntroStep';
import { SignUpStep } from './steps/SignUpStep';
import { VerifyEmailStep } from './steps/VerifyEmailStep';
import { ProfileInfoStep } from './steps/ProfileInfoStep';
import { ThemeSelectionStep } from './steps/ThemeSelectionStep';
import { CategoriesStep } from './steps/CategoriesStep';
import { AccountReadyStep } from './steps/AccountReadyStep';
import { SignInModal } from './SignInModal';
import { CentraLogo } from './CentraLogo';
import { ShieldCheck, Sparkles, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';

export type OnboardingStepId =
  | 'intro'
  | 'signup'
  | 'verify'
  | 'profile'
  | 'theme'
  | 'categories'
  | 'ready';

export const OnboardingFlow: React.FC = () => {
  const {
    enterGuestMode,
    saveOnboardingProfile,
    completeOnboarding,
    setAuthView,
    pendingEmail,
    setPendingEmail,
  } = useAuth();

  const [currentStep, setCurrentStep] = useState<OnboardingStepId>('intro');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);

  // Collected onboarding state
  const [email, setEmail] = useState<string>(pendingEmail || '');
  const [profileData, setProfileData] = useState<{
    name: string;
    dob: string;
    country: string;
    currency: CurrencyCode;
    address: string;
    avatarUrl: string;
  }>({
    name: '',
    dob: '2000-01-01',
    country: 'Bangladesh',
    currency: 'BDT',
    address: '',
    avatarUrl: '',
  });
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Food & Drinks',
    'Shopping',
    'Bills & Utilities',
  ]);

  const goToStep = (step: OnboardingStepId, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir);
    setCurrentStep(step);
  };

  // Step 1 -> Step 2
  const handleSignedUp = (userEmail: string) => {
    setEmail(userEmail);
    setPendingEmail(userEmail);
    goToStep('verify', 'forward');
  };

  // Step 2 -> Step 3
  const handleVerified = () => {
    goToStep('profile', 'forward');
  };

  // Step 3 -> Step 4
  const handleProfileContinue = (data: typeof profileData) => {
    setProfileData(data);
    goToStep('theme', 'forward');
  };

  // Step 4 Theme Selection
  const handleSelectTheme = (theme: 'dark' | 'light') => {
    setSelectedTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Step 4 -> Step 5
  const handleThemeContinue = () => {
    goToStep('categories', 'forward');
  };

  // Step 5 Categories Toggle
  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Step 5 -> Step 6 (Account Ready)
  const handleCategoriesFinish = async () => {
    try {
      // Persist all gathered onboarding state
      await saveOnboardingProfile({
        name: profileData.name || 'Centra User',
        dob: profileData.dob,
        country: profileData.country,
        address: profileData.address,
        avatarUrl: profileData.avatarUrl,
        currency: profileData.currency,
        theme: selectedTheme,
        categories: selectedCategories,
      });
    } catch (err) {
      console.warn('saveOnboardingProfile note:', err);
    }
    goToStep('ready', 'forward');
  };

  // Final step completion -> Dashboard
  const handleOnboardingComplete = async () => {
    await completeOnboarding();
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAFAFA] dark:bg-[#0b0d14] text-gray-900 dark:text-[#f8fafc] flex flex-col justify-center items-center font-sans antialiased transition-colors duration-300">
      {/* 
        Desktop Split-Screen Wrapper:
        - On mobile (<1024px): Full-screen single-column flow matching reference mockups.
        - On desktop (>=1024px): Split-screen with branded showcase panel on left and centered step card on right.
      */}
      <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row items-stretch">
        
        {/* ===================================================================
            DESKTOP-ONLY LEFT BRAND SHOWCASE PANEL (Visible on lg: >=1024px)
            =================================================================== */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0b0d14] via-[#131722] to-[#0f1422] border-r border-[#1e2638] flex-col justify-between p-12 text-white relative overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <CentraLogo size="md" showGlow />
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-white block">
                CENTRA
              </span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Intelligent Money Management
              </span>
            </div>
          </div>

          {/* Central Feature Visual Showcase */}
          <div className="relative z-10 my-auto py-8 max-w-md mx-auto w-full">
            <div className="rounded-3xl bg-[#131722]/80 backdrop-blur-md border border-[#1e2638] p-7 shadow-2xl shadow-black/50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Global Financial Hub</h4>
                    <p className="text-xs text-gray-400">All accounts synced in real-time</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>

              {/* Progress preview */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-400">Monthly Budget Performance</span>
                  <span className="text-white font-bold">৳54,380 / ৳80,000</span>
                </div>
                <div className="h-2 w-full bg-[#0b0d14] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 rounded-full w-[68%]" />
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-[#0b0d14]/60 border border-white/5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Auto Currency
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {profileData.currency} ({profileData.country})
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0b0d14]/60 border border-white/5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Active Theme
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block capitalize">
                    {selectedTheme} Mode
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>End-to-end Supabase security &amp; local-first privacy</span>
              </div>
            </div>

            {/* Contextual Step Checklist on Desktop */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep !== 'intro' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                }`}>
                  1
                </span>
                <span className={currentStep === 'signup' ? 'text-white font-bold' : ''}>
                  Account Credentials &amp; Social Sign-In
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  ['profile', 'theme', 'categories', 'ready'].includes(currentStep)
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-white'
                }`}>
                  2
                </span>
                <span className={currentStep === 'verify' ? 'text-white font-bold' : ''}>
                  5-Digit Email Verification
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  ['theme', 'categories', 'ready'].includes(currentStep)
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-white'
                }`}>
                  3
                </span>
                <span className={['profile', 'theme', 'categories'].includes(currentStep) ? 'text-white font-bold' : ''}>
                  Profile, Currency, Theme &amp; Spending Setup
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Desktop Footer */}
          <div className="relative z-10 text-xs text-gray-500 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Centra Finance</span>
            <span>v1.0.0</span>
          </div>
        </div>

        {/* ===================================================================
            RIGHT / MOBILE CONTAINER (Form Card on Desktop, Full-Width on Mobile)
            =================================================================== */}
        <div className="w-full lg:w-1/2 min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md mx-auto my-auto transition-all duration-300 ease-out">
            
            {/* Smooth animated step switch */}
            <div
              key={currentStep}
              className="w-full transition-opacity duration-300 animate-fade-in"
            >
              {currentStep === 'intro' && (
                <IntroStep
                  onGetStarted={() => goToStep('signup', 'forward')}
                  onSignIn={() => setShowSignInModal(true)}
                />
              )}

              {currentStep === 'signup' && (
                <SignUpStep
                  onBack={() => goToStep('intro', 'backward')}
                  onSignedUp={handleSignedUp}
                  onContinueAsGuest={enterGuestMode}
                  onSwitchToSignIn={() => setShowSignInModal(true)}
                />
              )}

              {currentStep === 'verify' && (
                <VerifyEmailStep
                  email={email}
                  onBack={() => goToStep('signup', 'backward')}
                  onVerified={handleVerified}
                />
              )}

              {currentStep === 'profile' && (
                <ProfileInfoStep
                  initialName={profileData.name}
                  onBack={() => goToStep('verify', 'backward')}
                  onContinue={handleProfileContinue}
                />
              )}

              {currentStep === 'theme' && (
                <ThemeSelectionStep
                  selectedTheme={selectedTheme}
                  onSelectTheme={handleSelectTheme}
                  onBack={() => goToStep('profile', 'backward')}
                  onContinue={handleThemeContinue}
                />
              )}

              {currentStep === 'categories' && (
                <CategoriesStep
                  selectedCategories={selectedCategories}
                  onToggleCategory={handleToggleCategory}
                  onBack={() => goToStep('theme', 'backward')}
                  onFinish={handleCategoriesFinish}
                />
              )}

              {currentStep === 'ready' && (
                <AccountReadyStep onComplete={handleOnboardingComplete} />
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Sign-In Modal for Returning Users */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSwitchToSignUp={() => {
          setShowSignInModal(false);
          goToStep('signup', 'forward');
        }}
      />
    </div>
  );
};
