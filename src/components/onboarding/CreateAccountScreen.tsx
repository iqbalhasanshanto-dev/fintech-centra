import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CreateAccountScreenProps {
  onBack: () => void;
  onSignedUp: (email: string) => void;
  onSwitchToSignIn: () => void;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({
  onBack,
  onSignedUp,
  onSwitchToSignIn,
}) => {
  const { register, signInWithOAuth, enterGuestMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Clean initial registration; user provides full name and details on Step 3
      await register('', email.trim(), password);
      onSignedUp(email.trim());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setErrorMessage('');
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setErrorMessage(err?.message || `${provider} authentication failed.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-full py-4 px-4 sm:px-8">
      {/* Top Header & Progress */}
      <div>
        {/* Progress Bar Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
            Step 1/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 20% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 w-[20%]" />
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Create account
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Let's set up your account.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form Fields: Controlled empty inputs with grey hint placeholder text */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              autoCapitalize="none"
              autoComplete="email"
              required
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              required
              className="w-full px-5 py-4 pr-12 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Primary Sign up button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Sign up</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#232c44]" />
          <span className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Or
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#232c44]" />
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            className="w-full py-3.5 px-6 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-sm transition-all flex items-center justify-center gap-3 border border-transparent dark:border-[#1e2638] cursor-pointer disabled:opacity-50"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={!!oauthLoading}
            className="w-full py-3.5 px-6 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-sm transition-all flex items-center justify-center gap-3 border border-transparent dark:border-[#1e2638] cursor-pointer disabled:opacity-50"
          >
            {oauthLoading === 'apple' ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-1 .04-2.22.67-2.91 1.48-.61.7-1.14 1.81-1 2.87 1.12.09 2.26-.59 2.97-1.42z" />
              </svg>
            )}
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Lower Emphasis Continue as Guest link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={enterGuestMode}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Explore as Guest (Skip setup)</span>
          </button>
        </div>
      </div>

      {/* Bottom Terms & Sign in link */}
      <div className="pt-6">
        <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed mb-3">
          By proceeding, you confirm that you have read and fully agree to the{' '}
          <span className="underline underline-offset-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
            Terms of Service
          </span>{' '}
          and{' '}
          <span className="underline underline-offset-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
            Privacy Policy
          </span>{' '}
          outlined on our website.
        </p>

        <div className="text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
          </span>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-xs font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
