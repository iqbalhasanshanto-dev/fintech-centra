import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import logoOnDark from '../../assets/brand/logo-on-dark.svg';
import logoOnLight from '../../assets/brand/logo-on-light.svg';
import { CornerGlow } from '../ui/CornerGlow';
import { useAuth } from '../../context/AuthContext';
import {
  isNetworkConnected,
  getFriendlyAuthErrorMessage,
  NO_INTERNET_ERROR_MESSAGE,
} from '../../utils/networkErrors';

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

    if (!(await isNetworkConnected())) {
      setErrorMessage(NO_INTERNET_ERROR_MESSAGE);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await verifyOtp(pendingEmail, codeToVerify);
      if (!result.ok) {
        setErrorMessage(result.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err: unknown) {
      const msg = getFriendlyAuthErrorMessage(err, 'Verification failed. Please try again.');
      setErrorMessage(msg);
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

    if (!(await isNetworkConnected())) {
      setErrorMessage(NO_INTERNET_ERROR_MESSAGE);
      setResendStatus('idle');
      return;
    }

    try {
      const res = await resendOtp(pendingEmail);
      if (res.ok) {
        setResendStatus('sent');
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Failed to resend code.');
        setResendStatus('idle');
      }
    } catch (err: unknown) {
      const msg = getFriendlyAuthErrorMessage(err, 'Failed to resend verification code.');
      setErrorMessage(msg);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send account creation code.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = digits.join('').length === OTP_LENGTH && !digits.includes('');

  return (
    <div
      className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col justify-between relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      <CornerGlow />

      <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto z-10 animate-fade-in">
        {/* Top Canvas Header: Hero Text + Centra Brand Mark (Top-Right) */}
        <div className="px-6 pt-4 pb-6 flex items-start justify-between">
          <div>
            <button
              type="button"
              onClick={handleDifferentEmail}
              className="mb-4 p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Back to sign in"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[52px] sm:text-[64px] font-normal font-sans tracking-tight leading-[1.02] text-[#18212F] dark:text-white">
              Verify<br />
              <span className="text-[#56791E] dark:text-[#C6FF3D]">Your</span><br />
              Email
            </h1>
          </div>

          <div className="pt-1">
            <img
              src={logoOnLight}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none dark:hidden"
              draggable={false}
            />
            <img
              src={logoOnDark}
              alt="Centra"
              className="w-10 h-10 object-contain drop-shadow-sm select-none hidden dark:block"
              draggable={false}
            />
          </div>
        </div>

        {/* Elevated Bottom Sheet Card (04-verify-code.png) */}
        <div className="w-full bg-white dark:bg-[#1D1D1D] rounded-t-[32px] md:rounded-[32px] border-t md:border border-black/5 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col transition-all">
          {/* Drag Handle */}
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-5" />

          <h2 className="text-2xl font-bold tracking-tight text-[#18212F] dark:text-white mb-2">
            Verify
          </h2>

          {/* Contextual description per specifications */}
          {authMode === 'signin' ? (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              If an account exists for{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-200 break-all">
                {pendingEmail || 'this email'}
              </span>
              , we've sent a 6-digit code.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              We sent a 6-digit verification code to{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-200 break-all">
                {pendingEmail || 'your email'}
              </span>
            </p>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OTP Code Input Slots (Circular / Rounded-2xl matching 04-verify-code.png) */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center gap-2 sm:gap-3" onPaste={handlePaste}>
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
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full sm:rounded-2xl text-center text-xl sm:text-2xl font-bold border transition-all focus:outline-none min-w-[44px] min-h-[44px] ${
                    errorMessage
                      ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400'
                      : digit
                      ? 'border-[#C6FF3D] bg-[#E8ECEF] dark:bg-[#2A2A2A] text-[#18212F] dark:text-white ring-2 ring-[#C6FF3D]/40'
                      : 'border-transparent bg-[#E8ECEF] dark:bg-[#2A2A2A] text-[#18212F] dark:text-white focus:border-[#C6FF3D] focus:ring-2 focus:ring-[#C6FF3D]'
                  } disabled:opacity-50`}
                />
              ))}
            </div>

            {/* Resend Helper Section */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span>Didn't get a code? </span>
              {resendCooldown > 0 ? (
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Resend code in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus === 'sending' || isLoading}
                  className="font-bold underline text-[#18212F] dark:text-white hover:text-[#4D6E18] dark:hover:text-[#C6FF3D] cursor-pointer inline-flex items-center gap-1"
                >
                  {resendStatus === 'sending' && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Tap to Resend</span>
                </button>
              )}
            </div>

            {/* Submit Continue Button */}
            <button
              type="submit"
              disabled={isLoading || !isComplete}
              className="w-full py-4 px-6 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <span>Continue →</span>
              )}
            </button>
          </form>

          {/* Change email or switch account mode */}
          <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <span>Wrong email? </span>
            <button
              type="button"
              onClick={handleDifferentEmail}
              className="font-semibold underline text-[#18212F] dark:text-white hover:text-[#4D6E18] dark:hover:text-[#C6FF3D] cursor-pointer"
            >
              use a different email
            </button>
            {authMode === 'signin' && (
              <>
                <span>, or </span>
                <button
                  type="button"
                  onClick={handleSwitchToCreateAccount}
                  className="font-bold underline text-[#18212F] dark:text-white hover:text-[#4D6E18] dark:hover:text-[#C6FF3D] cursor-pointer"
                >
                  create an account
                </button>
              </>
            )}
            <span>.</span>
          </div>

          {/* Footer Terms */}
          <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 leading-relaxed mt-6">
            By continuing you are agreeing to our{' '}
            <span className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
              Privacy Policy and Terms & Conditions
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
