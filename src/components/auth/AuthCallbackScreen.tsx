import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Shield, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { CentraDB } from '../../db/storage';

type CallbackStatus = 'processing' | 'success' | 'error';

export const AuthCallbackScreen: React.FC = () => {
  const { setAuthView, resendVerificationEmail } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      // Remove the code from the URL immediately so a browser refresh doesn't replay it
      window.history.replaceState({}, document.title, window.location.pathname);

      if (!isSupabaseConfigured()) {
        // Demo mode — just proceed into the app
        setStatus('success');
        setTimeout(() => setAuthView('app'), 800);
        return;
      }

      // -----------------------------------------------------------------------
      // SDK v2 PKCE flow: exchange the code for a session
      // -----------------------------------------------------------------------
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          setErrorMsg(
            error?.message?.includes('expired')
              ? 'This verification link has expired. Please request a new one.'
              : 'This link is invalid or has already been used. Please request a new verification email.'
          );
          // Try to extract email from any partial session / local storage
          const stored = await supabase.auth.getUser();
          setResendEmail(stored.data.user?.email || '');
          setStatus('error');
          return;
        }

        const user = data.session.user;

        if (!user.email_confirmed_at) {
          setErrorMsg('Email address could not be verified. The link may have expired.');
          setResendEmail(user.email || '');
          setStatus('error');
          return;
        }

        // Success — sync data then navigate into the app
        await CentraDB.syncFromSupabase(user.id, user.email || undefined);
        setStatus('success');
        setTimeout(() => setAuthView('app'), 1000);
        return;
      }

      // -----------------------------------------------------------------------
      // Legacy hash-token flow (#access_token=...) handled by onAuthStateChange
      // in AuthContext — just wait briefly for it to fire
      // -----------------------------------------------------------------------
      if (window.location.hash.includes('access_token=')) {
        // Clear the hash to avoid stale tokens
        window.history.replaceState({}, document.title, window.location.pathname);

        // Wait for the Supabase listener in AuthContext to process SIGNED_IN
        setTimeout(() => {
          // If we're still on the callback screen after 3s, something went wrong
          setErrorMsg('Verification could not be completed. Please try signing in manually.');
          setStatus('error');
        }, 3000);
        return;
      }

      // No code and no hash — nothing to process, redirect to login
      setAuthView('login');
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = async () => {
    if (!resendEmail || cooldown > 0) return;
    await resendVerificationEmail(resendEmail);
    setResendSent(true);
    setCooldown(60);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-gray-100 transition-colors">
      <div className="w-full max-w-xs bg-white dark:bg-[#121A2C] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-[#232C45] shadow-2xl animate-fade-in text-center">

        {/* Brand */}
        <div className="w-12 h-12 rounded-xl bg-brand-600 text-white mx-auto flex items-center justify-center mb-5 shadow-md shadow-brand-500/20">
          <Shield className="w-6 h-6 fill-white/20" />
        </div>

        {status === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 text-brand-600 dark:text-brand-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Verifying your email…
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please wait while we confirm your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Email verified!
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Signing you in to Centra…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Verification failed
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {errorMsg}
            </p>

            {resendSent && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                New verification email sent!
              </p>
            )}

            {resendEmail && (
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-float transition-all cursor-pointer mb-3"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
              </button>
            )}

            <button
              onClick={() => setAuthView('login')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Back to sign in
            </button>
          </>
        )}

      </div>
    </div>
  );
};
