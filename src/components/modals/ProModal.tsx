import React, { useState } from 'react';
import { Sparkles, Check, Zap, Shield, Target, ArrowRight } from 'lucide-react';
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
      colors: ['#6C5CE7', '#8B7CF6', '#1FAE71', '#F5A524'],
    });

    addNotification({
      type: 'system',
      title: 'Centra Pro Activated! 🌟',
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
        
        {/* Banner with gradient */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 text-white text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-display">
            Centra Pro Unlimited
          </h3>
          <p className="text-xs text-brand-100 mt-1 max-w-xs mx-auto">
            Take full command of your budget, investments, and financial freedom.
          </p>

          {/* Pricing Selector */}
          <div className="mt-4 inline-flex p-1 rounded-2xl bg-black/25 backdrop-blur-md text-xs font-bold">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                billingCycle === 'annual' ? 'bg-white text-brand-700 shadow-xs' : 'text-white/80'
              }`}
            >
              Annual ($4.99/mo) <span className="text-[10px] text-emerald-300 ml-1">SAVE 40%</span>
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-brand-700 shadow-xs' : 'text-white/80'
              }`}
            >
              Monthly ($7.99/mo)
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2.5">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 text-xs text-ink dark:text-gray-200">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-growth flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>

        {/* Upgrade Action Button */}
        <button
          onClick={handleUpgrade}
          className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <Zap className="w-4 h-4" />
          <span>{user.isPro ? 'Renew Pro Membership' : 'Start 14-Day Free Trial'}</span>
        </button>

        <p className="text-[11px] text-center text-gray-400">
          Cancel anytime with 1-tap in Settings. No hidden fees.
        </p>

      </div>
    </Modal>
  );
};
