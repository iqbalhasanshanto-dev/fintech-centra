import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OtpScreen, OTP_LENGTH } from '../components/auth/OtpScreen';
import { SupabaseConfigErrorScreen } from '../components/auth/SupabaseConfigErrorScreen';
import { LoadingSplashScreen } from '../components/auth/LoadingSplashScreen';
import { NoAccountFoundScreen } from '../components/auth/NoAccountFoundScreen';
import { AccountIncompleteScreen } from '../components/auth/AccountIncompleteScreen';
import { ProfileErrorScreen } from '../components/auth/ProfileErrorScreen';
import { IntroScreen } from '../components/onboarding/IntroScreen';
import { CentraDB } from '../db/storage';

// Mock useAuth
const mockVerifyOtp = vi.fn();
const mockResendOtp = vi.fn();
const mockSendOtp = vi.fn();
const mockSetAuthView = vi.fn();
const mockSetAuthMode = vi.fn();
const mockSetPendingEmail = vi.fn();
const mockEnterGuestMode = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockRetryProfileFetch = vi.fn();
const mockLogout = vi.fn();

let currentMockAuthMode: 'signin' | 'signup' = 'signin';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    authMode: currentMockAuthMode,
    pendingEmail: 'user@example.com',
    verifyOtp: mockVerifyOtp,
    resendOtp: mockResendOtp,
    sendOtp: mockSendOtp,
    setAuthView: mockSetAuthView,
    setAuthMode: mockSetAuthMode,
    setPendingEmail: mockSetPendingEmail,
    enterGuestMode: mockEnterGuestMode,
    signInWithOAuth: mockSignInWithOAuth,
    retryProfileFetch: mockRetryProfileFetch,
    logout: mockLogout,
  }),
}));

