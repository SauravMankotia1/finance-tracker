import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  X,
  Sparkles,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { budgetApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EXPENSE_CATEGORIES = [
  'Food', 'Shopping', 'Transportation', 'Education', 'Healthcare',
  'Entertainment', 'Rent', 'Bills', 'Other'
];

export const BudgetsPage = () => {
  const { formatCurrency, currencySymbol } = useAuth();
  const { success, error } = useToast();

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [categoryName, setCategoryName] = useState('Food');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetApi.getAll({ month: selectedMonth, year: selectedYear });
      if (res.data && res.data.success) {
        setBudgets(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, error]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setCategoryName(budget.categoryName);
      setMonthlyLimit(budget.monthlyLimit);
      setAlertThreshold(budget.alertThreshold || 80);
    } else {
      setEditingBudget(null);
      setCategoryName('Food');
      setMonthlyLimit('');
      setAlertThreshold(80);
    }
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!monthlyLimit || Number(monthlyLimit) <= 0) {
      error('Please specify a positive budget limit');
      return;
    }

    setSaving(true);
    try {
      await budgetApi.save({
        categoryName,
        monthlyLimit: parseFloat(monthlyLimit),
        month: selectedMonth,
        year: selectedYear,
        alertThreshold: parseInt(alertThreshold, 10),
      });
      success(`Budget for ${categoryName} saved successfully`);
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await budgetApi.delete(id);
      success('Budget limit deleted');
      fetchBudgets();
    } catch (err) {
      console.error(err);
      error('Failed to delete budget');
    }
  };

  // Aggregates
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.monthlyLimit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.actualSpent || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Budget Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Establish spending caps and prevent budget overruns
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 rounded-2xl shadow-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Allocated Budget
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalBudgeted)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across {budgets.length} categories</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Actual Spent
          </span>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${totalSpent > totalBudgeted ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{overallPercent}% of total allocation consumed</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Available Remaining
          </span>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${totalRemaining < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatCurrency(totalRemaining)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Net surplus headroom</p>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading budget tracks...</div>
      ) : budgets.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <PieChart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            No budgets defined for this month
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Setting budget limits for groceries, rent, shopping, and entertainment helps you save more money effortlessly.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
          >
            + Create First Budget Limit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isOver = b.isExceeded;
            const isWarn = b.isWarning;
            const pct = Math.min(Math.round(b.percentageUsed || 0), 100);

            let statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On Track</span>
              </span>
            );

            let barColor = 'bg-emerald-500';

            if (isOver) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Exceeded Limit</span>
                </span>
              );
              barColor = 'bg-red-500';
            } else if (isWarn) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Warning ({b.alertThreshold}%)</span>
                </span>
              );
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {b.categoryName}
                    </h3>
                    {statusBadge}
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(b.actualSpent)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">
                        of {formatCurrency(b.monthlyLimit)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-500 font-mono">
                      {Math.round(b.percentageUsed)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {b.remaining >= 0 ? 'Remaining:' : 'Over by:'}
                    </span>
                    <span className={`font-mono font-bold ${b.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {formatCurrency(Math.abs(b.remaining))}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenModal(b)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Edit limit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Delete budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingBudget ? 'Edit Spending Limit' : 'Set Category Budget'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define budget ceiling for {selectedMonth}/{selectedYear}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={!!editingBudget}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer disabled:opacity-60"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Monthly Limit ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="e.g. 500.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Alert Warning Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Trigger an attention alert when spending reaches this percentage
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
