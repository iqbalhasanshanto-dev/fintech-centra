import React, { useState, useCallback, useEffect } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, User, Shield, UserX, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RESEND_COOLDOWN = 60;

export const AuthScreen: React.FC = () => {
  const {
    login,
    register,
    loginWithBiometrics,
    pending2FA,
    verify2FA,
    cancel2FA,
    enterGuestMode,
    resendVerificationEmail,
  } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
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

  // Reset unconfirmed state when switching modes
  const switchMode = (toLogin: boolean) => {
    setIsLoginMode(toLogin);
    setErrorMsg('');
    setEmailNotConfirmed(false);
    setResendSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setEmailNotConfirmed(false);
    setResendSent(false);

    try {
      if (isLoginMode) {
        const result = await login(email, password);
        if (!result.ok) {
          if (result.emailNotConfirmed) {
            setEmailNotConfirmed(true);
          } else {
            setErrorMsg('Invalid email or password. Please try again.');
          }
        }
      } else {
        await register(name, email, password);
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
      <div className="w-full max-w-md bg-white dark:bg-[#121A2C] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-[#232C45] shadow-2xl animate-fade-in">

        {/* Centra Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 text-white mx-auto flex items-center justify-center mb-3 shadow-md shadow-brand-500/20">
            <Shield className="w-6 h-6 fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            CENTRA
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Centra Financial Overview &amp; Money Management
          </p>
        </div>

        {/* 2FA Challenge Flow */}
        {pending2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center border border-brand-200/60 dark:border-brand-900/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Enter the 6-digit code sent to your device (Demo: <strong className="text-brand-600 dark:text-brand-400">123456</strong>)
              </p>
            </div>

            <input
              type="text"
              maxLength={6}
              autoFocus
              placeholder="123456"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-mono font-bold py-3 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
            />

            {errorMsg && <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={cancel2FA}
                className="py-3 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 dark:hover:bg-[#1A233A] cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-float cursor-pointer"
              >
                Verify &amp; Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Main Auth Form */
          <div className="space-y-5">

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-xs font-semibold">
              <button
                onClick={() => switchMode(true)}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  isLoginMode
                    ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode(false)}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  !isLoginMode
                    ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Generic error */}
            {errorMsg && (
              <p className="text-xs text-rose-500 font-semibold text-center">{errorMsg}</p>
            )}

            {/* Email not confirmed inline block */}
            {emailNotConfirmed && (
              <div className="rounded-xl border border-amber-300/60 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3.5 space-y-2.5">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Please verify your email before signing in. Check your inbox for a confirmation link.
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
                  className="w-full py-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLoginMode && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="alex@centra.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-float transition-all cursor-pointer"
              >
                <span>{isLoginMode ? 'Sign In to Centra' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Biometrics (login only) */}
            {isLoginMode && (
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isScanningBiometrics}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-[#1A233A] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {isScanningBiometrics ? 'Scanning…' : 'Use Biometrics'}
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#232C45]" />
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#232C45]" />
            </div>

            {/* Continue as Guest */}
            <button
              type="button"
              onClick={enterGuestMode}
              className="w-full py-3 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-[#1A233A] transition-colors cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              Continue as Guest
            </button>

            <p className="text-[10px] font-medium text-center text-gray-400 dark:text-gray-500">
              Guest data is stored locally only — no cloud backup.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
