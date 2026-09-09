import React, { useState, useCallback, useEffect } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import brandLogo from '../../assets/brand/logo.png';

const RESEND_COOLDOWN = 60;

export const AuthScreen: React.FC = () => {
  const {
    login,
    loginWithBiometrics,
    pending2FA,
    verify2FA,
    cancel2FA,
    enterGuestMode,
    resendVerificationEmail,
    setAuthView,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  // Error / status states
  const [errorMsg, setErrorMsg] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSent, setResendSent] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setEmailNotConfirmed(false);
    setResendSent(false);

    try {
      const result = await login(email, password);
      if (!result.ok) {
        if (result.emailNotConfirmed) {
          setEmailNotConfirmed(true);
        } else {
          setErrorMsg('Invalid email or password. Please try again.');
        }
      }
    } catch {
      setErrorMsg('Authentication failed. Please check your credentials.');
    }
  };

  const handleBiometricAuth = async () => {
    setIsScanningBiometrics(true);
    setErrorMsg('');
    try {
      await loginWithBiometrics();
    } catch {
      setErrorMsg('Biometric authentication failed.');
    } finally {
      setIsScanningBiometrics(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code.');
      return;
    }
    const success = await verify2FA(otpInput);
    if (!success) {
      setErrorMsg('Invalid 2FA code. Try entering 123456');
    }
  };

  const handleResendFromLogin = useCallback(async () => {
    if (!email || resendCooldown > 0) return;
    await resendVerificationEmail(email);
    setResendSent(true);
    setResendCooldown(RESEND_COOLDOWN);
  }, [email, resendCooldown, resendVerificationEmail]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-gray-100 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#0D1220] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#1e263c] shadow-2xl animate-fade-in relative">
        
        {/* Top Back Button to Intro */}
        <button
          type="button"
          onClick={() => setAuthView('intro')}
          className="absolute left-6 top-6 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Back to welcome screen"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Centra Brand Header with Real Logo */}
        <div className="text-center mb-6 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#151c2e] p-2 mx-auto flex items-center justify-center mb-3 shadow-sm border border-gray-200 dark:border-white/10">
            <img
              src={brandLogo}
              alt="Centra"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
            Sign In to Centra
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Enter your details to access your dashboard.
          </p>
        </div>

        {/* 2FA Challenge Flow */}
        {pending2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 mx-auto flex items-center justify-center border border-teal-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Enter the 6-digit code sent to your device (Demo: <strong className="text-teal-500">123456</strong>)
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
              className="w-full text-center text-2xl font-bold tracking-widest py-3 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />

            {errorMsg && (
              <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={cancel2FA}
                className="py-3 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] text-gray-700 dark:text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Verify &amp; Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Main Login Form */
          <div className="space-y-4">
            {/* Generic error */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Email not confirmed inline block */}
            {emailNotConfirmed && (
              <div className="rounded-2xl border border-amber-300/60 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3.5 space-y-2.5">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Please verify your email before signing in. Check your inbox for a confirmation code or link.
                </p>
                {resendSent && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Verification email sent!
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResendFromLogin}
                  disabled={resendCooldown > 0}
                  className="w-full py-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] shadow-lg transition-all cursor-pointer mt-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Biometrics login button */}
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={isScanningBiometrics}
              className="w-full py-3 rounded-full bg-gray-100 dark:bg-[#131722] hover:bg-gray-200 dark:hover:bg-[#1e2638] text-gray-800 dark:text-gray-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>{isScanningBiometrics ? 'Scanning biometrics...' : 'Use Biometrics'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#232c44]" />
              <span className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#232c44]" />
            </div>

            {/* Switch to New User Sign Up */}
            <div className="text-center pt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                New to Centra?{' '}
              </span>
              <button
                type="button"
                onClick={() => setAuthView('onboarding')}
                className="text-xs font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </div>

            {/* Continue as Guest */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={enterGuestMode}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>Continue as Guest</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
