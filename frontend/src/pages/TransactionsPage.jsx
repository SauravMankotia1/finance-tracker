import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { transactionApi, reportApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TransactionModal } from '../components/common/TransactionModal';

const CATEGORIES = [
  'All',
  // Expense
  'Food', 'Shopping', 'Transportation', 'Education', 'Healthcare', 'Entertainment', 'Rent', 'Bills', 'Other',
  // Income
  'Salary', 'Freelance', 'Investments', 'Business', 'Gifts', 'Other Income',
];

export const TransactionsPage = () => {
  const { openAddModal, refreshKey } = useOutletContext() || {};
  const { formatCurrency } = useAuth();
  const { success, error } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [type, setType] = useState(''); // '' (all), 'INCOME', 'EXPENSE'
  const [category, setCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Edit Modal State
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 10,
        sortBy,
        sortDir,
      };

      if (type) params.type = type;
      if (category && category !== 'All') params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search.trim()) params.search = search.trim();

      const res = await transactionApi.getFiltered(params);
      if (res.data && res.data.success) {
        setTransactions(res.data.data.content || []);
        setTotalPages(res.data.data.totalPages || 0);
        setTotalElements(res.data.data.totalElements || 0);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, type, category, startDate, endDate, search, error]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  const handleResetFilters = () => {
    setSearch('');
    setType('');
    setCategory('All');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortDir('desc');
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) {
      return;
    }

    try {
      setDeletingId(id);
      await transactionApi.delete(id);
      success('Transaction deleted successfully');
      fetchTransactions();
    } catch (err) {
      console.error(err);
      error('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await reportApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finflow_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('CSV statement downloaded successfully!');
    } catch (err) {
      console.error(err);
      error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and audit every incoming and outgoing dollar
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => openAddModal?.('EXPENSE')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search input + Type selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search description, store, or notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(0);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="INCOME">Income Only</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Ranges and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Sort:
              </span>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [b, d] = e.target.value.split('-');
                  setSortBy(b);
                  setSortDir(d);
                  setPage(0);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="date-desc">Newest Date First</option>
                <option value="date-asc">Oldest Date First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">
            <p className="text-sm font-semibold">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              No transactions match your criteria
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, clearing date filters, or add a new transaction.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
            >
              Clear Filters
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
                {transactions.map((tx) => {
                  const isInc = tx.type === 'INCOME';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap font-medium">
                        {tx.date}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {isInc ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span>{tx.description}</span>
                        </div>
                        {tx.notes && (
                          <div className="text-xs text-slate-400 pl-6 mt-0.5 max-w-sm truncate">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod || 'Card'}
                      </td>
                      <td className="py-4 px-5 text-right font-bold whitespace-nowrap">
                        <span
                          className={`font-mono ${
                            isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                          }`}
                        >
                          {isInc ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-bold text-slate-800 dark:text-slate-200">{page + 1}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({totalElements} items)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          fetchTransactions();
        }}
        initialData={editingTransaction}
      />
    </div>
  );
};
