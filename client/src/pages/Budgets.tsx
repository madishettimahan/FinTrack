import React, { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { Budget, Category } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Plus,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Budgets() {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
  });

  // Load Categories
  useEffect(() => {
    get<Category[]>('/categories')
      .then((cats) => {
        const expenseCats = (cats || []).filter((c) => c.type === 'EXPENSE');
        setCategories(expenseCats);
      })
      .catch(() => {});
  }, []);

  // Fetch Budgets for current month & year
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await get<Budget[]>('/budgets', {
        month: selectedMonth,
        year: selectedYear,
      });
      setBudgets(res || []);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to fetch budgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormData({
      categoryId: categories[0]?.id || '',
      amount: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount.toString(),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      addToast('Please provide a valid budget amount', 'warning');
      return;
    }

    try {
      setFormLoading(true);
      if (editingBudget) {
        await put(`/budgets/${editingBudget.id}`, {
          amount: Number(formData.amount),
        });
        addToast('Budget updated successfully', 'success');
      } else {
        await post('/budgets', {
          categoryId: formData.categoryId,
          amount: Number(formData.amount),
          month: selectedMonth,
          year: selectedYear,
        });
        addToast('Budget created successfully', 'success');
      }
      setModalOpen(false);
      fetchBudgets();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to save budget', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;
    try {
      setFormLoading(true);
      await del(`/budgets/${budgetToDelete}`);
      addToast('Budget removed', 'success');
      setDeleteConfirmOpen(false);
      setBudgetToDelete(null);
      fetchBudgets();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to remove budget', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent), 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Budgets</h1>
          <p className="text-sm text-slate-500">
            Set and track spending limits by category to avoid overspending
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Navigator */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-slate-100 text-slate-600"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-700 select-none">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-slate-100 text-slate-600"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Budget
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="card bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-medium text-emerald-100">
              Total Budgeted
            </span>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-medium text-emerald-100">
              Total Spent
            </span>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-medium text-emerald-100">
              Overall Utilization
            </span>
            <p className="text-2xl font-bold mt-1">{overallPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<PiggyBank className="w-8 h-8 text-slate-400" />}
            title="No budgets set for this month"
            message="Plan your expenses by setting spending limits for categories."
            action={
              <button onClick={openCreateModal} className="btn-primary text-xs">
                Create First Budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const pct = Math.round(b.percentage);
            const isExceeded = b.status === 'EXCEEDED';
            const isWarning = b.status === 'WARNING';

            const badgeBg = isExceeded
              ? 'bg-rose-100 text-rose-700'
              : isWarning
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700';

            const barBg = isExceeded
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            const StatusIcon = isExceeded
              ? AlertOctagon
              : isWarning
              ? AlertTriangle
              : CheckCircle2;

            return (
              <div key={b.id} className="card flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-base">
                      {b.category?.name || 'Category'}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeBg}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {b.status}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-xs text-slate-500">
                      of {formatCurrency(b.amount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barBg}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Remaining text */}
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{pct}% used</span>
                    <span>
                      {isExceeded ? (
                        <span className="text-rose-600 font-medium">
                          Over by {formatCurrency(b.spent - b.amount)}
                        </span>
                      ) : (
                        <span>{formatCurrency(b.remaining)} remaining</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 text-xs inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setBudgetToDelete(b.id);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 text-xs inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBudget ? 'Edit Budget Limit' : 'Set Category Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingBudget && (
            <div>
              <label className="label">Expense Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Monthly Limit Amount</label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="e.g. 500.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
              disabled={formLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={formLoading}>
              {formLoading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Budget"
        message="Are you sure you want to remove this budget? Your transaction history will not be affected."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setBudgetToDelete(null);
        }}
        loading={formLoading}
      />
    </div>
  );
}
