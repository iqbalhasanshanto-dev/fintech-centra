import React, { useState, useRef } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Check, 
  Lock, 
  Fingerprint, 
  Moon, 
  Sun, 
  Globe, 
  Download, 
  RotateCcw, 
  Sparkles,
  Eye,
  EyeOff,
  Edit2,
  Camera
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { CurrencyCode } from '../../types';
import { CentraDB } from '../../db/storage';

export const SettingsScreen: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData,
    addNotification
  } = useFinance();
  const { user, updateUser, logout } = useAuth();

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
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
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-ink dark:text-[#f8fafc]">
          Settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-[#64748b]">
          Preferences, security, and application settings
        </p>
      </div>

      {/* 1. Profile Card */}
      <div className="p-5 rounded-4xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-3.5 min-w-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-13 h-13 rounded-full object-cover ring-4 ring-brand-500/20 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base font-bold text-ink dark:text-[#f8fafc] truncate">
                {user.name}
              </h3>
              {user.isPro && (
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 text-[10px] font-bold">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-[#64748b] truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setProfileName(user.name);
            setProfileEmail(user.email);
            setProfileAvatar(user.avatarUrl);
            setShowEditProfile(true);
          }}
          className="p-2 rounded-2xl bg-gray-100 dark:bg-[#1e2638] hover:bg-gray-200 dark:hover:bg-[#1e2638]/80 text-gray-700 dark:text-[#f8fafc] transition-colors"
          aria-label="Edit profile"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Security Center */}
      <div className="p-5 rounded-4xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-ink dark:text-[#f8fafc] uppercase tracking-wider">
            Security & Authentication
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-50 dark:divide-[#1e2638] text-xs">
          
          {/* Biometrics Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Fingerprint className="w-4 h-4 text-gray-400 dark:text-[#64748b]" />
              <div>
                <p className="font-bold text-ink dark:text-[#f8fafc]">Biometric / Passkey Login</p>
                <p className="text-[11px] text-gray-400 dark:text-[#64748b]">TouchID, FaceID or device credentials</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.security.biometricEnabled}
              onChange={e =>
                updateSettings({
                  security: { ...settings.security, biometricEnabled: e.target.checked },
                })
              }
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-3">
              <Lock className="w-4 h-4 text-gray-400 dark:text-[#64748b]" />
              <div>
                <p className="font-bold text-ink dark:text-[#f8fafc]">Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Require OTP code for sensitive actions</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.security.twoFactorEnabled}
              onChange={e => {
                updateSettings({
                  security: { ...settings.security, twoFactorEnabled: e.target.checked },
                });
                if (e.target.checked) {
                  setShowTwoFactorModal(true);
                }
              }}
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

          {/* Privacy Mask Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-3">
              {settings.privacyMode ? <EyeOff className="w-4 h-4 text-brand-600 dark:text-brand-400" /> : <Eye className="w-4 h-4 text-gray-400 dark:text-[#64748b]" />}
              <div>
                <p className="font-bold text-ink dark:text-[#f8fafc]">Privacy Mode (Mask Balances)</p>
                <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Hide numbers in public places</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.privacyMode}
              onChange={e => updateSettings({ privacyMode: e.target.checked })}
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* 3. Notifications Preferences */}
      <div className="p-5 rounded-4xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-ink dark:text-[#f8fafc] uppercase tracking-wider">
            Notification Rules
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-50 dark:divide-[#1e2638] text-xs">
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-ink dark:text-[#f8fafc]">Budget Overrun Alerts</p>
              <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Instant notification when spending exceeds 80% limit</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.budgetOverruns}
              onChange={e =>
                updateSettings({
                  notifications: { ...settings.notifications, budgetOverruns: e.target.checked },
                })
              }
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-bold text-ink dark:text-[#f8fafc]">High Transaction Alerts</p>
              <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Alert for transactions exceeding $500</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.transactionAlerts}
              onChange={e =>
                updateSettings({
                  notifications: { ...settings.notifications, transactionAlerts: e.target.checked },
                })
              }
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-bold text-ink dark:text-[#f8fafc]">Security & Login Alerts</p>
              <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Notify upon new device sessions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.securityAlerts}
              onChange={e =>
                updateSettings({
                  notifications: { ...settings.notifications, securityAlerts: e.target.checked },
                })
              }
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* 4. Appearance & System Preferences */}
      <div className="p-5 rounded-4xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft space-y-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-ink dark:text-[#f8fafc] uppercase tracking-wider">
            Appearance & Locale
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-50 dark:divide-[#1e2638] text-xs">
          {/* Base Currency */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400 dark:text-[#64748b]" />
              <div>
                <p className="font-bold text-ink dark:text-[#f8fafc]">Base Currency</p>
                <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Converts all totals into this currency</p>
              </div>
            </div>
            <select
              value={settings.baseCurrency}
              onChange={e => updateSettings({ baseCurrency: e.target.value as CurrencyCode })}
              className="px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-ink dark:text-[#f8fafc] font-bold"
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD (CA$)</option>
            </select>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-3">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="font-bold text-ink dark:text-[#f8fafc]">Theme</p>
                <p className="text-[11px] text-gray-400 dark:text-[#64748b]">Interface appearance</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-[#1e2638] text-ink dark:text-[#f8fafc] font-bold hover:bg-gray-200 dark:hover:bg-[#1e2638]/80 transition-colors"
            >
              {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Data Management & Backup */}
      <div className="p-5 rounded-4xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] shadow-soft space-y-3">
        <h3 className="text-sm font-bold text-ink dark:text-[#f8fafc] uppercase tracking-wider">
          Data Management
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleExportData}
            className="py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-[#1e2638] text-ink dark:text-[#f8fafc] hover:bg-gray-100 dark:hover:bg-[#1e2638]/80 font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleResetData}
            className="py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-[#1e2638] text-ink dark:text-[#f8fafc] hover:bg-gray-100 dark:hover:bg-[#1e2638]/80 font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-caution" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 6. Support & Logout */}
      <div className="space-y-2">
        <button
          onClick={() => setShowHelpModal(true)}
          className="w-full py-3.5 px-4 rounded-3xl bg-white dark:bg-[#131722] border border-gray-100 dark:border-[#1e2638] text-xs font-bold text-gray-700 dark:text-[#f8fafc] hover:bg-gray-50 dark:hover:bg-[#1e2638]/40 flex items-center justify-between transition-colors shadow-soft"
        >
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Centra Help & Support FAQ</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#64748b]" />
        </button>

        <button
          onClick={() => {
            if (window.confirm('Log out of Centra?')) {
              logout();
            }
          }}
          className="w-full py-3.5 px-4 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs font-bold text-danger hover:bg-rose-100 flex items-center justify-center space-x-2 transition-colors shadow-soft"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Session</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#64748b] mb-1.5">Choose Avatar</label>
            <div className="flex items-center space-x-3 overflow-x-auto pb-1">
              {avatarsList.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i}`}
                  onClick={() => setProfileAvatar(url)}
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer ring-2 transition-all shrink-0 ${
                    profileAvatar === url ? 'ring-brand-600 scale-105 shadow-md' : 'ring-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}

              {/* 5th Option: Upload from device */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-12 h-12 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 relative overflow-hidden ${
                  !avatarsList.includes(profileAvatar)
                    ? 'ring-2 ring-brand-600 scale-105 shadow-md bg-brand-50 dark:bg-[#1e2638]'
                    : 'border-2 border-dashed border-gray-300 dark:border-[#1e2638] bg-gray-50 dark:bg-[#1e2638]/50 hover:bg-gray-100 dark:hover:bg-[#1e2638] text-gray-500 dark:text-[#64748b]'
                }`}
                title="Upload from device"
              >
                {!avatarsList.includes(profileAvatar) ? (
                  <>
                    <img
                      src={profileAvatar}
                      alt="Custom Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-gray-500 dark:text-[#64748b]" />
                    <span className="text-[8px] font-bold mt-0.5 leading-none">Upload</span>
                  </>
                )}
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
            <label className="block text-xs font-bold text-gray-500 dark:text-[#64748b] mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-xs text-ink dark:text-[#f8fafc]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#64748b] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={e => setProfileEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#1e2638] border border-gray-200 dark:border-[#1e2638] text-xs text-ink dark:text-[#f8fafc]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save Profile
          </button>
        </form>
      </Modal>

      {/* 2FA Challenge Simulation Modal */}
      <Modal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        title="Two-Factor Security Activated"
        subtitle="Verification code sent to your registered device"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-xs text-gray-500 dark:text-[#64748b]">
            For demonstration, your 2FA verification code is <strong className="font-mono text-ink dark:text-[#f8fafc]">123456</strong>.
          </p>
          <button
            onClick={() => {
              addNotification({
                type: 'security',
                title: '2FA Enabled Successfully',
                message: 'Two-factor authentication is now protecting all sensitive account actions.',
                severity: 'success',
              });
              setShowTwoFactorModal(false);
            }}
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Got It
          </button>
        </div>
      </Modal>

      {/* Help & FAQ Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Centra Help & FAQ">
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-[#1e2638] rounded-2xl">
            <p className="font-bold text-ink dark:text-[#f8fafc] mb-1">How are balances and conversions computed?</p>
            <p className="text-gray-500 dark:text-[#64748b]">All connected multi-currency accounts are converted in real-time to your chosen Base Currency using standard market rates.</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-[#1e2638] rounded-2xl">
            <p className="font-bold text-ink dark:text-[#f8fafc] mb-1">How do budget alerts work?</p>
            <p className="text-gray-500 dark:text-[#64748b]">When expenses in a category reach 80% or 100% of the set threshold, an instant notification is badged on your dashboard.</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-[#1e2638] rounded-2xl">
            <p className="font-bold text-ink dark:text-[#f8fafc] mb-1">Is my financial data stored securely?</p>
            <p className="text-gray-500 dark:text-[#64748b]">All data is kept in your private relational database storage with client-side isolation, PIN lock, and biometric passkey support.</p>
          </div>
        </div>
      </Modal>

    </div>
  );
};
