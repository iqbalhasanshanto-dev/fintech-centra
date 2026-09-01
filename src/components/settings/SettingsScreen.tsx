import React, { useState, useRef } from 'react';
import {
  Shield,
  Bell,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Lock,
  Fingerprint,
  Globe,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Edit2,
  Camera
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { CurrencyCode } from '../../types';
import { CentraDB } from '../../db/storage';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData
  } = useFinance();
  const { user, updateUser, logout } = useAuth();

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  const handleResetData = () => {
    if (window.confirm('Reset all transactions, accounts, and budgets to default demo state?')) {
      resetAllData();
      alert('Application reset to seed data.');
    }
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

      {/* 1. Profile Card with Edit button grouped close to profile info */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2C] border border-gray-200 dark:border-[#232C45] flex items-center justify-between transition-colors shadow-xs">
        <div className="flex items-center space-x-4 min-w-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-[#232C45] shrink-0"
          />
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

          {/* Biometrics Toggle */}
          <div
            onClick={() => updateSettings({ security: { ...settings.security, biometricEnabled: !settings.security.biometricEnabled } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none group gap-4"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Fingerprint className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Biometric / Passkey Login</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">TouchID, FaceID or device passkey</p>
              </div>
            </div>
            <Switch
              checked={settings.security.biometricEnabled}
              onChange={(val) => updateSettings({ security: { ...settings.security, biometricEnabled: val } })}
              label="Toggle Biometric Login"
            />
          </div>

          {/* 2FA Toggle */}
          <div
            onClick={() => {
              const nextVal = !settings.security.twoFactorEnabled;
              updateSettings({ security: { ...settings.security, twoFactorEnabled: nextVal } });
              if (nextVal) setShowTwoFactorModal(true);
            }}
            className="flex items-center justify-between pt-3 cursor-pointer select-none group gap-4"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require OTP code for sensitive actions</p>
              </div>
            </div>
            <Switch
              checked={settings.security.twoFactorEnabled}
              onChange={(val) => {
                updateSettings({ security: { ...settings.security, twoFactorEnabled: val } });
                if (val) setShowTwoFactorModal(true);
              }}
              label="Toggle 2FA"
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
            <select
              value={settings.baseCurrency}
              onChange={e => updateSettings({ baseCurrency: e.target.value as CurrencyCode })}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white font-bold focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="BDT" className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">BDT (৳)</option>
              <option value="USD" className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">USD ($)</option>
              <option value="EUR" className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">EUR (€)</option>
              <option value="GBP" className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">GBP (£)</option>
              <option value="JPY" className="bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white">JPY (¥)</option>
            </select>
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

          <Button
            variant="destructive"
            size="md"
            onClick={handleResetData}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Demo Data
          </Button>
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
              if (window.confirm('Log out of Centra?')) {
                logout();
              }
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

      {/* Two-Factor Setup Modal */}
      <Modal isOpen={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)} title="2FA Authentication Active">
        <div className="space-y-4 text-xs text-gray-700 dark:text-gray-300">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <p className="font-bold">Two-Factor Authentication is now enabled.</p>
            <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">Your financial account data is protected with hardware &amp; OTP verification.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setShowTwoFactorModal(false)}
          >
            Done
          </Button>
        </div>
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

    </div>
  );
};
