import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart as PieChartIcon,
  Sparkles,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { reportApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const ReportsPage = () => {
  const { formatCurrency, currencySymbol } = useAuth();
  const { isDark } = useTheme();
  const { success, error } = useToast();

  const [period, setPeriod] = useState('monthly'); // 'weekly', 'monthly', 'yearly'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAnalytics({ period });
      if (res.data && res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period, error]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await reportApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finflow_report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Financial statement CSV downloaded successfully');
    } catch (err) {
      console.error(err);
      error('Failed to download CSV');
    } finally {
      setExporting(false);
    }
  };

  const {
    totalIncome = 0,
    totalExpenses = 0,
    netSavings = 0,
    savingsRate = 0,
    averageExpense = 0,
    topSpendingCategory = 'N/A',
    topCategoryAmount = 0,
    categoryBreakdown = [],
    trendData = [],
  } = analytics || {};

  // Custom Chart Tooltips
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 text-white border border-slate-700/80 shadow-xl text-xs space-y-1">
          <p className="font-bold border-b border-slate-700 pb-1">{label}</p>
          <p className="flex justify-between gap-4 text-emerald-400 font-semibold">
            <span>Income:</span>
            <span>{formatCurrency(payload[0]?.value)}</span>
          </p>
          <p className="flex justify-between gap-4 text-red-400 font-semibold">
            <span>Expenses:</span>
            <span>{formatCurrency(payload[1]?.value)}</span>
          </p>
          <p className="flex justify-between gap-4 text-blue-400 font-semibold">
            <span>Savings:</span>
            <span>{formatCurrency(payload[2]?.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Analytics & Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Macro-level trends, income versus expenses, and spending velocity
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {/* Period Selector Tabs */}
          <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
            {['weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  period === p
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Period Inflow
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-xs text-slate-400 mt-1 capitalize">{period} deposits</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Period Outflow
          </span>
          <div className="text-2xl sm:text-3xl font-black text-red-500 mt-2">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-xs text-slate-400 mt-1 capitalize">{period} burn</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Net Surplus / Savings
          </span>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${Number(netSavings) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
            {formatCurrency(netSavings)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{savingsRate}% savings rate</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top Outflow Category
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 truncate">
            {topSpendingCategory}
          </div>
          <p className="text-xs text-slate-400 mt-1">{formatCurrency(topCategoryAmount)}</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span className="capitalize">{period} Income vs Expense Comparison</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side cash flow distribution
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="monthName" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" />
                <Bar dataKey="savings" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Net Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut / List */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              <span>Category Concentration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of spending in this period
            </p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No expenses in this period
            </div>
          ) : (
            <div className="space-y-3 pt-4 max-h-72 overflow-y-auto">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
