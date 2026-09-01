import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PinLockScreen: React.FC = () => {
  const { unlockPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pin) {
      setErrorMsg('Please enter your PIN.');
      return;
    }
    const ok = unlockPin(pin);
    if (!ok) {
      setErrorMsg('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-gray-100 transition-colors">
      <div className="w-full max-w-xs bg-white dark:bg-[#121A2C] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-[#232C45] shadow-2xl animate-fade-in">

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 text-white mx-auto flex items-center justify-center mb-3 shadow-md shadow-brand-500/20">
            <Shield className="w-6 h-6 fill-white/20" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            App Locked
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter your PIN to continue
          </p>
        </div>

        {/* PIN form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
              PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-gray-900 dark:text-white text-sm tracking-widest focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-float transition-all cursor-pointer"
          >
            Unlock
          </button>
        </form>

        {/* Sign-out escape hatch */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Sign out of Centra?')) logout();
          }}
          className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          Sign out instead
        </button>

      </div>
    </div>
  );
};
