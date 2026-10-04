import React, { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { Subscription, Category, SubscriptionData } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Plus,
  RefreshCcw,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react';

const CYCLES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
const STATUSES = ['ACTIVE', 'PAUSED', 'CANCELLED'];

export default function Subscriptions() {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState({
    totalMonthlyCost: 0,
    totalYearlyCost: 0,
    activeCount: 0,
    upcomingCount: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    nextPaymentDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
  });

  // Load categories
  useEffect(() => {
    get<Category[]>('/categories')
      .then((cats) => {
        const expenseCats = (cats || []).filter((c) => c.type === 'EXPENSE');
        setCategories(expenseCats);
      })
      .catch(() => {});
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await get<SubscriptionData>('/subscriptions');
      setSubscriptions(res?.subscriptions || []);
      setMetrics(
        res?.metrics || {
          totalMonthlyCost: 0,
          totalYearlyCost: 0,
          activeCount: 0,
          upcomingCount: 0,
        }
      );
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to fetch subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openCreateModal = () => {
    setEditingSub(null);
    setFormData({
      name: '',
      amount: '',
      billingCycle: 'MONTHLY',
      nextPaymentDate: new Date().toISOString().split('T')[0],
      categoryId: categories[0]?.id || '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      billingCycle: sub.billingCycle,
      nextPaymentDate: new Date(sub.nextPaymentDate).toISOString().split('T')[0],
      categoryId: sub.categoryId,
      status: sub.status,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Name is required', 'warning');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      addToast('Amount must be greater than zero', 'warning');
      return;
    }
    if (!formData.categoryId) {
      addToast('Please select a category', 'warning');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        name: formData.name.trim(),
        amount: Number(formData.amount),
        billingCycle: formData.billingCycle,
        nextPaymentDate: new Date(formData.nextPaymentDate).toISOString(),
        categoryId: formData.categoryId,
        status: formData.status,
      };

      if (editingSub) {
        await put(`/subscriptions/${editingSub.id}`, payload);
        addToast('Subscription updated', 'success');
      } else {
        await post('/subscriptions', payload);
        addToast('Subscription added', 'success');
      }
      setModalOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to save subscription', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subToDelete) return;
    try {
      setFormLoading(true);
      await del(`/subscriptions/${subToDelete}`);
      addToast('Subscription deleted', 'success');
      setDeleteConfirmOpen(false);
      setSubToDelete(null);
      fetchSubscriptions();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to delete subscription', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-sm text-slate-500">
            Keep track of recurring bills, streaming services, and memberships
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Monthly Cost</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.totalMonthlyCost)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Normalized monthly impact</p>
        </div>
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Annual Cost</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.totalYearlyCost)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Projected yearly expenses</p>
        </div>
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Active Subscriptions</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.activeCount}</p>
          <p className="text-xs text-slate-400 mt-1">Currently billing</p>
        </div>
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Due Soon (≤ 7 Days)</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.upcomingCount}</p>
          <p className="text-xs text-slate-400 mt-1">Payments approaching</p>
        </div>
      </div>

      {/* Subscriptions Table / Cards */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <LoadingSpinner />
        ) : subscriptions.length === 0 ? (
          <EmptyState
            icon={<RefreshCcw className="w-8 h-8 text-slate-400" />}
            title="No subscriptions recorded"
            message="Add recurring services like Netflix, Spotify, or Gym memberships."
            action={
              <button onClick={openCreateModal} className="btn-primary text-xs">
                Add Subscription
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Billing Cycle</th>
                  <th className="py-3.5 px-4 font-semibold">Next Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Cost</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => {
                  const isDueSoon = sub.isDueSoon;
                  const StatusIcon =
                    sub.status === 'ACTIVE'
                      ? CheckCircle2
                      : sub.status === 'PAUSED'
                      ? PauseCircle
                      : XCircle;

                  const statusClass =
                    sub.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : sub.status === 'PAUSED'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600';

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isDueSoon ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{sub.name}</span>
                          {isDueSoon && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" />
                              Due Soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {sub.category?.name || 'General'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                          {sub.billingCycle}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(sub.nextPaymentDate).toLocaleDateString()}
                          <span className="text-[11px] text-slate-400">
                            ({sub.daysUntilDue > 0 ? `in ${sub.daysUntilDue}d` : 'Today'})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{formatCurrency(sub.amount)}</p>
                        <p className="text-[11px] text-slate-400">
                          ~{formatCurrency(sub.monthlyNormalized)}/mo
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSubToDelete(sub.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
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
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSub ? 'Edit Subscription' : 'Add Subscription'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="label">Service Name</label>
            <input
              type="text"
              placeholder="e.g. Netflix, Spotify, Gym, AWS"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 15.99"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Billing Cycle</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                className="input"
              >
                {CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Next Payment Date</label>
              <input
                type="date"
                value={formData.nextPaymentDate}
                onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Category</label>
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
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
              {formLoading ? 'Saving...' : editingSub ? 'Update Subscription' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Subscription"
        message="Are you sure you want to stop tracking this subscription?"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setSubToDelete(null);
        }}
        loading={formLoading}
      />
    </div>
  );
}
