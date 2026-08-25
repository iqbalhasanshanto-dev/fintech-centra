import React from 'react';
import { ChevronDown, Plus, Sun, Moon, Eye, Bell, User } from 'lucide-react';

export const DashboardNavBar: React.FC<{isDark: boolean; toggleTheme: () => void}> = ({ isDark, toggleTheme }) => {
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-slate-900 dark:bg-slate-900 border-b border-slate-700/30">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 via-cyan-500 to-cyan-600 rounded-md flex items-center justify-center text-white">
          <span className="font-bold">C</span>
        </div>
        <span className="text-lg font-semibold text-white">Centra</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-3">
        {/* This Month dropdown */}
        <div className="relative">
          <button className="flex items-center px-3 py-1.5 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 transition">
            <span>This Month</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
          {/* Placeholder for dropdown items – can be expanded later */}
        </div>
        {/* New Transaction button */}
        <button className="flex items-center px-3 py-1.5 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition">
          <Plus className="w-4 h-4 mr-1" />
          New Transaction
        </button>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
        </button>
        {/* Visibility toggle */}
        <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition" aria-label="Toggle visibility">
          <Eye className="w-5 h-5 text-white" />
        </button>
        {/* Notifications */}
        <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition" aria-label="Notifications">
          <Bell className="w-5 h-5 text-white" />
        </button>
        {/* User avatar */}
        <button className="flex items-center space-x-2 p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition" aria-label="User profile">
          <User className="w-5 h-5 text-white" />
        </button>
      </div>
    </nav>
  );
};
