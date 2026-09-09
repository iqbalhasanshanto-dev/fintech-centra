import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface VerifyEmailStepProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export const VerifyEmailStep: React.FC<VerifyEmailStepProps> = ({
  email,
  onBack,
  onVerified,
}) => {
  const { verifyEmailOtp, resendVerificationEmail } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [resendNotice, setResendNotice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    // Handle paste of multiple digits
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 5).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (i < 5) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 4);
      setActiveIndex(nextFocus);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const char = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 4) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 4) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const fillDemoCode = () => {
    setDigits(['1', '2', '3', '4', '5']);
    setActiveIndex(4);
    setErrorMessage('');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    try {
      if (email) {
        await resendVerificationEmail(email);
      }
      setResendNotice('New verification code sent to your email!');
      setResendCooldown(60);
      setTimeout(() => setResendNotice(''), 4000);
    } catch {
      setErrorMessage('Failed to resend verification code. Please try again.');
    }
  };

  const code = digits.join('');

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (code.length < 5) {
      setErrorMessage('Please enter all 5 digits of your verification code (e.g. 12345).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await verifyEmailOtp(email || 'user@centra.io', code);
      if (res.ok) {
        onVerified();
      } else {
        setErrorMessage(res.error || 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-full w-full py-4 px-4 sm:px-6">
      {/* Top Section */}
      <div>
        {/* Progress Bar & Back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            Step 2/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 40% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-300 w-[40%]" />
        </div>

        {/* Headings matching reference image 4 */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Verify your email
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            We sent a 5-digit code to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {email || 'your email'}
            </span>.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {resendNotice && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{resendNotice}</span>
          </div>
        )}

        {/* 5-Digit Circular OTP Inputs matching reference image 4 */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-4 max-w-sm mx-auto my-6">
          {digits.map((digit, idx) => {
            const isFilled = digit !== '';
            const isActive = activeIndex === idx;

            return (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={digit}
                onFocus={() => setActiveIndex(idx)}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full text-center text-xl sm:text-2xl font-bold font-mono transition-all duration-150 focus:outline-none select-none cursor-pointer ${
                  isActive
                    ? 'border-2 border-black dark:border-white bg-gray-50 dark:bg-[#131722] text-gray-900 dark:text-white shadow-md'
                    : isFilled
                    ? 'border border-gray-400 dark:border-[#2e3b56] bg-gray-50 dark:bg-[#131722]/50 text-gray-900 dark:text-white font-extrabold'
                    : 'border border-gray-200 dark:border-[#1e2638] bg-transparent text-gray-400'
                }`}
              />
            );
          })}
        </div>

        {/* Helper autofill shortcut for demo/offline testing */}
        <div className="flex justify-center my-3">
          <button
            type="button"
            onClick={fillDemoCode}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fill code 12345 (Test Mode)</span>
          </button>
        </div>

        {/* Resend Link matching reference image 4 */}
        <div className="mt-6 text-center sm:text-left">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Didn't get a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
                resendCooldown > 0
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed no-underline'
                  : 'text-gray-900 dark:text-white hover:opacity-80'
              }`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Tap to resend.'}
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-8">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
};
