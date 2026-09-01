import React from 'react';
import {
  Home,
  PieChart,
  Target,
  SlidersHorizontal,
  Shield,
  LogOut,
  Plus
} from 'lucide-react';
import { TabType } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddAction?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddAction,
}) => {
  const { user, logout } = useAuth();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'report', label: 'Analytics', icon: PieChart },
    { id: 'plan', label: 'Budgets', icon: Target },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  return (
    <aside className="hidden lg:flex flex-col shrink-0 w-64 h-screen sticky top-0 bg-white dark:bg-[#121A2C] border-r border-gray-200 dark:border-[#232C45] p-5 justify-between select-none z-30 transition-colors">

      {/* Top Header & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center space-x-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
                CENTRA
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
              Financial Overview
            </p>
          </div>
        </div>

        {/* Quick Action Button in Sidebar */}
        {onOpenAddAction && (
          <div className="px-1">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onOpenAddAction}
              icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            >
              New transaction
            </Button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="space-y-1.5 pt-2" aria-label="Sidebar Navigation">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-2">
            Menu
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white dark:!bg-[#C6FF3D] dark:!text-[#171717] font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A233A]'
                }`}
                aria-label={item.label}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-105' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Card */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-[#232C45]">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-[#232C45] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-[#232C45] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
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
            className="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Log out of session"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
