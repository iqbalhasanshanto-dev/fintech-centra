import React, { useState } from 'react';
import { Fingerprint, Lock, Mail, ArrowRight, ShieldCheck, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register, loginWithBiometrics, pending2FA, verify2FA, cancel2FA } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex.morgan@centra.io');
  const [password, setPassword] = useState('••••••••');
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setErrorMsg('Authentication failed. Please check credentials.');
    }
  };

  const handleBiometricAuth = async () => {
    setIsScanningBiometrics(true);
    setErrorMsg('');
    try {
      await loginWithBiometrics();
    } catch (err) {
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F3F2F7] dark:bg-[#0b0d14] text-[#15141F] dark:text-[#f8fafc]">
      <div className="w-full max-w-md bg-white dark:bg-[#131722] rounded-4xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-[#1e2638] animate-fade-in">
        
        {/* Centra Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30 mb-3">
            <span className="font-extrabold font-display text-2xl tracking-wider">C</span>
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-ink dark:text-[#f8fafc]">
            CENTRA
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#64748b] mt-1">
            Master your personal finance & net worth
          </p>
        </div>

        {/* 2FA Challenge Flow */}
        {pending2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500 dark:text-[#64748b] mt-0.5">
                Enter the 6-digit code sent to your device (Demo: <strong className="text-ink dark:text-[#f8fafc]">123456</strong>)
              </p>
            </div>

            <input
              type="text"
              maxLength={6}
              autoFocus
              placeholder="123456"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-mono font-bold py-3 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc]"
            />

            {errorMsg && <p className="text-xs text-danger font-semibold">{errorMsg}</p>}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={cancel2FA}
                className="py-3 rounded-2xl bg-gray-100 dark:bg-[#1e2638] text-gray-700 dark:text-[#f8fafc] font-bold text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                className="py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30"
              >
                Verify & Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Main Auth Form */
          <div className="space-y-5">
            
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-[#1e2638] text-xs font-bold">
              <button
                onClick={() => setIsLoginMode(true)}
                className={`py-2 rounded-xl transition-all ${
                  isLoginMode ? 'bg-white dark:bg-[#131722] text-brand-600 dark:text-brand-400 shadow-xs' : 'text-gray-500 dark:text-[#64748b]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLoginMode(false)}
                className={`py-2 rounded-xl transition-all ${
                  !isLoginMode ? 'bg-white dark:bg-[#131722] text-brand-600 dark:text-brand-400 shadow-xs' : 'text-gray-500 dark:text-[#64748b]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error state */}
            {errorMsg && <p className="text-xs text-danger font-semibold text-center">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLoginMode && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="alex@centra.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#64748b] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <span>{isLoginMode ? 'Sign In to Centra' : 'Get Started Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Biometric / Passkey Sign-in Button */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-[#1e2638]" />
                <span className="flex-shrink mx-3 text-[11px] text-gray-400 dark:text-[#64748b] font-semibold uppercase">
                  or quick passkey
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-[#1e2638]" />
              </div>

              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isScanningBiometrics}
                className="w-full py-3 px-4 rounded-2xl bg-gray-50 dark:bg-[#1e2638] hover:bg-gray-100 dark:hover:bg-[#1e2638]/80 border border-gray-200 dark:border-[#1e2638] text-xs font-bold text-ink dark:text-[#f8fafc] flex items-center justify-center space-x-2 transition-all"
              >
                <Fingerprint className={`w-5 h-5 text-brand-600 ${isScanningBiometrics ? 'animate-pulse' : ''}`} />
                <span>{isScanningBiometrics ? 'Verifying Biometrics...' : 'Sign in with Passkey / FaceID'}</span>
              </button>
            </div>

            {/* Instant Demo Sandbox Shortcut */}
            <p className="text-[11px] text-center text-gray-400 dark:text-[#64748b] pt-1">
              Press Sign In to explore pre-loaded demo finance portfolio.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
