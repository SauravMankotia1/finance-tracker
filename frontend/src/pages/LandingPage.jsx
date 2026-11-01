import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  ShieldCheck,
  PieChart,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              Fin<span className="text-emerald-500">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Background gradient decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Next-Generation Personal Finance SaaS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Take total control of your money with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400">
              precision & clarity.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            Track daily expenses, manage income streams, set smart category budgets, and unlock deep financial insights with interactive analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <span>Start Tracking for Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all"
            >
              <span>Explore Live Demo</span>
            </Link>
          </div>

          {/* Social Proof Tags */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero-Config Instant Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Multi-Currency Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Bank-Grade JWT Security</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="relative rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-slate-200/60 via-slate-100 to-slate-200/30 dark:from-slate-800/60 dark:via-slate-900/60 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-inner p-6 sm:p-8">
              {/* Mockup Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Financial Health Overview</h3>
                  <p className="text-xs text-slate-500">Live analytics dashboard overview</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    +18.4% Net Savings Growth
                  </span>
                </div>
              </div>

              {/* Mockup Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-500">Total Net Balance</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">$14,850.00</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ↑ +$3,200 this month
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Monthly Income</span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">$5,730.00</div>
                  <div className="text-xs text-slate-500 mt-1">Salary + Freelance</div>
                </div>

                <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">Monthly Expenses</span>
                  <div className="text-2xl font-black text-red-600 dark:text-red-300 mt-1">$2,185.00</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    Within planned budget
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/50">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Savings Rate</span>
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">61.9%</div>
                  <div className="text-xs text-slate-500 mt-1">Top tier financial health</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Everything You Need
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Engineered for effortless personal financial freedom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Live Income & Expense Logging</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Add, edit, filter, and categorize transactions in seconds. Full search capabilities, dates, notes, and payment methods.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Budget Spending Limits</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Set monthly limits per category. Visual progress bars alert you before you overspend so you stay on target.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Deep Analytics & CSV Export</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Weekly, monthly, and yearly reports with interactive Recharts. Export clean CSV statements anytime with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <span>FinFlow</span>
          </div>
          <p>© {new Date().getFullYear()} FinFlow. Production-ready Personal Finance Web Application.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
