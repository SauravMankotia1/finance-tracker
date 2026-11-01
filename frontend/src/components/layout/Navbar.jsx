import React from 'react';
import { Menu, Plus, Sun, Moon, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onOpenSidebar, onOpenAddModal, title = 'Dashboard' }) => {
  const { user, currencyCode, currencySymbol } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Hamburger (mobile) + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 -mt-0.5">
              Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Right: Currency pill, Quick Add, Theme toggle, Profile avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Currency indicator badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currencyCode}</span>
            <span className="text-slate-400 font-mono">({currencySymbol})</span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="hidden sm:flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
