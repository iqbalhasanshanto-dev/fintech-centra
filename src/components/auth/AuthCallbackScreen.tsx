import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';
import logoImg from '../../assets/brand/logo.png';
import { CornerGlow } from '../ui/CornerGlow';

export const AuthCallbackScreen: React.FC = () => {
  const { setAuthView } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      setAuthView('signedOut');
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          window.history.replaceState({}, document.title, window.location.pathname);

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!isMounted) return;

          if (profile?.onboarding_completed) {
            setAuthView('app');
          } else {
            setAuthView('onboarding');
          }
          return true;
        }
        return false;
      } catch (err: unknown) {
        logger.warn('Callback session check error:', err);
        return false;
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        window.history.replaceState({}, document.title, window.location.pathname);

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profile?.onboarding_completed) {
          setAuthView('app');
        } else {
          setAuthView('onboarding');
        }
      }
    });

    const timeoutTimer = setTimeout(async () => {
      const resolved = await checkSession();
      if (!resolved && isMounted) {
        setErrorMessage('Authentication timed out. Please try signing in again.');
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutTimer);
    };
  }, [setAuthView]);

  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex items-center justify-center p-6 transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black">
      <CornerGlow />

      <div className="w-full max-w-sm bg-white dark:bg-[#1D1D1D] rounded-[32px] p-8 sm:p-10 border border-black/5 dark:border-white/10 shadow-2xl text-center animate-fade-in z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src={logoImg}
            alt="Centra"
            className="w-8 h-8 object-contain drop-shadow-sm select-none rounded-xl"
            draggable={false}
          />
          <span className="text-xl font-bold tracking-tight text-[#18212F] dark:text-white font-display">
            Centra
          </span>
        </div>

        {errorMessage ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setAuthView('signedOut')}
              className="py-3 px-5 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black font-semibold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to sign in</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#18212F] dark:text-[#C6FF3D] mx-auto" />
            <h2 className="text-lg font-bold text-[#18212F] dark:text-white">
              Authenticating...
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verifying your session, please wait.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
