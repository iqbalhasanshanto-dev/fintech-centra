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
  Eye, 
  EyeOff, 
  Edit2, 
  Camera,
  KeyRound
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { CurrencyCode } from '../../types';
import { CentraDB } from '../../db/storage';

// Modern smooth-sliding toggle switch component (Track w-11 h-6, Thumb w-5 h-5 translate-x-5)
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

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
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-gray-900 dark:text-[#FFFFFF]">
          Settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
          Preferences, security, and application settings
        </p>
      </div>

      {/* 1. Profile Card (Scaled down compact row with w-16 h-16 avatar) */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3.5 min-w-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-[#FFFFFF] truncate">
                {user.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold">
                Personal
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setProfileName(user.name);
            setProfileEmail(user.email);
            setProfileAvatar(user.avatarUrl);
            setShowEditProfile(true);
          }}
          className="p-2 rounded-xl bg-gray-100 dark:bg-[#1E2536] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-[#E2E8F0] transition-colors"
          aria-label="Edit profile"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Security & Authentication Center */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-[#FFFFFF] uppercase tracking-wider">
            Security & Authentication
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-100 dark:divide-white/5 text-xs">
          
          {/* Biometrics Toggle */}
          <div 
            onClick={() => updateSettings({ security: { ...settings.security, biometricEnabled: !settings.security.biometricEnabled } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-3">
              <Fingerprint className="w-4 h-4 text-gray-400 dark:text-[#94A3B8]" />
              <div>
                <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Biometric / Passkey Login</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">TouchID, FaceID or device passkey</p>
              </div>
            </div>
            <ToggleSwitch
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
            className="flex items-center justify-between pt-3 cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-3">
              <Lock className="w-4 h-4 text-gray-400 dark:text-[#94A3B8]" />
              <div>
                <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Require OTP code for sensitive actions</p>
              </div>
            </div>
            <ToggleSwitch
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
            className="flex items-center justify-between pt-3 cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-3">
              {settings.privacyMode ? <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Eye className="w-4 h-4 text-gray-400 dark:text-[#94A3B8]" />}
              <div>
                <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Privacy Mode (Mask Balances)</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Hide numbers when viewing in public places</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.privacyMode}
              onChange={(val) => updateSettings({ privacyMode: val })}
              label="Toggle Privacy Mode"
            />
          </div>

        </div>
      </div>

      {/* 3. Notification Rules */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-[#FFFFFF] uppercase tracking-wider">
            Notification Rules
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-100 dark:divide-white/5 text-xs">
          
          <div 
            onClick={() => updateSettings({ notifications: { ...settings.notifications, budgetOverruns: !settings.notifications.budgetOverruns } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none"
          >
            <div>
              <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Budget Overrun Alerts</p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Instant notification when spending exceeds 80% limit</p>
            </div>
            <ToggleSwitch
              checked={settings.notifications.budgetOverruns}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, budgetOverruns: val } })}
              label="Toggle Budget Overrun Alerts"
            />
          </div>

          <div 
            onClick={() => updateSettings({ notifications: { ...settings.notifications, transactionAlerts: !settings.notifications.transactionAlerts } })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none"
          >
            <div>
              <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">High Outflow Alerts</p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Alert for single transactions exceeding ৳5,000</p>
            </div>
            <ToggleSwitch
              checked={settings.notifications.transactionAlerts}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, transactionAlerts: val } })}
              label="Toggle Transaction Alerts"
            />
          </div>

          <div 
            onClick={() => updateSettings({ notifications: { ...settings.notifications, securityAlerts: !settings.notifications.securityAlerts } })}
            className="flex items-center justify-between pt-3 cursor-pointer select-none"
          >
            <div>
              <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Security & Login Alerts</p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Notify upon new device sessions or credential shifts</p>
            </div>
            <ToggleSwitch
              checked={settings.notifications.securityAlerts}
              onChange={(val) => updateSettings({ notifications: { ...settings.notifications, securityAlerts: val } })}
              label="Toggle Security Alerts"
            />
          </div>

        </div>
      </div>

      {/* 4. Appearance & System Preferences */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-[#FFFFFF] uppercase tracking-wider">
            Appearance & Locale
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-100 dark:divide-white/5 text-xs">
          {/* Base Currency */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400 dark:text-[#94A3B8]" />
              <div>
                <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Base Currency</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Converts all dashboard totals to this currency</p>
              </div>
            </div>
            <select
              value={settings.baseCurrency}
              onChange={e => updateSettings({ baseCurrency: e.target.value as CurrencyCode })}
              className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-[#FFFFFF] font-bold"
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-3">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="font-bold text-gray-900 dark:text-[#E2E8F0]">Interface Theme</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Switch between dark and light appearance</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#1E2536] text-gray-900 dark:text-[#FFFFFF] font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Data Management & Backup */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3 transition-colors">
        <h3 className="text-xs font-bold text-gray-900 dark:text-[#FFFFFF] uppercase tracking-wider">
          Data Management
        </h3>
        
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <button
            onClick={handleExportData}
            className="py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-[#1E2536] text-gray-900 dark:text-[#FFFFFF] hover:bg-gray-100 dark:hover:bg-white/10 font-bold flex items-center justify-center space-x-1.5 transition-colors border border-gray-200/60 dark:border-white/5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleResetData}
            className="py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-[#1E2536] text-gray-900 dark:text-[#FFFFFF] hover:bg-gray-100 dark:hover:bg-white/10 font-bold flex items-center justify-center space-x-1.5 transition-colors border border-gray-200/60 dark:border-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 6. Support & Logout */}
      <div className="space-y-2">
        <button
          onClick={() => setShowHelpModal(true)}
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#161B26] border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between transition-colors shadow-sm"
        >
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Centra Help & Support FAQ</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#94A3B8]" />
        </button>

        <button
          onClick={() => {
            if (window.confirm('Log out of Centra?')) {
              logout();
            }
          }}
          className="w-full py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center space-x-2 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Session</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#94A3B8] mb-1.5">Choose Avatar</label>
            <div className="flex items-center space-x-3 overflow-x-auto pb-1">
              {avatarsList.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i}`}
                  onClick={() => setProfileAvatar(url)}
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer ring-2 transition-all shrink-0 ${
                    profileAvatar === url ? 'ring-indigo-600 scale-105 shadow-md' : 'ring-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}

              {/* 5th Option: Upload from device */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-12 h-12 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 relative overflow-hidden ${
                  !avatarsList.includes(profileAvatar)
                    ? 'ring-2 ring-indigo-600 scale-105 shadow-md bg-indigo-50 dark:bg-[#1E2536]'
                    : 'border-2 border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-[#94A3B8]'
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
                    <Camera className="w-4 h-4 text-gray-500 dark:text-[#94A3B8]" />
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
            <label className="block text-xs font-bold text-gray-500 dark:text-[#94A3B8] mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-[#FFFFFF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#94A3B8] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={e => setProfileEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-[#FFFFFF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save Profile Changes
          </button>
        </form>
      </Modal>

      {/* Two-Factor Setup Modal */}
      <Modal isOpen={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)} title="2FA Authentication Active">
        <div className="space-y-4 text-xs text-gray-600 dark:text-[#E2E8F0]">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <p className="font-bold">Two-Factor Authentication is now enabled.</p>
            <p className="text-[11px] mt-0.5">Your financial account data is protected with hardware &amp; OTP verification.</p>
          </div>
          <button
            onClick={() => setShowTwoFactorModal(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Centra Help & FAQ">
        <div className="space-y-3 text-xs text-gray-600 dark:text-[#E2E8F0]">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-100 dark:border-white/10 space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-[#FFFFFF]">How is my balance calculated?</h4>
            <p className="text-gray-500 dark:text-[#94A3B8]">Total balance is aggregated in real-time across all connected wallets and bank accounts in your chosen base currency (৳ BDT).</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1E2536] border border-gray-100 dark:border-white/10 space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-[#FFFFFF]">How do I export my data?</h4>
            <p className="text-gray-500 dark:text-[#94A3B8]">Navigate to Data Management in Settings and click "Export JSON" to download your complete encrypted local database.</p>
          </div>
          <button
            onClick={() => setShowHelpModal(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
          >
            Close FAQ
          </button>
        </div>
      </Modal>

    </div>
  );
};
