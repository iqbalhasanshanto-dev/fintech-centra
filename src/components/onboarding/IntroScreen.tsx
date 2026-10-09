import React, { useState } from 'react';
import { TrendingUp, PieChart, Sparkles, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';
import { useAuth } from '../../context/AuthContext';

export const IntroScreen: React.FC = () => {
  const { sendOtp, signInWithOAuth, enterGuestMode } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(cleanEmail);
      if (!res.ok) {
        setErrorMessage(res.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
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
      setErrorMessage(err?.message || `${provider} sign-in failed. Please try again.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex items-center justify-center p-4 sm:p-6 transition-colors selection:bg-teal-500 selection:text-white">
      {/* Desktop Ambient Background Accents */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="w-full h-full min-h-screen md:min-h-[720px] md:h-auto md:max-w-lg lg:max-w-xl md:my-8 bg-white dark:bg-[#0D1220] md:rounded-[36px] md:border md:border-gray-200/80 md:dark:border-[#1e263c] md:shadow-2xl md:shadow-black/20 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all">
        {/* Top Header with Brand Logo */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <img
              src={logoImg}
              alt="Centra"
              className="w-9 h-9 object-contain drop-shadow-sm select-none"
              draggable={false}
            />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
              Centra
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15] mb-2">
            Money that <br className="hidden sm:inline" />
            works for you
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal max-w-md leading-relaxed">
            Centra unifies your spending, budgets, and financial insights into a single intelligent dashboard.
          </p>
        </div>

        {/* Product Visual: Sleek Personal Finance Dashboard Card / Analytics Preview */}
        <div className="my-5 w-full flex items-center justify-center">
          <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-[#131722] via-[#0f131d] to-[#0a0d14] border border-[#1e2638] shadow-2xl shadow-black/40 overflow-hidden text-white group">
            {/* Ambient glows */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top widget row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Financial Health
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                +18.4% this month
              </span>
            </div>

            {/* Balance Tracker Display */}
            <div className="mb-4">
              <span className="text-xs text-gray-400 font-medium block">Net Savings Rate</span>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5 flex items-baseline gap-1">
                <span>92.4</span>
                <span className="text-emerald-400 text-2xl font-bold">%</span>
                <span className="text-xs text-gray-400 font-normal ml-2">Score: Excellent</span>
              </div>
            </div>

            {/* Dynamic Visual: Multi-category Spend Distribution Bars */}
            <div className="space-y-2 pt-1 pb-3 border-y border-[#1e2638]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  Budget Allocation
                </span>
                <span className="text-gray-400 font-semibold">Under Budget</span>
              </div>
              <div className="w-full h-2.5 bg-[#1e2638] rounded-full overflow-hidden flex gap-1 p-0.5">
                <div className="h-full bg-teal-400 rounded-full w-[45%]" />
                <div className="h-full bg-emerald-400 rounded-full w-[30%]" />
                <div className="h-full bg-amber-400 rounded-full w-[15%]" />
                <div className="h-full bg-indigo-400 rounded-full w-[10%]" />
              </div>
            </div>

            {/* Bottom Breakdown stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 text-center">
              <div className="bg-[#1a2030]/70 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] text-gray-400 font-medium block">Tracking</span>
                <span className="text-xs font-bold text-teal-300 flex items-center justify-center gap-0.5 mt-0.5">
                  <PieChart className="w-3 h-3" /> Real-time
                </span>
              </div>
              <div className="bg-[#1a2030]/70 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] text-gray-400 font-medium block">Security</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                  <Shield className="w-3 h-3" /> Encrypted
                </span>
              </div>
              <div className="bg-[#1a2030]/70 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] text-gray-400 font-medium block">Insights</span>
                <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-0.5 mt-0.5">
                  <Sparkles className="w-3 h-3" /> Automated
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Options: Google, Apple, Email OTP, and Guest */}
        <div className="w-full max-w-md mx-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email OTP Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-2.5">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoCapitalize="none"
                autoComplete="email"
                required
                disabled={isLoading || !!oauthLoading}
                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !!oauthLoading}
              className="w-full py-3.5 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#232c44]" />
            <span className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#232c44]" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={isLoading || !!oauthLoading}
              className="w-full py-3 px-4 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-gray-200/50 dark:border-[#1e2638] cursor-pointer disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Google</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={isLoading || !!oauthLoading}
              className="w-full py-3 px-4 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-gray-200/50 dark:border-[#1e2638] cursor-pointer disabled:opacity-50"
            >
              {oauthLoading === 'apple' ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-1 .04-2.22.67-2.91 1.48-.61.7-1.14 1.81-1 2.87 1.12.09 2.26-.59 2.97-1.42z" />
                </svg>
              )}
              <span>Apple</span>
            </button>
          </div>

          {/* Guest Mode Demo Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={enterGuestMode}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Explore Demo (Local Only)</span>
            </button>
          </div>

          {/* Terms & Privacy */}
          <p className="text-[10px] sm:text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed pt-2">
            By proceeding, you confirm that you agree to the{' '}
            <span className="underline underline-offset-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="underline underline-offset-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
              Privacy Policy
            </span>.
          </p>
        </div>
      </div>
    </div>
  );
};
