import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  TrendingDown,
  Plus,
  Tag,
  Calendar,
  Trash2,
  Edit2,
  Receipt,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { transactionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TransactionModal } from '../components/common/TransactionModal';

const EXPENSE_CATEGORIES = [
  'All', 'Food', 'Shopping', 'Transportation', 'Education', 'Healthcare',
  'Entertainment', 'Rent', 'Bills', 'Other'
];

export const ExpensesPage = () => {
  const { openAddModal, refreshKey } = useOutletContext() || {};
  const { formatCurrency } = useAuth();
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: 'EXPENSE',
        size: 50,
        sortBy: 'date',
        sortDir: 'desc',
      };
      if (categoryFilter !== 'All') {
        params.category = categoryFilter;
      }
      const res = await transactionApi.getFiltered(params);
      if (res.data && res.data.success) {
        setExpenses(res.data.data.content || []);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load expense logs');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, error]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await transactionApi.delete(id);
      success('Expense deleted');
      fetchExpenses();
    } catch (err) {
      console.error(err);
      error('Failed to delete expense');
    }
  };

  const totalExpenseSum = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const topCategory = expenses.length > 0 ? expenses[0].category : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Expenses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor, categorize, and curb discretionary and recurring spending
          </p>
        </div>

        <button
          onClick={() => openAddModal?.('EXPENSE')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Filtered Outflow
          </span>
          <div className="text-2xl sm:text-3xl font-black text-red-500 mt-2">
            {formatCurrency(totalExpenseSum)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cumulative expense amount</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recorded Expense Items
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {expenses.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Purchases and bills paid</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Filter Category
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 truncate">
            {categoryFilter}
          </div>
          <p className="text-xs text-slate-400 mt-1">Currently selected lens</p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat
                ? 'bg-red-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses List Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Receipt className="w-12 h-12 mx-auto text-red-500/40" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              No expenses recorded for this category
            </p>
            <button
              onClick={() => openAddModal?.('EXPENSE')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600"
            >
              + Add Expense Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Method</th>
                  <th className="py-4 px-5 text-right">Amount</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {expenses.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap font-medium">
                      {tx.date}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">
                      {tx.description}
                      {tx.notes && <div className="text-xs text-slate-400 font-normal">{tx.notes}</div>}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap">
                      {tx.paymentMethod || 'Card'}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-red-500 whitespace-nowrap">
                      -{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(tx);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <TransactionModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingItem(null);
        }}
        onSuccess={fetchExpenses}
        initialData={editingItem}
        defaultType="EXPENSE"
      />
    </div>
  );
};
