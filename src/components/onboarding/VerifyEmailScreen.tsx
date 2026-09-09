import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VerifyEmailScreenProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  email,
  onBack,
  onVerified,
}) => {
  const { verifyEmailOtp, resendVerificationEmail } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage('');

    // Advance focus if a digit was typed
    if (char && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
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
    } else if (e.key === 'ArrowRight' && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 5; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    // Focus on the next empty input or the last one
    const focusIndex = Math.min(pastedData.length, 4);
    inputRefs.current[focusIndex]?.focus();
  };

  const code = digits.join('');
  const isComplete = code.length === 5;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete) {
      setErrorMessage('Please enter the full 5-digit code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await verifyEmailOtp(email, code);
      if (result.ok) {
        onVerified();
      } else {
        setErrorMessage(result.error || 'Invalid code. Please try again or request a new code.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendStatus === 'sending') return;
    setResendStatus('sending');
    setErrorMessage('');
    try {
      await resendVerificationEmail(email);
      setResendStatus('sent');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code.');
      setResendStatus('idle');
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-full py-4 px-4 sm:px-8">
      {/* Top Header & Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
            Step 2/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 40% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 w-[40%]" />
        </div>

        {/* Headings matching reference image 4 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Verify your email
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            We sent a 5-digit code to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{email || 'your email'}</span>.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* 5-Digit Circular OTP Input Boxes matching reference image 4 */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 my-8" onPaste={handlePaste}>
          {digits.map((digit, idx) => {
            const isFilled = !!digit;
            return (
              <input
                key={idx}
                ref={el => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full text-center text-xl sm:text-2xl font-bold transition-all outline-none select-all ${
                  isFilled
                    ? 'bg-gray-100 dark:bg-[#1a2236] text-gray-900 dark:text-white border-2 border-black dark:border-white shadow-sm'
                    : 'bg-white dark:bg-[#131722] text-gray-900 dark:text-white border border-gray-200 dark:border-[#232c44] hover:border-gray-400 dark:hover:border-gray-600'
                } focus:border-2 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10`}
              />
            );
          })}
        </div>

        {/* Resend Link Area matching reference */}
        <div className="text-center mt-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Didn't get a code?{' '}
          </span>
          {resendCooldown > 0 ? (
            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'sending'}
              className="text-sm font-bold text-gray-900 dark:text-white underline underline-offset-2 hover:opacity-80 cursor-pointer disabled:opacity-50"
            >
              {resendStatus === 'sending' ? 'Sending...' : 'Tap to resend.'}
            </button>
          )}

          {resendStatus === 'sent' && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>New code sent! Check your inbox.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Continue Button matching reference */}
      <div className="pt-8">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={!isComplete || isLoading}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>
      </div>
    </div>
  );
};
