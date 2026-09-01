import React, { useState, useEffect, useCallback } from 'react';
import { MailCheck, RefreshCw, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COOLDOWN_SECONDS = 60;

export const CheckEmailScreen: React.FC = () => {
  const { pendingEmail, resendVerificationEmail, setAuthView } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isSending || !pendingEmail) return;
    setIsSending(true);
    setSentMsg('');
    try {
      await resendVerificationEmail(pendingEmail);
      setSentMsg('Verification email sent! Check your inbox.');
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setSentMsg('Failed to resend. Please try again shortly.');
    } finally {
      setIsSending(false);
    }
  }, [cooldown, isSending, pendingEmail, resendVerificationEmail]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-gray-100 transition-colors">
      <div className="w-full max-w-xs bg-white dark:bg-[#121A2C] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-[#232C45] shadow-2xl animate-fade-in">

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 text-white mx-auto flex items-center justify-center mb-3 shadow-md shadow-brand-500/20">
            <Shield className="w-6 h-6 fill-white/20" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            CENTRA
          </h1>
        </div>

        {/* Mail icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-[#0A0E1A] border border-brand-200/60 dark:border-[#232C45] flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-5 space-y-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            We sent a verification link to:
          </p>
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 break-all">
            {pendingEmail || 'your email address'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1">
            Click the link in your inbox to activate your account. You won't be able to sign in until you verify.
          </p>
        </div>

        {/* Success message */}
        {sentMsg && (
          <p className={`text-xs font-semibold text-center mb-3 ${
            sentMsg.includes('Failed')
              ? 'text-rose-500 dark:text-rose-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {sentMsg}
          </p>
        )}

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || isSending}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-float transition-all cursor-pointer mb-3"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
          {isSending
            ? 'Sending…'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend verification email'}
        </button>

        {/* Back link */}
        <button
          onClick={() => setAuthView('login')}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </button>

      </div>
    </div>
  );
};
