import React, { useState } from 'react';
import { Sparkles, Check, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { addNotification } = useFinance();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  const handleUpgrade = () => {
    updateUser({ isPro: true, planExpiry: '2028-12-31' });
    
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#6366F1', '#4F46E5', '#10B981', '#F59E0B'],
    });

    addNotification({
      type: 'system',
      title: 'Centra Pro Activated!',
      message: 'You have unlocked AI Insights, unlimited goals, and advanced analytics.',
      severity: 'success',
    });

    onClose();
  };

  const features = [
    'AI-powered smart insights & cashflow forecasting',
    'Unlimited custom goals, pace tracking & debt payoff plans',
    'Real-time multi-currency live conversions across 30+ fx pairs',
    'Custom recurring transaction schedules & bill reminders',
    'Full CSV/JSON ledger exports & cloud backup',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Centra Pro" subtitle="Master your net worth with AI finance tools">
      <div className="space-y-5">
        
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] text-center relative">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/50 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Centra Pro Unlimited
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
            Take full command of your budget, investments, and financial freedom.
          </p>

          {/* Pricing Selector */}
          <div className="mt-4 inline-flex p-1 rounded-xl bg-gray-200/60 dark:bg-black/40 border border-gray-300 dark:border-[#232C45] text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Annual ($4.99/mo) <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-bold">SAVE 40%</span>
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-[#121A2C] text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly ($7.99/mo)
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2.5">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>

        {/* Upgrade Action Button */}
        <button
          onClick={handleUpgrade}
          className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-float transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>{user.isPro ? 'Renew Pro Membership' : 'Start 14-Day Free Trial'}</span>
        </button>

        <p className="text-[10px] font-bold uppercase tracking-widest text-center text-gray-400 dark:text-gray-500">
          Cancel anytime with 1-tap in Settings • No hidden fees
        </p>

      </div>
    </Modal>
  );
};
