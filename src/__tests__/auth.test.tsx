import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OtpScreen, OTP_LENGTH } from '../components/auth/OtpScreen';
import { SupabaseConfigErrorScreen } from '../components/auth/SupabaseConfigErrorScreen';
import { LoadingSplashScreen } from '../components/auth/LoadingSplashScreen';
import { CentraDB } from '../db/storage';

// Mock useAuth
const mockVerifyOtp = vi.fn();
const mockResendOtp = vi.fn();
const mockSetAuthView = vi.fn();
const mockSetPendingEmail = vi.fn();
const mockEnterGuestMode = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    pendingEmail: 'user@example.com',
    verifyOtp: mockVerifyOtp,
    resendOtp: mockResendOtp,
    setAuthView: mockSetAuthView,
    setPendingEmail: mockSetPendingEmail,
    enterGuestMode: mockEnterGuestMode,
  }),
}));

describe('Phase 1 Auth Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OtpScreen', () => {
    it(`renders exactly ${OTP_LENGTH} digit input boxes and displays recipient email`, () => {
      render(<OtpScreen />);

      expect(screen.getByText('Enter verification code')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(OTP_LENGTH);
    });

    it('allows entering digits and updating values', () => {
      render(<OtpScreen />);

      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: '4' } });
      expect(inputs[0]).toHaveValue('4');
    });

    it('navigates back to sign in when clicking back or change email', () => {
      render(<OtpScreen />);

      const changeEmailBtn = screen.getByText('Use a different email');
      fireEvent.click(changeEmailBtn);

      expect(mockSetPendingEmail).toHaveBeenCalledWith('');
      expect(mockSetAuthView).toHaveBeenCalledWith('signedOut');
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
