import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CentraLogo } from './CentraLogo';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
}) => {
  const { login, loginWithBiometrics, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (!res.ok) {
        if (res.emailNotConfirmed) {
          setErrorMessage('Please verify your email before signing in.');
        } else {
          setErrorMessage('Invalid email or password. Please try again.');
        }
      } else {
        onClose();
      }
    } catch {
      setErrorMessage('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometrics = async () => {
    try {
      await loginWithBiometrics();
      onClose();
    } catch {
      setErrorMessage('Biometric login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#1e2638] shadow-2xl animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <CentraLogo size="md" showGlow className="mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to Centra</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Access your financial dashboard
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#0b0d14] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#0b0d14] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign in</span>}
          </button>
        </form>

        {/* Biometrics */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleBiometrics}
            className="w-full py-3 rounded-full border border-gray-200 dark:border-[#1e2638] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2638] font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Sign in with Biometrics / FaceID</span>
          </button>
        </div>

        {/* Switch to Sign up */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToSignUp();
            }}
            className="font-bold text-gray-900 dark:text-white underline underline-offset-2 hover:opacity-80 cursor-pointer"
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};
