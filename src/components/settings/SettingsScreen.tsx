import React, { useState, useRef } from 'react';
import {
  Shield,
  Bell,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Fingerprint,
  Globe,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Edit2,
  Camera,
  Trash2,
  Lock,
  KeyRound
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { CurrencyCode } from '../../types';
import { CentraDB } from '../../db/storage';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
import { RATES_LAST_UPDATED } from '../../utils/formatters';
import { hasDevicePin, setDevicePin, clearDevicePin, verifyDevicePin } from '../../utils/pinLock';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData
  } = useFinance();
  const { user, updateUser, logout, lockApp, isGuest, createAccountFromGuest } = useAuth();

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  // Edit Profile Form
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setProfileAvatar(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: profileName.trim(),
      email: profileEmail.trim(),
      avatarUrl: profileAvatar,
    });
    setShowEditProfile(false);
  };

  const handleExportData = () => {
    const json = CentraDB.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `centra_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    } catch (err: any) {
      setDeleteError(err?.message || 'Error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNewPin = async () => {
    setPinModalError(null);
    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      setPinModalError('PIN must be between 4 and 8 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinModalError('PIN confirmation does not match.');
      return;
    }
    try {
      await setDevicePin(user.id || 'guest', newPin);
      updateSettings({ security: { ...settings.security, pinLockEnabled: true } });
      setShowSetPinModal(false);
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinModalError(err?.message || 'Failed to save PIN.');
    }
  };

  const handleDisablePin = async () => {
    setPinModalError(null);
    if (!currentPin) {
      setPinModalError('Enter your current PIN to disable PIN lock.');
      return;
    }
    const res = await verifyDevicePin(user.id || 'guest', currentPin);
    if (!res.ok) {
      setPinModalError(res.error || 'Incorrect PIN.');
      return;
    }
    clearDevicePin(user.id || 'guest');
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
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Preferences, security, and application settings
        </p>
      </div>

      {/* Guest Mode Upgrade Banner */}
      {isGuest && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
              Guest Session Active
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Upgrade to a Full Centra Account
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your financial data is currently stored locally. Create a free account to enable encrypted cloud backup and sync across devices.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={createAccountFromGuest}
            className="shrink-0 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold"
          >
            Create Full Account
          </Button>
        </div>
      )}

      {/* 1. Profile Card with Edit button grouped close to profile info */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] flex items-center justify-between transition-colors shadow-xs">
        <div className="flex items-center space-x-4 min-w-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-[#232C45] shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg";
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 font-bold text-lg flex items-center justify-center border border-gray-200 dark:border-[#232C45] shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white break-words">
                {user.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 text-xs font-semibold">
                Personal
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setProfileName(user.name);
                  setProfileEmail(user.email);
                  setProfileAvatar(user.avatarUrl);
                  setShowEditProfile(true);
                }}
                icon={<Edit2 className="w-3.5 h-3.5" />}
                aria-label="Edit user profile"
                className="ml-1"
              >
                Edit
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 2. Security & Authentication Center */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] space-y-4 transition-colors shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Security &amp; authentication
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-gray-100 dark:divide-[#232C45] text-xs">

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
                <p className="font-semibold text-gray-900 dark:text-white">App PIN Lock</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lock app on launch &amp; background with device PIN</p>
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
                <p className="font-semibold text-gray-900 dark:text-white">Lock Centra Now</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Immediately lock the app until your PIN is entered</p>
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

          {/* Biometrics Toggle */}
          <div
            onClick={() => updateSettings({ security: { ...settings.security, biometricEnabled: !settings.security.biometricEnabled } })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none group gap-4"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Fingerprint className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Biometric Login</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">TouchID / FaceID (Mobile devices only)</p>
              </div>
            </div>
            <Switch
              checked={settings.security.biometricEnabled}
              onChange={(val) => updateSettings({ security: { ...settings.security, biometricEnabled: val } })}
              label="Toggle Biometric Login"
            />
          </div>

          {/* Privacy Mask Toggle */}
          <div
            onClick={() => updateSettings({ privacyMode: !settings.privacyMode })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none group gap-4"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {settings.privacyMode ? (
                <EyeOff className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Privacy Mode (Mask Balances)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hide numbers when viewing in public places</p>
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

      {/* 3. Notification Rules */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] space-y-4 transition-colors shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Notification rules
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-gray-100 dark:divide-[#232C45] text-xs">

          <div
            onClick={() => updateSettings({ notifications: { ...settings.notifications, budgetOverruns: !settings.notifications.budgetOverruns } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none gap-4"
          >
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Budget Overrun Alerts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Instant notification when spending exceeds 80% limit</p>
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
              <p className="font-semibold text-gray-900 dark:text-white">High Outflow Alerts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Alert for single transactions exceeding ৳5,000</p>
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
              <p className="font-semibold text-gray-900 dark:text-white">Security &amp; Login Alerts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Notify upon new device sessions or credential shifts</p>
            </div>
            <Switch
              checked={settings.notifications.securityAlerts}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, securityAlerts: val } })}
              label="Toggle Security Alerts"
            />
          </div>

        </div>
      </div>

      {/* 4. Appearance & System Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] space-y-4 transition-colors shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Palette className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Appearance &amp; locale
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          {/* Base Currency */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Base Currency</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Converts all dashboard totals to this currency</p>
              </div>
            </div>
            <div className="text-right">
              <select
                value={settings.baseCurrency || ''}
                onChange={e => updateSettings({ baseCurrency: (e.target.value as CurrencyCode) || null })}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white font-bold focus:outline-none focus:border-brand-500 cursor-pointer text-xs max-w-[200px]"
              >
                {!settings.baseCurrency && <option value="">Select currency...</option>}
                {SUPPORTED_CURRENCIES.map(c => (
                  <option
                    key={c.code}
                    value={c.code}
                    className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white"
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

      {/* 5. Data Management & Backup */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] space-y-4 transition-colors shadow-xs">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Data management
        </h2>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportData}
            icon={<Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
          >
            Export JSON
          </Button>

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
            <>
              {/*
                TODO: Account deletion requires a server-side Supabase Edge Function using the
                service_role key to invoke supabase.auth.admin.deleteUser(userId).
                Client-side RLS prevents authenticated users from deleting directly from auth.users.
              */}
              <Button
                variant="destructive"
                size="md"
                onClick={() => setShowDeleteDataModal(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete All My Data
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 6. Support & Logout */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="w-full py-3.5 px-5 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-[#232C45] bg-white dark:bg-[#121A2C] hover:bg-gray-50 dark:hover:bg-[#1A233A] transition-colors cursor-pointer group select-none shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <HelpCircle className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">
              Centra Help &amp; Support FAQ
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0" />
        </button>

        {/* Standard button width for Logout with left-aligned icon & text */}
        <div className="flex justify-start">
          <Button
            variant="destructive"
            size="md"
            onClick={() => {
              setShowLogoutConfirm(true);
            }}
            icon={<LogOut className="w-4 h-4" />}
          >
            Log Out of Session
          </Button>
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
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer border transition-all shrink-0 ${profileAvatar === url ? 'border-brand-500 scale-105 ring-2 ring-brand-500/40' : 'border-gray-200 dark:border-[#232C45] opacity-60 hover:opacity-100'
                    }`}
                />
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full flex flex-col items-center justify-center cursor-pointer border border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#0A0E1A] hover:bg-gray-200 dark:hover:bg-[#1A233A] text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                title="Upload from device"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-0.5">Upload</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={e => setProfileEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
          >
            Save Profile Changes
          </Button>
        </form>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Centra Help &amp; FAQ">
        <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-white">How is my balance calculated?</h4>
            <p className="text-gray-500 dark:text-gray-400">Total balance is aggregated in real-time across all connected wallets and bank accounts in your chosen base currency (৳ BDT).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-white">How do I export my data?</h4>
            <p className="text-gray-500 dark:text-gray-400">Navigate to Data Management in Settings and click "Export JSON" to download your complete encrypted local database.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setShowHelpModal(false)}
          >
            Close FAQ
          </Button>
        </div>
      </Modal>

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
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#232C45] bg-gray-50 dark:bg-[#0A0E1A] text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-red-500"
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
        <div className="space-y-4 text-xs">
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
              onChange={e => setNewPin(e.target.value)}
              placeholder="Enter 4-8 digits"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#232C45] bg-gray-50 dark:bg-[#0A0E1A] text-gray-900 dark:text-white tracking-widest text-sm focus:outline-none focus:border-brand-500"
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
              onChange={e => setConfirmPin(e.target.value)}
              placeholder="Confirm 4-8 digits"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#232C45] bg-gray-50 dark:bg-[#0A0E1A] text-gray-900 dark:text-white tracking-widest text-sm focus:outline-none focus:border-brand-500"
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
        <div className="space-y-4 text-xs">
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
              onChange={e => setCurrentPin(e.target.value)}
              placeholder="Enter your current PIN"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#232C45] bg-gray-50 dark:bg-[#0A0E1A] text-gray-900 dark:text-white tracking-widest text-sm focus:outline-none focus:border-brand-500"
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <span>✓ {statusToast}</span>
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
        title="Log Out"
        message="Log out of Centra?"
        type="danger"
        confirmText="Log Out"
      />

    </div>
  );
};
