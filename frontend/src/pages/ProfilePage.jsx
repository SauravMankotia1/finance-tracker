import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Key,
  Globe,
  Sparkles,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', name: 'Australian Dollar (AU$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
];

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  // Profile Update Form
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Demo Data State
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), currency });
      success('Profile & currency updated successfully');
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('Please complete all password fields');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!window.confirm('Populate realistic sample demo transactions and monthly budgets for this account? Existing transactions will be refreshed.')) {
      return;
    }

    setSeeding(true);
    try {
      await authApi.seedDemoData();
      success('Sample demo data seeded successfully! Check your Dashboard and Reports.');
    } catch (err) {
      console.error(err);
      error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently erase ALL transaction and budget records for this account? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      await authApi.clearData();
      success('All financial records cleared');
    } catch (err) {
      console.error(err);
      error('Failed to clear records');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Account & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, preferred currency, security credentials, and data sandbox
        </p>
      </div>

      {/* Account Info Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 uppercase">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                <Shield className="w-3 h-3" />
                <span>{user?.role || 'ROLE_USER'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Active Member
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Currency Form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              <span>Profile Information</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your name and primary display currency
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span>Change Password</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Protect your account with a secure passphrase
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Demo Sandbox Management */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Demonstration & Data Tools</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Need sample data for live demonstrations or want to start fresh with a clean slate?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={seeding || clearing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{seeding ? 'Seeding Data...' : 'Generate Demo Financial Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearData}
            disabled={seeding || clearing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>{clearing ? 'Clearing...' : 'Clear All My Records'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
