import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';

export const PinLockScreen: React.FC = () => {
  const { unlockPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pin) {
      setErrorMsg('Please enter your PIN.');
      return;
    }
    const res = await unlockPin(pin);
    if (!res.ok) {
      setErrorMsg(res.error || 'Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F7F8FA] dark:bg-[#000000] text-gray-900 dark:text-gray-100 transition-colors"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, var(--safe-area-inset-left, 0px)))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right, var(--safe-area-inset-right, 0px)))',
      }}
    >
      <div className="w-full max-w-xs bg-white dark:bg-[#1D1D1D] rounded-[28px] p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-2xl animate-fade-in">

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#C6FF3D] text-black mx-auto flex items-center justify-center mb-3 shadow-md">
            <Shield className="w-6 h-6 stroke-[2.5]" />
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F1F2F4] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 text-gray-900 dark:text-white text-sm tracking-widest focus:border-[#18212F] dark:focus:border-[#C6FF3D] focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 min-h-[44px] rounded-full bg-[#C6FF3D] hover:bg-[#B2E830] active:bg-[#9ECC27] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Unlock
          </button>
        </form>

        {/* Sign-out escape hatch */}
        <button
          type="button"
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          Sign out instead
        </button>

        <ConfirmModal
          isOpen={showSignOutConfirm}
          onClose={() => setShowSignOutConfirm(false)}
          onConfirm={logout}
          title="Sign Out"
          message="Sign out of Centra?"
          type="danger"
          confirmText="Sign Out"
        />

      </div>
    </div>
  );
};
