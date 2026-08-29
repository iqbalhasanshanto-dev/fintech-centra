import React, { useState } from 'react';
import { Fingerprint, Lock, Mail, ArrowRight, ShieldCheck, User, Shield } from 'lucide-react';
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
                onClick={() => setIsLoginMode(true)}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  isLoginMode ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLoginMode(false)}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  !isLoginMode ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error state */}
            {errorMsg && <p className="text-xs text-rose-500 font-semibold text-center">{errorMsg}</p>}

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

            {/* Quick Biometric / Passkey Sign-in Button */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-[#232C45]" />
                <span className="flex-shrink mx-3 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                  or passkey
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-[#232C45]" />
              </div>

              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isScanningBiometrics}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] hover:bg-gray-200 dark:hover:bg-[#1A233A] border border-gray-200 dark:border-[#232C45] text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Fingerprint className={`w-4 h-4 text-brand-600 dark:text-brand-400 ${isScanningBiometrics ? 'animate-pulse' : ''}`} />
                <span>{isScanningBiometrics ? 'Verifying...' : 'Sign in with Passkey / FaceID'}</span>
              </button>
            </div>

            <p className="text-[10px] font-medium text-center text-gray-400 dark:text-gray-500 pt-1">
              Press Sign In to explore pre-loaded demo finance portfolio.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