describe('Phase 1 Follow-Up Auth Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockAuthMode = 'signin';
  });

  describe('IntroScreen (Sign In vs Create Account)', () => {
    it('renders both Sign in and Create account tabs', () => {
      render(<IntroScreen />);

      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in with Email/i })).toBeInTheDocument();
    });

    it('switches tabs to Create account and shows subtitle', () => {
      render(<IntroScreen />);

      const createAccountTab = screen.getByRole('button', { name: 'Create account' });
      fireEvent.click(createAccountTab);

      expect(mockSetAuthMode).toHaveBeenCalledWith('signup');
      expect(screen.getByText("We'll email you a 6-digit code.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Account with Email/i })).toBeInTheDocument();
    });

    it('submits email with the active mode', async () => {
      mockSendOtp.mockResolvedValueOnce({ ok: true });
      render(<IntroScreen />);

      const input = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(input, { target: { value: 'test@example.com' } });

      const submitBtn = screen.getByRole('button', { name: /Sign in with Email/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith('test@example.com', 'signin');
      });
    });

    it('has Apple button disabled with Coming soon label', () => {
      render(<IntroScreen />);
      const appleBtn = screen.getByRole('button', { name: /Apple \(Coming soon\)/i });
      expect(appleBtn).toBeDisabled();
    });
  });

  describe('OtpScreen', () => {
    it(`renders exactly ${OTP_LENGTH} digit input boxes`, () => {
      render(<OtpScreen />);
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(OTP_LENGTH);
    });

    it('displays anti-enumeration copy in sign-in mode with create account link', () => {
      currentMockAuthMode = 'signin';
      render(<OtpScreen />);

      expect(
        screen.getByText(/If an account exists for/i)
      ).toBeInTheDocument();
      expect(screen.getByText('create an account')).toBeInTheDocument();
    });

    it('displays direct copy in sign-up mode', () => {
      currentMockAuthMode = 'signup';
      render(<OtpScreen />);

      expect(
        screen.getByText(/We sent a 6-digit verification code to/i)
      ).toBeInTheDocument();
    });

    it('allows entering digits and updating values', () => {
      render(<OtpScreen />);
      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: '4' } });
      expect(inputs[0]).toHaveValue('4');
    });

    it('navigates back to sign in when clicking use a different email', () => {
      render(<OtpScreen />);
      const changeEmailBtn = screen.getByText('use a different email');
      fireEvent.click(changeEmailBtn);

      expect(mockSetPendingEmail).toHaveBeenCalledWith('');
      expect(mockSetAuthView).toHaveBeenCalledWith('signedOut');
    });

    it('switches to create account when clicking create an account link', async () => {
      currentMockAuthMode = 'signin';
      mockSendOtp.mockResolvedValueOnce({ ok: true });
      render(<OtpScreen />);
      const createAccountLink = screen.getByText('create an account');
      fireEvent.click(createAccountLink);

      await waitFor(() => {
        expect(mockSetAuthMode).toHaveBeenCalledWith('signup');
        expect(mockSendOtp).toHaveBeenCalledWith('user@example.com', 'signup');
      });
    });
  });

  describe('NoAccountFoundScreen', () => {
    it('renders no account found message with create account and sign out buttons', () => {
      render(<NoAccountFoundScreen />);

      expect(screen.getByText('No Centra account found')).toBeInTheDocument();

      const createBtn = screen.getByRole('button', { name: /Create account/i });
      fireEvent.click(createBtn);
      expect(mockSetAuthView).toHaveBeenCalledWith('onboarding');

      const differentAccountBtn = screen.getByRole('button', { name: /Use a different account/i });
      fireEvent.click(differentAccountBtn);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('AccountIncompleteScreen', () => {
    it('renders account setup incomplete message with continue and sign out buttons', () => {
      render(<AccountIncompleteScreen />);

      expect(screen.getByText("Your account setup isn't finished")).toBeInTheDocument();

      const continueBtn = screen.getByRole('button', { name: /Continue setup/i });
      fireEvent.click(continueBtn);
      expect(mockSetAuthView).toHaveBeenCalledWith('onboarding');

      const signOutBtn = screen.getByRole('button', { name: /Sign out/i });
      fireEvent.click(signOutBtn);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('ProfileErrorScreen', () => {
    it('renders error message and provides retry and sign out actions', async () => {
      mockRetryProfileFetch.mockResolvedValueOnce(undefined);
      render(<ProfileErrorScreen />);

      expect(screen.getByText("Couldn't load your account")).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryBtn);
      await waitFor(() => {
        expect(mockRetryProfileFetch).toHaveBeenCalled();
      });

      const signOutBtn = screen.getByRole('button', { name: /Sign out/i });
      fireEvent.click(signOutBtn);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('SupabaseConfigErrorScreen', () => {
    it('displays configuration alert and missing environment variable hints', () => {
      render(<SupabaseConfigErrorScreen />);

      expect(screen.getByText('Configuration Required')).toBeInTheDocument();
      expect(screen.getByText(/VITE_SUPABASE_URL/i)).toBeInTheDocument();
      expect(screen.getByText(/VITE_SUPABASE_ANON_KEY/i)).toBeInTheDocument();
    });
  });

  describe('LoadingSplashScreen', () => {
    it('renders Centra branding and loading status', () => {
      render(<LoadingSplashScreen />);

      expect(screen.getByText('Centra')).toBeInTheDocument();
      expect(screen.getByText(/Starting Centra/i)).toBeInTheDocument();
    });
  });

  describe('CentraDB.clearAllData', () => {
    it('removes all centra_* keys from localStorage on logout', () => {
      localStorage.setItem('centra_test_key_1', 'val1');
      localStorage.setItem('centra_test_key_2', 'val2');
      localStorage.setItem('other_app_key', 'keep_me');

      CentraDB.clearAllData();

      expect(localStorage.getItem('centra_test_key_1')).toBeNull();
      expect(localStorage.getItem('centra_test_key_2')).toBeNull();
      expect(localStorage.getItem('other_app_key')).toBe('keep_me');
    });
  });
});
