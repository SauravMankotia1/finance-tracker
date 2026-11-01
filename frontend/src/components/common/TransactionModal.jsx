import React, { useState, useEffect } from 'react';
import { X, TrendingDown, TrendingUp, Calendar, Tag, CreditCard, AlignLeft, DollarSign } from 'lucide-react';
import { transactionApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EXPENSE_CATEGORIES = [
  'Food', 'Shopping', 'Transportation', 'Education', 'Healthcare',
  'Entertainment', 'Rent', 'Bills', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Business', 'Gifts', 'Other'
];

const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer', 'UPI', 'Other'];

export const TransactionModal = ({ isOpen, onClose, onSuccess, initialData = null, defaultType = 'EXPENSE' }) => {
  const { currencySymbol } = useAuth();
  const { success, error } = useToast();

  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'EXPENSE');
      setAmount(initialData.amount || '');
      setCategory(initialData.category || '');
      setDate(initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setPaymentMethod(initialData.paymentMethod || 'Card');
    } else {
      setType(defaultType);
      setAmount('');
      setCategory(defaultType === 'EXPENSE' ? 'Food' : 'Salary');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNotes('');
      setPaymentMethod('Card');
    }
  }, [initialData, defaultType, isOpen]);

  // When type changes, ensure valid default category
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'EXPENSE') {
      if (!EXPENSE_CATEGORIES.includes(category)) setCategory('Food');
    } else {
      if (!INCOME_CATEGORIES.includes(category)) setCategory('Salary');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      error('Please enter a valid amount greater than zero');
      return;
    }
    if (!description.trim()) {
      error('Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        category: category || (type === 'EXPENSE' ? 'Other' : 'Other Income'),
        date,
        description: description.trim(),
        notes: notes.trim(),
        paymentMethod,
      };

      if (initialData?.id) {
        await transactionApi.update(initialData.id, payload);
        success('Transaction updated successfully');
      } else {
        await transactionApi.create(payload);
        success(`${type === 'INCOME' ? 'Income' : 'Expense'} added successfully`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Transaction' : 'Record New Transaction'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in the details below to update your financial log
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Amount ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Grocery at Whole Foods"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    paymentMethod === pm
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Notes <span className="text-slate-400 normal-case font-normal">(Optional)</span>
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add extra context or receipt details..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
              } disabled:opacity-50`}
            >
              {submitting ? 'Saving...' : initialData ? 'Update Record' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
