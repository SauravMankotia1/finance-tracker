import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const DashboardPage = () => {
  const { refreshKey, openAddModal } = useOutletContext() || {};
  const { formatCurrency, currencySymbol } = useAuth();
  const { isDark } = useTheme();
  const { error } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardApi.getStats();
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
          <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
        </div>
      </div>
    );
  }

  const {
    totalBalance = 0,
    totalIncome = 0,
    totalExpenses = 0,
    totalSavings = 0,
    savingsRate = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    monthlySavings = 0,
    monthlySavingsRate = 0,
    incomeGrowth = 0,
    expenseGrowth = 0,
    totalBudget = 0,
    totalBudgetSpent = 0,
    totalBudgetRemaining = 0,
    recentTransactions = [],
    categoryDistribution = [],
    monthlySpendingTrends = [],
  } = stats || {};

  // Custom Tooltip for Trend Area Chart
  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-xl backdrop-blur-md text-xs space-y-1.5">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
          <p className="flex items-center justify-between gap-4 text-emerald-400 font-semibold">
            <span>Income:</span>
            <span>{formatCurrency(payload[0]?.value)}</span>
          </p>
          <p className="flex items-center justify-between gap-4 text-red-400 font-semibold">
            <span>Expenses:</span>
            <span>{formatCurrency(payload[1]?.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Donut Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 text-white border border-slate-700/80 shadow-xl text-xs space-y-1">
          <p className="font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </p>
          <p className="font-mono text-emerald-400 font-bold">{formatCurrency(data.value)}</p>
          <p className="text-[11px] text-slate-400">{data.payload.percentage}% of total expenses</p>
        </div>
      );
    }
    return null;
  };

  const budgetUsagePercent = totalBudget > 0
    ? Math.min(Math.round((Number(totalBudgetSpent) / Number(totalBudget)) * 100), 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Action & Overview Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Executive Summary
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial performance and cash flow health
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={() => openAddModal?.('INCOME')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add Income</span>
          </button>

          <button
            onClick={() => openAddModal?.('EXPENSE')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Balance Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Net Balance
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${Number(totalBalance) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {savingsRate}%
              </span>
              <span>overall savings rate</span>
            </div>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {incomeGrowth >= 0 ? `+${incomeGrowth}%` : `${incomeGrowth}%`}
              </span>
              <span>vs last month</span>
            </div>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-red-500">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className={`font-bold flex items-center ${expenseGrowth > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {expenseGrowth > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {expenseGrowth >= 0 ? `+${expenseGrowth}%` : `${expenseGrowth}%`}
              </span>
              <span>spending pace</span>
            </div>
          </div>
        </div>

        {/* Total Savings Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Savings
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
              {formatCurrency(monthlySavings)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {monthlySavingsRate}%
              </span>
              <span>of this month's income saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar Alert Banner (if budget exists) */}
      {Number(totalBudget) > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                Number(totalBudgetSpent) > Number(totalBudget)
                  ? 'bg-red-500/10 text-red-500'
                  : budgetUsagePercent >= 80
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                {Number(totalBudgetSpent) > Number(totalBudget) ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Monthly Budget Status
                </h4>
                <p className="text-xs text-slate-500">
                  {formatCurrency(totalBudgetSpent)} spent of {formatCurrency(totalBudget)} allocated
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-slate-500">Remaining: <span className="text-slate-900 dark:text-white font-mono">{formatCurrency(totalBudgetRemaining)}</span></span>
              <Link
                to="/budgets"
                className="text-emerald-600 hover:text-emerald-500 inline-flex items-center gap-1"
              >
                <span>Manage Limits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                Number(totalBudgetSpent) > Number(totalBudget)
                  ? 'bg-red-500'
                  : budgetUsagePercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Charts Grid: Income vs Expense Trend & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trends Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Monthly Cash Flow Trends</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of income versus expenses over the past 6 months
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendingTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="monthName" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution Donut Chart (1 Col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              <span>Expense Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Spending breakdown by active category
            </p>
          </div>

          {categoryDistribution.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
              <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
              <span>No expense records found yet.</span>
              <button
                onClick={() => openAddModal?.('EXPENSE')}
                className="mt-3 text-emerald-600 font-bold hover:underline"
              >
                + Add your first expense
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Pills Legends */}
              <div className="w-full flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto pt-2">
                {categoryDistribution.slice(0, 6).map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-medium"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                    <span className="text-slate-400 font-bold">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your latest monetary inflows and outflows</p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold">No recent transactions to display</p>
            <button
              onClick={() => openAddModal?.('EXPENSE')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer"
            >
              + Create Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {recentTransactions.map((tx) => {
                  const isInc = tx.type === 'INCOME';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{tx.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod || 'Card'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold whitespace-nowrap">
                        <span className={isInc ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-red-500 font-mono'}>
                          {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
