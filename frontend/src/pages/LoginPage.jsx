import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      success('Welcome back to FinFlow!');
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Login: Registers with demo data if not present, then logs in!
  const handleQuickDemo = async () => {
    setDemoLoading(true);
    const demoEmail = 'alex.morgan@finflow.demo';
    const demoPassword = 'DemoPassword123!';

    try {
      // Try login first
      await login(demoEmail, demoPassword);
      success('Logged in with Demo Account!');
      navigate('/dashboard', { replace: true });
    } catch {
      // If not exists, register the demo user with sample data enabled
      try {
        await register({
          name: 'Alex Morgan',
          email: demoEmail,
          password: demoPassword,
          currency: 'USD',
          seedDemoData: true,
        });
        success('Demo Account created with sample financial records!');
        navigate('/dashboard', { replace: true });
      } catch (regErr) {
        error('Failed to launch demo account: ' + (regErr.response?.data?.message || regErr.message));
      }
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              Fin<span className="text-emerald-500">Flow</span>
            </span>
          </Link>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enter your credentials to access your financial dashboard
          </p>

          {/* Quick Demo Login Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">Want a quick test drive?</span>
                  <span className="text-emerald-700 dark:text-emerald-300">Sign in with a pre-seeded demo account instantly.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={demoLoading || loading}
                className="px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '1-Click Demo'}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Visual Showcase (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="max-w-md space-y-6 text-white relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bank-grade security</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Smart budgeting that adapts to your life.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            FinFlow connects all your financial streams into one intuitive dashboard with real-time analytics, automated budget alerts, and zero clutter.
          </p>
        </div>
      </div>
    </div>
  );
};
