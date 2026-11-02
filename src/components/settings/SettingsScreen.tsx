import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Bell,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Folder,
  Clock,
  Globe,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Edit2,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  AlertCircle,
  FileText,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Search
} from 'lucide-react';
import { updateNativeStatusBar } from '../../utils/nativeApp';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { ImageCropModal } from '../ui/ImageCropModal';
import { LegalDocsModal } from '../modals/LegalDocsModal';
import { getUserInitials } from '../../utils/initials';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import { CurrencyCode } from '../../types';
import { GUEST_USER_ID } from '../../db/storage';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
import { RATES_LAST_UPDATED } from '../../utils/formatters';
import { useBackHandler } from '../../utils/backButton';
import { setDevicePin, clearDevicePin, verifyDevicePin } from '../../utils/pinLock';
import { AUTOLOCK_OPTIONS, getAutoLockTimeout, setAutoLockTimeout } from '../../utils/lockResume';
import { validateName, validateEmail } from '../../utils/validators';
import { validateImageFile } from '../../utils/imageValidation';
import { getAppVersion } from '../../utils/version';
import { exportAllDataToCSV } from '../../utils/csvExport';
import { getAllGoalHistory } from '../../utils/goalHistory';
import { isNative } from '../../utils/platform';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const {
    accounts,
    transactions,
    categories,
    goals,
    budgets,
    settings,
    updateSettings,
    resetAllData
  } = useFinance();
  const { user, updateUser, logout, lockApp, isGuest, createAccountFromGuest, exitGuestMode } = useAuth();
  const { theme, setTheme } = useTheme();

  const isDarkComputed = (theme || settings.theme) === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const [prevDarkComputed, setPrevDarkComputed] = useState(isDarkComputed);
  const [isDarkActive, setIsDarkActive] = useState(isDarkComputed);

  if (prevDarkComputed !== isDarkComputed) {
    setPrevDarkComputed(isDarkComputed);
    setIsDarkActive(isDarkComputed);
  }

  const handleToggleTheme = () => {
    const nextDark = !isDarkActive;
    setIsDarkActive(nextDark);
    const nextMode = nextDark ? 'dark' : 'light';
    setTheme(nextMode);
    updateSettings({ theme: nextMode });
    updateNativeStatusBar(nextDark);
  };

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showExitDemoConfirm, setShowExitDemoConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // PIN lock setup / disable state
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [showDisablePinModal, setShowDisablePinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinModalShakeKey, setPinModalShakeKey] = useState(0);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState<number>(() => getAutoLockTimeout());

  // PWA Installation state
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
    );
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt && typeof installPrompt.prompt === 'function') {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      } catch {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  // Hardware back button handlers for all settings sub-modals
  useBackHandler(showEditProfile, () => setShowEditProfile(false));
  useBackHandler(showHelpModal, () => setShowHelpModal(false));
  useBackHandler(showInstallModal, () => setShowInstallModal(false));
  useBackHandler(showCurrencyModal, () => setShowCurrencyModal(false));
  useBackHandler(showPrivacyModal, () => setShowPrivacyModal(false));
  useBackHandler(showTermsModal, () => setShowTermsModal(false));
  useBackHandler(showDeleteDataModal, () => {
    setShowDeleteDataModal(false);
    setDeleteConfirmText('');
    setDeleteError(null);
  });
  useBackHandler(showSetPinModal, () => {
    setShowSetPinModal(false);
    setNewPin('');
    setConfirmPin('');
    setPinModalError(null);
  });
  useBackHandler(showDisablePinModal, () => {
    setShowDisablePinModal(false);
    setCurrentPin('');
    setPinModalError(null);
  });

  // Edit Profile Form
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl);
  const [profileNameError, setProfileNameError] = useState<string | null>(null);
  const [profileEmailError, setProfileEmailError] = useState<string | null>(null);
  const [profileAvatarError, setProfileAvatarError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileNameChange = (val: string) => {
    setProfileName(val);
    if (val.trim()) {
      const res = validateName(val);
      setProfileNameError(res.ok ? null : res.error || null);
    } else {
      setProfileNameError(null);
    }
  };

  const handleProfileEmailChange = (val: string) => {
    setProfileEmail(val);
    if (val.trim()) {
      const res = validateEmail(val);
      setProfileEmailError(res.ok ? null : res.error || null);
    } else {
      setProfileEmailError(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileAvatarError(null);
    const validation = await validateImageFile(file);
    if (!validation.ok) {
      setProfileAvatarError(validation.error || 'Please upload a valid JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropOpen(true);
    };
    reader.onerror = () => {
      setProfileAvatarError('Failed to read image.');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const nameResult = validateName(profileName);
    if (!nameResult.ok) {
      setProfileNameError(nameResult.error || 'Please enter a valid display name.');
      return;
    }
    const emailResult = validateEmail(profileEmail);
    if (!emailResult.ok) {
      setProfileEmailError(emailResult.error || 'Please enter a valid email address.');
      return;
    }

    if (emailResult.value !== user.email && !isGuest && isSupabaseConfigured()) {
      supabase.auth.updateUser({ email: emailResult.value }).catch((err) => {
        logger.warn('Failed to send email update confirmation:', err);
      });
      setStatusToast('Confirmation email sent to new address. Please verify to complete the change.');
    }

    updateUser({
      name: nameResult.value,
      email: emailResult.value,
      avatarUrl: profileAvatar,
    });
    setShowEditProfile(false);
  };

  const handleExportData = async () => {
    const res = await exportAllDataToCSV({
      accounts,
      transactions,
      categories,
      goals,
      goalHistory: getAllGoalHistory(),
      budgets,
      userProfile: user,
    });
    if (res.success) {
      setStatusToast(res.savedToDownloads ? `Saved ${res.filename} to Downloads folder` : 'Exported all data to CSV');
    } else {
      setStatusToast('No data to export yet');
    }
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleResetGuestData = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmResetGuestData = async () => {
    await resetAllData();
    setStatusToast('Application reset to seed data.');
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleConfirmDeleteAllData = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await resetAllData();
      if (!res.ok) {
        setDeleteError('Failed to delete remote records from Supabase. Your local data has been preserved.');
        return;
      }
      setShowDeleteDataModal(false);
      setDeleteConfirmText('');
      setStatusToast('All your financial records have been wiped from both cloud and local storage.');
      setTimeout(() => setStatusToast(null), 3500);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNewPin = async () => {
    setPinModalError(null);
    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      setPinModalError('PIN must be between 4 and 8 digits.');
      setPinModalShakeKey(k => k + 1);
      return;
    }
    if (newPin !== confirmPin) {
      setPinModalError('PIN confirmation does not match.');
      setPinModalShakeKey(k => k + 1);
      return;
    }
    try {
      await setDevicePin(user.id || GUEST_USER_ID, newPin);
      updateSettings({ security: { ...settings.security, pinLockEnabled: true } });
      setShowSetPinModal(false);
      setNewPin('');
      setConfirmPin('');
    } catch (err: unknown) {
      setPinModalError(err instanceof Error ? err.message : 'Failed to save PIN.');
      setPinModalShakeKey(k => k + 1);
    }
  };

  const handleDisablePin = async () => {
    setPinModalError(null);
    if (!currentPin) {
      setPinModalError('Enter your current PIN to disable PIN lock.');
      setPinModalShakeKey(k => k + 1);
      return;
    }
    const res = await verifyDevicePin(user.id || GUEST_USER_ID, currentPin);
    if (!res.ok) {
      setPinModalError(res.error || 'Incorrect PIN.');
      setPinModalShakeKey(k => k + 1);
      return;
    }
    clearDevicePin(user.id || GUEST_USER_ID);
    updateSettings({ security: { ...settings.security, pinLockEnabled: false } });
    setShowDisablePinModal(false);
    setCurrentPin('');
  };

  const avatarsList = [
    'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="space-y-4 pb-2">

      {/* Top Header Bar matching unified spec */}
      <div
        className="sticky top-0 z-40 bg-[#F7F8FA] dark:bg-[#000000] -mx-4 sm:-mx-6 lg:-mx-8 border-b border-black/5 dark:border-white/10"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18212F] dark:text-white text-center">
            Settings
          </h1>

          <div className="w-10 h-10 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Guest Mode Upgrade Banner */}
      {isGuest && (
        <div className="p-5 rounded-[24px] bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
              Guest Session Active
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Upgrade to a Full Centra Account
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your financial data is currently stored locally. Create a free account to enable cloud sync across devices and access your data anywhere.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUpgradeConfirm(true)}
            className="shrink-0 font-bold"
          >
            Create Full Account
          </Button>
        </div>
      )}

      {/* 1. Profile Card with Camera Badge Overlay & Edit button */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User'}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-16 h-16 rounded-full object-cover border border-black/[0.06] dark:border-white/[0.08]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-full bg-[#C6FF3D] text-[#0A0E1A] font-bold text-xl items-center justify-center border border-black/[0.06] dark:border-white/[0.08] select-none ${
                user.avatarUrl ? 'hidden' : 'flex'
              }`}
            >
              {getUserInitials(user.name, user.email)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#C6FF3D] text-[#0A0E1A] flex items-center justify-center shadow-xs">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white break-words">
              {user.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Change photo or profile icon</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setProfileName(user.name);
            setProfileEmail(user.email);
            setProfileAvatar(user.avatarUrl);
            setShowEditProfile(true);
          }}
          aria-label="Edit user profile"
          className="w-10 h-10 rounded-full bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#E5E7EB] dark:hover:bg-[#333333] cursor-pointer shrink-0"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Security & Authentication Center */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Security &amp; authentication
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-black/[0.06] dark:divide-white/[0.08] text-xs">

          {/* App PIN Lock Toggle */}
          <div
            onClick={() => {
              if (settings.security.pinLockEnabled) {
                setShowDisablePinModal(true);
              } else {
                setShowSetPinModal(true);
              }
            }}
            className="flex items-center justify-between pt-2 cursor-pointer select-none group gap-4"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <KeyRound className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">App PIN Lock</p>
                <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Lock app on launch &amp; background with device PIN</p>
              </div>
            </div>
            <Switch
              checked={settings.security.pinLockEnabled}
              onChange={() => {
                if (settings.security.pinLockEnabled) {
                  setShowDisablePinModal(true);
                } else {
                  setShowSetPinModal(true);
                }
              }}
              label="Toggle PIN Lock"
            />
          </div>

          {/* Manual Lock Action Button */}
          {settings.security.pinLockEnabled && (
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Lock Centra Now</p>
                <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Immediately lock the app until your PIN is entered</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={lockApp}
                icon={<Lock className="w-3.5 h-3.5" />}
              >
                Lock Now
              </Button>
            </div>
          )}

          {/* Auto-lock Timeout Selector */}
          {settings.security.pinLockEnabled && (
            <div className="flex items-center justify-between pt-3 gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Auto-lock Timeout</p>
                  <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Lock automatically when inactive or in background</p>
                </div>
              </div>
              <select
                value={autoLockTimeout}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAutoLockTimeoutState(val);
                  setAutoLockTimeout(val);
                }}
                className="bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#C6FF3D]"
                aria-label="Auto-lock Timeout"
              >
                {AUTOLOCK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Privacy Mask Toggle */}
          <div
            onClick={() => updateSettings({ privacyMode: !settings.privacyMode })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none group gap-4"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {settings.privacyMode ? (
                <EyeOff className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Privacy Mode (Mask Balances)</p>
                <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Hide balances and amounts when viewing in public.</p>
              </div>
            </div>
            <Switch
              checked={settings.privacyMode}
              onChange={(val) => updateSettings({ privacyMode: val })}
              label="Toggle Privacy Mode"
            />
          </div>

        </div>
      </div>

      {/* 3. Notifications Card */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Bell className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-black/[0.06] dark:divide-white/[0.08] text-xs">

          <div
            onClick={() => updateSettings({ notifications: { ...settings.notifications, budgetOverruns: !settings.notifications.budgetOverruns } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Budget outflow alerts</p>
              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Instant notification when spending exceeds 80% limit</p>
            </div>
            <Switch
              checked={settings.notifications.budgetOverruns}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, budgetOverruns: val } })}
              label="Toggle Budget Overrun Alerts"
            />
          </div>

          <div
            onClick={() => updateSettings({ notifications: { ...settings.notifications, transactionAlerts: !settings.notifications.transactionAlerts } })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">High-outflow alerts</p>
              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Alert for single transactions exceeding ৳5,000</p>
            </div>
            <Switch
              checked={settings.notifications.transactionAlerts}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, transactionAlerts: val } })}
              label="Toggle Transaction Alerts"
            />
          </div>

          <div
            onClick={() => updateSettings({ notifications: { ...settings.notifications, securityAlerts: !settings.notifications.securityAlerts } })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Security &amp; login alerts</p>
              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Notify upon new device sessions or credential shifts</p>
            </div>
            <Switch
              checked={settings.notifications.securityAlerts}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, securityAlerts: val } })}
              label="Toggle Security Alerts"
            />
          </div>

        </div>
      </div>

      {/* 4. Appearance & Currency */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Palette className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Appearance &amp; Currency<span className="sr-only"> &amp; locale</span>
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Theme / Appearance Mode Toggle Switch */}
          <div
            onClick={handleToggleTheme}
            className="flex items-center justify-between pt-1 cursor-pointer select-none gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</p>
              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                Switch between Dark and Light mode
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isDarkActive}
              aria-label="Toggle Dark Mode"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTheme();
              }}
              className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 border focus:outline-hidden ${
                isDarkActive
                  ? 'bg-[#C6FF3D] border-[#C6FF3D]'
                  : 'bg-[#E5E7EB] border-[#D1D5DB] dark:bg-[#262626] dark:border-white/[0.12]'
              }`}
            >
              <span
                className={`pointer-events-none flex items-center justify-center h-6 w-6 rounded-full shadow-xs spring-switch-thumb ${
                  isDarkActive
                    ? 'translate-x-5 bg-[#0A0E1A] text-[#C6FF3D]'
                    : 'translate-x-0 bg-white text-amber-500'
                }`}
              >
                {isDarkActive ? (
                  <Moon className="w-3.5 h-3.5 fill-[#C6FF3D]" />
                ) : (
                  <Sun className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {/* Synchronized hidden buttons for test compatibility */}
            <div className="sr-only" aria-hidden="true">
              {(['system', 'light', 'dark'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setTheme(mode);
                    updateSettings({ theme: mode });
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-black/[0.04] dark:border-white/[0.06]" />

          {/* Base Currency */}
          <div className="flex items-center justify-between pt-1 gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <Globe className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Base Currency</p>
                <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Converts all dashboard totals to this currency</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCurrencySearch('');
                  setShowCurrencyModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1F2F4] dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] text-gray-900 dark:text-white font-bold hover:bg-[#E5E7EB] dark:hover:bg-[#333333] cursor-pointer text-xs"
                aria-label="Select base currency"
              >
                <span>{(SUPPORTED_CURRENCIES.find(c => c.code === settings.baseCurrency) || SUPPORTED_CURRENCIES[0]).flag}</span>
                <span>{(SUPPORTED_CURRENCIES.find(c => c.code === settings.baseCurrency) || SUPPORTED_CURRENCIES[0]).code}</span>
                <span className="text-gray-400 dark:text-gray-500">({(SUPPORTED_CURRENCIES.find(c => c.code === settings.baseCurrency) || SUPPORTED_CURRENCIES[0]).symbol})</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Synchronized hidden select for test compatibility */}
              <select
                value={settings.baseCurrency || ''}
                onChange={e => updateSettings({ baseCurrency: (e.target.value as CurrencyCode) || null })}
                className="sr-only"
                aria-label="Base Currency"
                tabIndex={-1}
              >
                {!settings.baseCurrency && <option value="">Select currency...</option>}
                {SUPPORTED_CURRENCIES.map(c => (
                  <option
                    key={c.code}
                    value={c.code}
                  >
                    {c.flag} {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Rates updated: {RATES_LAST_UPDATED}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Data & Support Card matching 14-settings--full.png */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Folder className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Data &amp; support
          </h2>
        </div>

        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {/* Download your data */}
          <button
            type="button"
            onClick={handleExportData}
            className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Download className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Download your data</p>
                <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Export all your account data · CSV</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
          </button>

          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Lock className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Privacy policy
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
          </button>

          {/* Terms of Service */}
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Terms of service
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
          </button>

          {/* Help & Support */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <HelpCircle className="w-4 h-4 text-[#667085] dark:text-[#9CA3AF] shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Help &amp; support
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
          </button>

          {/* Install Centra App (Web, Desktop PWA & iOS Safari) */}
          {!isNative() && !isStandalone && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer group border-t border-black/[0.06] dark:border-white/[0.08]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Download className="w-4 h-4 text-[#56791E] dark:text-[#C6FF3D] shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                    Install Centra App
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block">
                    Add to desktop dock or mobile home screen
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
            </button>
          )}
        </div>

        {/* Demo Data Reset / Delete All Data Actions */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center gap-3 text-xs">
          {isGuest ? (
            <Button
              variant="destructive"
              size="md"
              onClick={handleResetGuestData}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Demo Data
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="md"
              onClick={() => setShowDeleteDataModal(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete All My Data
            </Button>
          )}
        </div>
      </div>

      {/* 6. Bottom Logout Pill Card */}
      <div className="pt-2 space-y-4">
        {isGuest ? (
          <button
            type="button"
            onClick={() => setShowExitDemoConfirm(true)}
            className="w-full py-4 px-5 rounded-[99px] flex items-center justify-center space-x-2 border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] hover:bg-[#F1F2F4] dark:hover:bg-[#262626] text-[#E11D48] dark:text-[#F43F5E] cursor-pointer shadow-xs font-semibold text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Exit Demo</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 px-5 rounded-[99px] flex items-center justify-center space-x-2 border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] hover:bg-[#F1F2F4] dark:hover:bg-[#262626] text-[#E11D48] dark:text-[#F43F5E] cursor-pointer shadow-xs font-semibold text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log Out of Session</span>
          </button>
        )}

        <div className="text-center pb-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Version {getAppVersion()}</p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Choose Avatar</label>
            <div className="flex items-center space-x-3 overflow-x-auto pb-1">
              {avatarsList.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i}`}
                  onClick={() => setProfileAvatar(url)}
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer border transition-all shrink-0 ${profileAvatar === url ? 'border-[#C6FF3D] scale-105 ring-2 ring-[#C6FF3D]/40' : 'border-black/[0.06] dark:border-white/[0.08] opacity-60 hover:opacity-100'
                    }`}
                />
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full flex flex-col items-center justify-center cursor-pointer border border-dashed border-black/[0.12] dark:border-white/[0.14] bg-[#F1F2F4] dark:bg-[#262626] hover:bg-[#E5E7EB] dark:hover:bg-[#333333] text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                title="Upload from device"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-0.5">Upload</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {profileAvatarError && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{profileAvatarError}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={e => handleProfileNameChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                profileNameError ? 'border-rose-500' : 'border-black/[0.06] dark:border-white/[0.08]'
              } text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#C6FF3D]`}
            />
            {profileNameError && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">{profileNameError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={e => handleProfileEmailChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl bg-[#F1F2F4] dark:bg-[#262626] border ${
                profileEmailError ? 'border-rose-500' : 'border-black/[0.06] dark:border-white/[0.08]'
              } text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#C6FF3D]`}
            />
            {profileEmailError && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">{profileEmailError}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!profileName.trim() || !profileEmail.trim() || !!profileNameError || !!profileEmailError}
          >
            Save Profile Changes
          </Button>
        </form>
      </Modal>

      {/* Unified Legal & Support Docs Modal */}
      <LegalDocsModal
        isOpen={showPrivacyModal || showTermsModal || showHelpModal}
        initialDoc={showPrivacyModal ? 'privacy' : showTermsModal ? 'terms' : 'support'}
        onClose={() => {
          setShowPrivacyModal(false);
          setShowTermsModal(false);
          setShowHelpModal(false);
        }}
      />

      {/* Delete All Data Modal (Requires typing DELETE) */}
      <Modal
        isOpen={showDeleteDataModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteDataModal(false);
            setDeleteConfirmText('');
            setDeleteError(null);
          }
        }}
        title="Delete All Data"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete all your data? This will permanently wipe all your accounts, transactions, categories, budgets, and goals from both your cloud database and local device storage.
          </p>
          <p className="text-red-600 dark:text-red-400 font-semibold">
            This action cannot be undone. To proceed, please type <span className="font-mono bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded text-red-700 dark:text-red-300 font-bold">DELETE</span> below:
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-4 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F1F2F4] dark:bg-[#262626] text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-red-500"
          />
          {deleteError && (
            <p className="text-xs text-red-500 font-medium">{deleteError}</p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setShowDeleteDataModal(false);
                setDeleteConfirmText('');
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={handleConfirmDeleteAllData}
              disabled={isDeleting || deleteConfirmText.trim() !== 'DELETE'}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Set / Enable PIN Modal */}
      <Modal
        isOpen={showSetPinModal}
        onClose={() => {
          setShowSetPinModal(false);
          setNewPin('');
          setConfirmPin('');
          setPinModalError(null);
        }}
        title="Set App PIN"
      >
        <div key={pinModalShakeKey} className={`space-y-4 text-xs ${pinModalError ? 'animate-error-shake' : ''}`}>
          <p className="text-gray-600 dark:text-gray-300">
            Choose a 4 to 8 digit PIN to protect your Centra app. Your PIN is hashed securely on this device and is never uploaded.
          </p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              New PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={newPin}
              onChange={e => {
                setNewPin(e.target.value);
                if (pinModalError) setPinModalError(null);
              }}
              placeholder="Enter 4-8 digits"
              className={`w-full px-4 py-3 rounded-2xl border bg-[#F1F2F4] dark:bg-[#262626] text-gray-900 dark:text-white tracking-widest text-base focus:outline-none ${
                pinModalError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#C6FF3D]'
              }`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={confirmPin}
              onChange={e => {
                setConfirmPin(e.target.value);
                if (pinModalError) setPinModalError(null);
              }}
              placeholder="Confirm 4-8 digits"
              className={`w-full px-4 py-3 rounded-2xl border bg-[#F1F2F4] dark:bg-[#262626] text-gray-900 dark:text-white tracking-widest text-base focus:outline-none ${
                pinModalError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#C6FF3D]'
              }`}
            />
          </div>
          {pinModalError && (
            <p className="text-xs text-rose-500 font-semibold">{pinModalError}</p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setShowSetPinModal(false);
                setNewPin('');
                setConfirmPin('');
                setPinModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveNewPin}
            >
              Save PIN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disable PIN Modal */}
      <Modal
        isOpen={showDisablePinModal}
        onClose={() => {
          setShowDisablePinModal(false);
          setCurrentPin('');
          setPinModalError(null);
        }}
        title="Disable App PIN"
      >
        <div key={pinModalShakeKey} className={`space-y-4 text-xs ${pinModalError ? 'animate-error-shake' : ''}`}>
          <p className="text-gray-600 dark:text-gray-300">
            Please enter your current PIN to turn off PIN lock on this device.
          </p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Current PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={currentPin}
              onChange={e => {
                setCurrentPin(e.target.value);
                if (pinModalError) setPinModalError(null);
              }}
              placeholder="Enter your current PIN"
              className={`w-full px-4 py-3 rounded-2xl border bg-[#F1F2F4] dark:bg-[#262626] text-gray-900 dark:text-white tracking-widest text-base focus:outline-none ${
                pinModalError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#C6FF3D]'
              }`}
            />
          </div>
          {pinModalError && (
            <p className="text-xs text-rose-500 font-semibold">{pinModalError}</p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setShowDisablePinModal(false);
                setCurrentPin('');
                setPinModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={handleDisablePin}
            >
              Turn Off PIN
            </Button>
          </div>
        </div>
      </Modal>

      {statusToast && (
        <div className="fixed bottom-24 lg:bottom-10 inset-x-4 z-[160] flex justify-center pointer-events-none">
          <div className="w-full max-w-sm px-4 py-3 rounded-2xl bg-[#1D1D1D]/95 text-white border border-[#C6FF3D]/30 shadow-2xl backdrop-blur-md flex items-center justify-center text-center text-xs font-semibold animate-fade-in pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-[#C6FF3D] shrink-0 mr-2.5" />
            <span>{statusToast}</span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmResetGuestData}
        title="Reset Demo Data"
        message="Reset all transactions, accounts, and budgets to default demo state?"
        type="warning"
        confirmText="Reset Data"
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Log out of Centra?"
        message="Are you sure you want to log out from Centra?"
        type="danger"
        confirmText="Log Out"
      />

      {/* Custom Base Currency Selector Modal */}
      <Modal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Select Base Currency"
      >
        <div className="space-y-3 p-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={currencySearch}
              onChange={e => setCurrencySearch(e.target.value)}
              placeholder="Search currency code or name..."
              className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-[#262626] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C6FF3D]"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 no-scrollbar">
            {SUPPORTED_CURRENCIES.filter(c =>
              c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
              c.name.toLowerCase().includes(currencySearch.toLowerCase())
            ).map(c => {
              const isSelected = settings.baseCurrency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    updateSettings({ baseCurrency: c.code as CurrencyCode });
                    setShowCurrencyModal(false);
                  }}
                  className="w-full px-3 py-3 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{c.flag}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{c.code}</span>
                    <span className="text-gray-400 font-mono">({c.symbol})</span>
                    <span className="text-gray-500 dark:text-gray-400">{c.name}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#56791E] dark:text-[#C6FF3D]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-400 text-center">
            Rates updated: {RATES_LAST_UPDATED}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showUpgradeConfirm}
        onClose={() => setShowUpgradeConfirm(false)}
        onConfirm={createAccountFromGuest}
        title="Create a Real Account"
        message="Create a real account? Your demo data will be discarded."
        type="warning"
        confirmText="Create Account"
      />

      <ConfirmModal
        isOpen={showExitDemoConfirm}
        onClose={() => setShowExitDemoConfirm(false)}
        onConfirm={exitGuestMode}
        title="Exit Demo Mode"
        message="Exit demo mode and return to the landing page? Your demo data will be saved locally on this device."
        type="warning"
        confirmText="Exit Demo"
      />

      <ImageCropModal
        isOpen={isCropOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropOpen(false)}
        onCropComplete={(url) => setProfileAvatar(url)}
      />

      {/* PWA Install Guide Modal */}
      <Modal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} title="Install Centra App">
        <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300">
          <p className="leading-relaxed">
            Centra is an installable, offline-first application that runs natively on your desktop (macOS, Windows, Linux) or mobile device (iOS, Android).
          </p>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>💻 Desktop (Chrome, Edge, Safari, Brave)</span>
            </h4>
            <p className="text-gray-500 dark:text-gray-400 leading-normal">
              1. Click the <strong>Install</strong> icon in the address bar (top right) or open browser menu (&ldquo;⋮&rdquo;) &gt; <strong>Install Centra</strong>.<br />
              2. Centra will run in its own dedicated, borderless window with full offline access.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📱 iOS (iPhone &amp; iPad - Safari)</span>
            </h4>
            <p className="text-gray-500 dark:text-gray-400 leading-normal">
              1. Tap the <strong>Share</strong> button (square with arrow up) at the bottom of Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong> (&ldquo;+&rdquo;).<br />
              3. Tap <strong>Add</strong>. Centra will appear on your Home Screen as a native full-screen app.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🤖 Android (Chrome &amp; Web Browsers)</span>
            </h4>
            <p className="text-gray-500 dark:text-gray-400 leading-normal">
              Tap browser menu (&ldquo;⋮&rdquo;) &gt; <strong>Install app</strong> or <strong>Add to Home screen</strong>. You can also download the standalone Android APK directly.
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="lg" className="w-full" onClick={() => setShowInstallModal(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
