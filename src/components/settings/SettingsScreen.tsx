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
  Moon, 
  Sun, 
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
import { CurrencyCode } from '../../types';
import { CentraDB } from '../../db/storage';

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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-gray-800 transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-indigo-600' : 'bg-gray-800'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
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
    'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Settings
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Preferences, security, and application settings
        </p>
      </div>

      {/* 1. Profile Card */}
      <div className="p-6 rounded-2xl bg-[#171717] border border-gray-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4 min-w-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover border border-gray-700 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white truncate">
                {user.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                Personal
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setProfileName(user.name);
            setProfileEmail(user.email);
            setProfileAvatar(user.avatarUrl);
            setShowEditProfile(true);
          }}
          className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Edit profile"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Security & Authentication Center */}
      <div className="p-6 rounded-2xl bg-[#171717] border border-gray-800 space-y-4 transition-colors">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Security &amp; Authentication
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-800 text-xs">
          
          {/* Biometrics Toggle */}
          <div 
            onClick={() => updateSettings({ security: { ...settings.security, biometricEnabled: !settings.security.biometricEnabled } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-3">
              <Fingerprint className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-semibold text-white">Biometric / Passkey Login</p>
                <p className="text-xs text-gray-500">TouchID, FaceID or device passkey</p>
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
              <Lock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-semibold text-white">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-gray-500">Require OTP code for sensitive actions</p>
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
              {settings.privacyMode ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              <div>
                <p className="font-semibold text-white">Privacy Mode (Mask Balances)</p>
                <p className="text-xs text-gray-500">Hide numbers when viewing in public places</p>
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
      <div className="p-6 rounded-2xl bg-[#171717] border border-gray-800 space-y-4 transition-colors">
        <div className="flex items-center space-x-2.5">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Notification Rules
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-800 text-xs">
          
          <div 
            onClick={() => updateSettings({ notifications: { ...settings.notifications, budgetOverruns: !settings.notifications.budgetOverruns } })}
            className="flex items-center justify-between pt-2 cursor-pointer select-none"
          >
            <div>
              <p className="font-semibold text-white">Budget Overrun Alerts</p>
              <p className="text-xs text-gray-500">Instant notification when spending exceeds 80% limit</p>
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
              <p className="font-semibold text-white">High Outflow Alerts</p>
              <p className="text-xs text-gray-500">Alert for single transactions exceeding ৳5,000</p>
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
              <p className="font-semibold text-white">Security &amp; Login Alerts</p>
              <p className="text-xs text-gray-500">Notify upon new device sessions or credential shifts</p>
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
      <div className="p-6 rounded-2xl bg-[#171717] border border-gray-800 space-y-4 transition-colors">
        <div className="flex items-center space-x-2.5">
          <Palette className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Appearance &amp; Locale
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-800 text-xs">
          {/* Base Currency */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-semibold text-white">Base Currency</p>
                <p className="text-xs text-gray-500">Converts all dashboard totals to this currency</p>
              </div>
            </div>
            <select
              value={settings.baseCurrency}
              onChange={e => updateSettings({ baseCurrency: e.target.value as CurrencyCode })}
              className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="BDT" className="bg-gray-900 text-white">BDT (৳)</option>
              <option value="USD" className="bg-gray-900 text-white">USD ($)</option>
              <option value="EUR" className="bg-gray-900 text-white">EUR (€)</option>
              <option value="GBP" className="bg-gray-900 text-white">GBP (£)</option>
              <option value="JPY" className="bg-gray-900 text-white">JPY (¥)</option>
            </select>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-3">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <div>
                <p className="font-semibold text-white">Interface Theme</p>
                <p className="text-xs text-gray-500">Switch between dark and light appearance</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Data Management & Backup */}
      <div className="p-6 rounded-2xl bg-[#171717] border border-gray-800 space-y-3 transition-colors">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Data Management
        </h3>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            onClick={handleExportData}
            className="py-3 px-4 rounded-xl bg-gray-900 border border-gray-800 text-white hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleResetData}
            className="py-3 px-4 rounded-xl bg-gray-900 border border-gray-800 text-white hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 6. Support & Logout */}
      <div className="space-y-3">
        <button
          onClick={() => setShowHelpModal(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#171717] border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-700 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Centra Help &amp; Support FAQ</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>

        <button
          onClick={() => {
            if (window.confirm('Log out of Centra?')) {
              logout();
            }
          }}
          className="w-full py-3.5 px-5 rounded-2xl bg-rose-950/20 border border-rose-900/30 text-xs font-semibold text-rose-400 hover:bg-rose-900/30 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Session</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Choose Avatar</label>
            <div className="flex items-center space-x-3 overflow-x-auto pb-1">
              {avatarsList.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i}`}
                  onClick={() => setProfileAvatar(url)}
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer border transition-all shrink-0 ${
                    profileAvatar === url ? 'border-indigo-500 scale-105' : 'border-gray-800 opacity-60 hover:opacity-100'
                  }`}
                />
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full flex flex-col items-center justify-center cursor-pointer border border-dashed border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-400 transition-colors shrink-0"
                title="Upload from device"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[8px] font-bold mt-0.5">Upload</span>
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
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={e => setProfileEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Save Profile Changes
          </button>
        </form>
      </Modal>

      {/* Two-Factor Setup Modal */}
      <Modal isOpen={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)} title="2FA Authentication Active">
        <div className="space-y-4 text-xs text-gray-300">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <p className="font-bold">Two-Factor Authentication is now enabled.</p>
            <p className="text-[11px] mt-0.5 text-gray-400">Your financial account data is protected with hardware &amp; OTP verification.</p>
          </div>
          <button
            onClick={() => setShowTwoFactorModal(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Centra Help &amp; FAQ">
        <div className="space-y-3 text-xs text-gray-300">
          <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <h4 className="font-bold text-white">How is my balance calculated?</h4>
            <p className="text-gray-400">Total balance is aggregated in real-time across all connected wallets and bank accounts in your chosen base currency (৳ BDT).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <h4 className="font-bold text-white">How do I export my data?</h4>
            <p className="text-gray-400">Navigate to Data Management in Settings and click "Export JSON" to download your complete encrypted local database.</p>
          </div>
          <button
            onClick={() => setShowHelpModal(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
          >
            Close FAQ
          </button>
        </div>
      </Modal>

    </div>
  );
};
