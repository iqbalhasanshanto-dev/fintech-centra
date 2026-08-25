import React from 'react';
import {
  Home,
  PieChart,
  Target,
  SlidersHorizontal,
  Plus,
  Sparkles,
  Shield,
  ArrowUpRight,
  LogOut
} from 'lucide-react';
import { TabType } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddAction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddAction,
}) => {
  const { user, logout } = useAuth();
  const { totalBalance, settings } = useFinance();

  const navItems = [
    { id: 'home' as TabType, label: 'Dashboard', icon: Home },
    { id: 'report' as TabType, label: 'Analytics & Reports', icon: PieChart },
    { id: 'plan' as TabType, label: 'Goals & Budgets', icon: Target },
    { id: 'settings' as TabType, label: 'Settings & Security', icon: SlidersHorizontal },
  ];

  return (
    <aside className="hidden md:flex flex-col shrink-0 w-64 lg:w-72 h-screen sticky top-0 bg-white dark:bg-[#131722] border-r border-gray-200/80 dark:border-[#1e2638] p-5 justify-between select-none z-30 transition-colors">

      {/* Top Header & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center space-x-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-lg font-black font-display tracking-tight text-ink dark:text-[#f8fafc]">
                CENTRA
              </h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-[#64748b] font-medium">
              Smart Financial Hub
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-1">
          <button
            onClick={onOpenAddAction}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Transaction / Transfer</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5 pt-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-[#64748b] px-3 mb-2">
            Main Menu
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full py-3 px-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200/70 dark:border-brand-900/40 shadow-xs'
                    : 'text-gray-600 hover:text-ink dark:text-[#64748b] dark:hover:text-[#f8fafc] hover:bg-gray-100/70 dark:hover:bg-[#1e2638]/50'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-[#64748b]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-4 bg-brand-600 dark:bg-brand-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#1e2638]">
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1e2638]/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/20 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink dark:text-[#f8fafc] truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#64748b] truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Log out of Centra?')) {
                logout();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
