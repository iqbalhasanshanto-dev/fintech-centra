import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import logoImg from '../../assets/brand/logo.png';
import { useAuth } from '../../context/AuthContext';

export const OTP_LENGTH = 6;

export const OtpScreen: React.FC = () => {
  const {
    pendingEmail,
    authMode,
    setAuthMode,
    verifyOtp,
    resendOtp,
    sendOtp,
    setAuthView,
    setPendingEmail,
  } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60-second cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage('');

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all digits are entered
    const fullCode = newDigits.join('');
    if (fullCode.length === OTP_LENGTH && !newDigits.includes('')) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newDigits = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setErrorMessage('');

    if (pasted.length === OTP_LENGTH) {
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      triggerVerification(pasted);
    } else {
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const triggerVerification = async (codeToVerify: string) => {
    if (codeToVerify.length !== OTP_LENGTH) {
      setErrorMessage(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await verifyOtp(pendingEmail, codeToVerify);
      if (!result.ok) {
        setErrorMessage(result.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerification(digits.join(''));
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendStatus === 'sending' || isLoading) return;
    setResendStatus('sending');
    setErrorMessage('');
    try {
      const res = await resendOtp(pendingEmail);
      if (res.ok) {
        setResendStatus('sent');
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Failed to resend code.');
        setResendStatus('idle');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend verification code.');
      setResendStatus('idle');
    }
  };

  const handleDifferentEmail = () => {
    setPendingEmail('');
    setAuthView('signedOut');
  };

  const handleSwitchToCreateAccount = async () => {
    setAuthMode('signup');
    setDigits(Array(OTP_LENGTH).fill(''));
    setErrorMessage('');
    setIsLoading(true);
    try {
      await sendOtp(pendingEmail, 'signup');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send account creation code.');
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = digits.join('').length === OTP_LENGTH && !digits.includes('');

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white flex items-center justify-center p-4 sm:p-6 transition-colors selection:bg-teal-500 selection:text-white">
      {/* Desktop Ambient Background Accents */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full h-full min-h-screen md:min-h-[580px] md:h-auto md:max-w-md bg-white dark:bg-[#0D1220] md:rounded-[36px] md:border md:border-gray-200/80 md:dark:border-[#1e263c] md:shadow-2xl md:shadow-black/20 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={handleDifferentEmail}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Back to sign in"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={logoImg}
                alt="Centra"
                className="w-6 h-6 object-contain drop-shadow-sm select-none"
                draggable={false}
              />
              <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white font-display">
                Centra
              </span>
            </div>
            <div className="w-9" />
          </div>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Enter verification code
            </h1>

            {/* Contextual description per specifications */}
            {authMode === 'signin' ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                If an account exists for{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-200 break-all">
                  {pendingEmail || 'this email'}
                </span>
                , we've sent a 6-digit code.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit verification code to{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-200 break-all">
                  {pendingEmail || 'your email'}
                </span>
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OTP Code Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1} of verification code`}
                  className={`w-11 sm:w-12 h-14 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-2xl border transition-all focus:outline-none ${
                    digit
                      ? 'border-teal-500 bg-teal-500/5 text-gray-900 dark:text-white ring-2 ring-teal-500/20'
                      : 'border-gray-200 dark:border-[#232c44] bg-gray-50 dark:bg-[#131722] text-gray-900 dark:text-white focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10'
                  } disabled:opacity-50`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isComplete}
              className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm sm:text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>

          {/* No code helper section */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              No code? Check spam,{' '}
              <button
                type="button"
                onClick={handleDifferentEmail}
                className="font-semibold text-gray-700 dark:text-gray-300 hover:underline cursor-pointer"
              >
                use a different email
              </button>
              {authMode === 'signin' && (
                <>
                  , or{' '}
                  <button
                    type="button"
                    onClick={handleSwitchToCreateAccount}
                    className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    create an account
                  </button>
                </>
              )}
              .
            </p>
          </div>
        </div>

        {/* Resend & Change Email Footer */}
        <div className="pt-6 border-t border-gray-100 dark:border-[#1e263c] space-y-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {resendCooldown > 0 ? (
              <span>Resend code in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === 'sending' || isLoading}
                className="font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer inline-flex items-center gap-1.5"
              >
                {resendStatus === 'sending' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Resend code</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
