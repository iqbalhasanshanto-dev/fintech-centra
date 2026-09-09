import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2, UserX } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface SignUpStepProps {
  onBack: () => void;
  onSignedUp: (email: string) => void;
  onContinueAsGuest: () => void;
  onSwitchToSignIn: () => void;
}

export const SignUpStep: React.FC<SignUpStepProps> = ({
  onBack,
  onSignedUp,
  onContinueAsGuest,
  onSwitchToSignIn,
}) => {
  const { register, signInWithOAuth } = useAuth();
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
      // Use email username as default display name until profile step
      const defaultName = email.split('@')[0];
      await register(defaultName, email, password);
      onSignedUp(email);
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
    <div className="flex flex-col justify-between min-h-full w-full py-4 px-4 sm:px-6">
      {/* Top Header & Progress */}
      <div>
        {/* Progress Bar & Back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            Step 1/5
          </span>
          <div className="w-7" /> {/* spacer for center alignment */}
        </div>

        {/* Progress Line: 20% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-300 w-[20%]" />
        </div>

        {/* Headings matching reference image 3 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Create account
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Let's set up your account.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 pr-12 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Primary Sign Up button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Sign up</span>
            )}
          </button>
        </form>

        {/* Divider matching reference image 3 */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#1e2638]" />
          <span className="px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#1e2638]" />
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={oauthLoading !== null}
            className="w-full py-3.5 px-6 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] border border-transparent dark:border-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
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
            disabled={oauthLoading !== null}
            className="w-full py-3.5 px-6 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] border border-transparent dark:border-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {oauthLoading === 'apple' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.83-11.98-14.35-8.5-12.87-14.77-27.17-18.82-42.91-4.04-15.73-6.07-29.35-6.07-40.85 0-16.14 4.04-29.47 12.13-40 8.09-10.53 18.29-15.86 30.6-16 4.79 0 10.37 1.34 16.74 4.03 6.37 2.69 10.36 4.09 11.97 4.2 1.83-.22 6.13-1.74 12.9-4.57 6.77-2.83 12.35-4.09 16.74-3.79 12.86.76 23.36 5.37 31.5 13.82-11.33 6.87-16.89 16.56-16.68 29.07.22 9.8 4.04 18.08 11.45 24.83 7.42 6.75 16.27 10.51 26.56 11.29-2.18 6.75-4.68 13.29-7.51 19.63zM119.22 33.15c0-7.39 2.67-14.41 8.02-21.06 5.35-6.64 11.99-10.89 19.92-12.74.87 7.07-1.36 14.04-6.69 20.91-5.33 6.87-11.9 10.99-19.72 12.36-.22-1.63-.53-4.79-1.53-9.47z" />
              </svg>
            )}
            <span>Continue with Apple</span>
          </button>

          {/* Continue as Guest (Low emphasis as requested) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full py-3 px-6 rounded-full border border-gray-200 dark:border-[#1e2638] text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#131722]/60 font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Continue as Guest (Explore offline)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="mt-8 space-y-4 text-center">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed px-4">
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

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-bold text-gray-900 dark:text-white underline underline-offset-2 hover:opacity-80 cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
