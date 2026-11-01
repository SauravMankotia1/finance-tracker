import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  Briefcase,
  DollarSign,
  Calendar,
  Trash2,
  Edit2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { transactionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TransactionModal } from '../components/common/TransactionModal';

const INCOME_SOURCES = ['All', 'Salary', 'Freelance', 'Investments', 'Business', 'Gifts', 'Other Income'];

export const IncomePage = () => {
  const { openAddModal, refreshKey } = useOutletContext() || {};
  const { formatCurrency } = useAuth();
  const { success, error } = useToast();

  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('All');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: 'INCOME',
        size: 50,
        sortBy: 'date',
        sortDir: 'desc',
      };
      if (sourceFilter !== 'All') {
        params.category = sourceFilter;
      }
      const res = await transactionApi.getFiltered(params);
      if (res.data && res.data.success) {
        setIncomes(res.data.data.content || []);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load income records');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, error]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes, refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await transactionApi.delete(id);
      success('Income deleted');
      fetchIncomes();
    } catch (err) {
      console.error(err);
      error('Failed to delete income');
    }
  };

  const totalIncomeSum = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const topSource = incomes.length > 0 ? incomes[0].category : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Income Streams
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track salaries, dividends, consulting, and side businesses
          </p>
        </div>

        <button
          onClick={() => openAddModal?.('INCOME')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Income</span>
        </button>
      </div>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recorded Inflow
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalIncomeSum)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total filtered income</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Income Events
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {incomes.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Unique deposits recorded</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Primary Inflow Source
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 truncate">
            {topSource}
          </div>
          <p className="text-xs text-slate-400 mt-1">Most frequent stream</p>
        </div>
      </div>

      {/* Source Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        {INCOME_SOURCES.map((src) => (
          <button
            key={src}
            onClick={() => setSourceFilter(src)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sourceFilter === src
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {src}
          </button>
        ))}
      </div>

      {/* Income List Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading income logs...</div>
        ) : incomes.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <TrendingUp className="w-12 h-12 mx-auto text-emerald-500/40" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              No income entries recorded under this filter
            </p>
            <button
              onClick={() => openAddModal?.('INCOME')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
            >
              + Add Income Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5">Source / Category</th>
                  <th className="py-4 px-5">Method</th>
                  <th className="py-4 px-5 text-right">Amount</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {incomes.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap font-medium">
                      {tx.date}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">
                      {tx.description}
                      {tx.notes && <div className="text-xs text-slate-400 font-normal">{tx.notes}</div>}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap">
                      {tx.paymentMethod || 'Bank Transfer'}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatCurrency(tx.amount)}
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
        onSuccess={fetchIncomes}
        initialData={editingItem}
        defaultType="INCOME"
      />
    </div>
  );
};
