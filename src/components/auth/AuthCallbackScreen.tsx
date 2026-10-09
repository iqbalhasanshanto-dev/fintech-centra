import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { CentraDB } from '../../db/storage';
import logoImg from '../../assets/brand/logo.png';

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
          // Clear query params / hash without refreshing
          window.history.replaceState({}, document.title, window.location.pathname);

          // Check profile onboarding status
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
      } catch (err: any) {
        console.warn('Callback session check error:', err);
        return false;
      }
    };

    // Check immediately
    checkSession();

    // Listen for auth state change from supabase auto-exchange
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

    // 10s fallback timeout
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
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-sm bg-white dark:bg-[#0D1220] rounded-3xl p-8 border border-gray-200 dark:border-[#1e263c] shadow-2xl text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src={logoImg}
            alt="Centra"
            className="w-8 h-8 object-contain drop-shadow-sm select-none"
            draggable={false}
          />
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white font-display">
            Centra
          </span>
        </div>

        {errorMessage ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Sign In Failed</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                setAuthView('signedOut');
              }}
              className="w-full py-3 px-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to sign in</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Completing sign in...
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please wait while we verify your credentials.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
