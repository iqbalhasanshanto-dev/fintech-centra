import React from 'react';
import { ChevronDown, Moon, Sun, Bell, Shield } from 'lucide-react';

export const DashboardNavBar: React.FC<{isDark: boolean; toggleTheme: () => void}> = ({ isDark, toggleTheme }) => {
  return (
    <header className="border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white fill-white/20" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CENTRA</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-gray-900 border border-gray-800 rounded-full px-4 py-1.5 text-sm font-medium">
            <span className="text-gray-400">This Month</span>
            <ChevronDown className="ml-2 w-3 h-3 text-gray-400" />
          </div>
          <div className="flex items-center gap-4 border-l border-gray-800 pl-6">
            <button onClick={toggleTheme} className="text-gray-400 hover:text-white transition-colors" aria-label="Toggle theme">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors relative" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg"
              className="w-8 h-8 rounded-full border border-gray-700"
              alt="Profile"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
