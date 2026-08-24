import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Palette, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Plus, 
  Trash2, 
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
  Edit2
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { CurrencyCode, Account, AccountType } from '../../types';
import { formatCurrency, CURRENCY_SYMBOLS } from '../../utils/formatters';
import { CentraDB } from '../../db/storage';

export const SettingsScreen: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    accounts, 
    addAccount, 
    deleteAccount, 
    resetAllData,
    addNotification
  } = useFinance();
  const { user, updateUser, logout } = useAuth();

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Edit Profile Form
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl);

  // Add Account Form
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('checking');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState<CurrencyCode>('USD');
  const [newAccBank, setNewAccBank] = useState('');

  // 2FA OTP simulation
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: profileName.trim(),
      email: profileEmail.trim(),
      avatarUrl: profileAvatar,
    });
    setShowEditProfile(false);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(newAccBalance);
    if (!newAccName || isNaN(bal)) return;

    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: bal,
      currency: newAccCurrency,
      accountNumberMasked: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
      bankName: newAccBank.trim() || 'Centra Linked Bank',
      color: newAccType === 'checking' ? '#6C5CE7' : newAccType === 'savings' ? '#1FAE71' : '#0984E3',
      cardBrand: newAccType === 'credit' ? 'mastercard' : 'visa',
    });

    setNewAccName('');
    setNewAccBalance('');
    setNewAccBank('');
    setShowAddAccount(false);
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
        <h2 className="text-xl font-bold font-display text-ink dark:text-white">
          Settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Preferences, security, and linked financial accounts
        </p>
      </div>

      {/* 1. Profile Card */}
      <div className="p-5 rounded-4xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-3.5 min-w-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-13 h-13 rounded-full object-cover ring-4 ring-brand-500/20 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base font-bold text-ink dark:text-white truncate">
                {user.name}
              </h3>
              {user.isPro && (
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 text-[10px] font-bold">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setProfileName(user.name);
            setProfileEmail(user.email);
            setProfileAvatar(user.avatarUrl);
            setShowEditProfile(true);
          }}
          className="p-2 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-colors"
          aria-label="Edit profile"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Security Center */}
      <div className="p-5 rounded-4xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-brand-600" />
          <h3 className="text-sm font-bold text-ink dark:text-white uppercase tracking-wider">
            Security & Authentication
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-50 dark:divide-gray-800 text-xs">
          
          {/* Biometrics Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Fingerprint className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-bold text-ink dark:text-white">Biometric / Passkey Login</p>
                <p className="text-[11px] text-gray-400">TouchID, FaceID or device credentials</p>
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
              <Lock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-bold text-ink dark:text-white">Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-gray-400">Require OTP code for sensitive actions</p>
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
              {settings.privacyMode ? <EyeOff className="w-4 h-4 text-brand-600" /> : <Eye className="w-4 h-4 text-gray-400" />}
              <div>
                <p className="font-bold text-ink dark:text-white">Privacy Mode (Mask Balances)</p>
                <p className="text-[11px] text-gray-400">Hide numbers in public places</p>
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
      <div className="p-5 rounded-4xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-brand-600" />
          <h3 className="text-sm font-bold text-ink dark:text-white uppercase tracking-wider">
            Notification Rules
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-50 dark:divide-gray-800 text-xs">
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-ink dark:text-white">Budget Overrun Alerts</p>
              <p className="text-[11px] text-gray-400">Instant notification when spending exceeds 80% limit</p>
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
              <p className="font-bold text-ink dark:text-white">High Transaction Alerts</p>
              <p className="text-[11px] text-gray-400">Alert for transactions exceeding $500</p>
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
              <p className="font-bold text-ink dark:text-white">Security & Login Alerts</p>
              <p className="text-[11px] text-gray-400">Notify upon new device sessions</p>
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

      {/* 4. Linked Accounts & Cards */}
      <div className="p-5 rounded-4xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-ink dark:text-white uppercase tracking-wider">
              Linked Accounts ({accounts.length})
            </h3>
          </div>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-mono text-xs font-bold shadow-xs"
                  style={{ backgroundColor: acc.color }}
                >
                  {acc.currency}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-bold text-ink dark:text-white truncate">
                      {acc.name}
                    </p>
                    {acc.isPrimary && (
                      <span className="px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-bold">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {acc.bankName} • {acc.accountNumberMasked}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-bold font-display text-ink dark:text-white currency-amount">
                  {formatCurrency(acc.balance, acc.currency, settings.privacyMode)}
                </span>
                {accounts.length > 1 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove account ${acc.name}?`)) {
                        deleteAccount(acc.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-rose-500 rounded"
                    aria-label="Delete account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Appearance & System Preferences */}
      <div className="p-5 rounded-4xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-brand-600" />
          <h3 className="text-sm font-bold text-ink dark:text-white uppercase tracking-wider">
            Appearance & Locale
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-gray-50 dark:divide-gray-800 text-xs">
          {/* Base Currency */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-bold text-ink dark:text-white">Base Currency</p>
                <p className="text-[11px] text-gray-400">Converts all totals into this currency</p>
              </div>
            </div>
            <select
              value={settings.baseCurrency}
              onChange={e => updateSettings({ baseCurrency: e.target.value as CurrencyCode })}
              className="px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink dark:text-white font-bold"
            >
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
                <p className="font-bold text-ink dark:text-white">Theme</p>
                <p className="text-[11px] text-gray-400">Interface appearance</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-ink dark:text-white font-bold hover:bg-gray-200 transition-colors"
            >
              {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* 6. Data Management & Backup */}
      <div className="p-5 rounded-4xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 shadow-soft space-y-3">
        <h3 className="text-sm font-bold text-ink dark:text-white uppercase tracking-wider">
          Data Management
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleExportData}
            className="py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-ink dark:text-white hover:bg-gray-100 font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleResetData}
            className="py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-ink dark:text-white hover:bg-gray-100 font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-caution" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 7. Support & Logout */}
      <div className="space-y-2">
        <button
          onClick={() => setShowHelpModal(true)}
          className="w-full py-3.5 px-4 rounded-3xl bg-white dark:bg-surface-darkCard border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center justify-between transition-colors shadow-soft"
        >
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="w-4 h-4 text-brand-600" />
            <span>Centra Help & Support FAQ</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
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
            <label className="block text-xs font-bold text-gray-500 mb-1">Choose Avatar</label>
            <div className="flex items-center space-x-3">
              {avatarsList.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i}`}
                  onClick={() => setProfileAvatar(url)}
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer ring-2 transition-all ${
                    profileAvatar === url ? 'ring-brand-600 scale-105' : 'ring-transparent opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={e => setProfileEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-brand-600 text-white font-bold text-xs shadow-md"
          >
            Save Profile
          </button>
        </form>
      </Modal>

      {/* Add Account Modal */}
      <Modal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} title="Link New Account">
        <form onSubmit={handleCreateAccount} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Robinhood Crypto, Barclaycard"
              value={newAccName}
              onChange={e => setNewAccName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Account Type</label>
              <select
                value={newAccType}
                onChange={e => setNewAccType(e.target.value as AccountType)}
                className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="investment">Investment</option>
                <option value="cash">Cash Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Currency</label>
              <select
                value={newAccCurrency}
                onChange={e => setNewAccCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD (CA$)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Initial Balance</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="1000.00"
              value={newAccBalance}
              onChange={e => setNewAccBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Bank / Institution Name</label>
            <input
              type="text"
              placeholder="e.g. JPMorgan Chase, Fidelity"
              value={newAccBank}
              onChange={e => setNewAccBank(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-ink dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-brand-600 text-white font-bold text-xs shadow-md"
          >
            Link Account
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
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-xs text-gray-500">
            For demonstration, your 2FA verification code is <strong className="font-mono text-ink dark:text-white">123456</strong>.
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
            className="w-full py-3 rounded-2xl bg-brand-600 text-white font-bold text-xs shadow-md"
          >
            Got It
          </button>
        </div>
      </Modal>

      {/* Help & FAQ Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Centra Help & FAQ">
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <p className="font-bold text-ink dark:text-white mb-1">How are balances and conversions computed?</p>
            <p className="text-gray-500">All connected multi-currency accounts are converted in real-time to your chosen Base Currency using standard market rates.</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <p className="font-bold text-ink dark:text-white mb-1">How do budget alerts work?</p>
            <p className="text-gray-500">When expenses in a category reach 80% or 100% of the set threshold, an instant notification is badged on your dashboard.</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <p className="font-bold text-ink dark:text-white mb-1">Is my financial data stored securely?</p>
            <p className="text-gray-500">All data is kept in your private relational database storage with client-side isolation, PIN lock, and biometric passkey support.</p>
          </div>
        </div>
      </Modal>

    </div>
  );
};
