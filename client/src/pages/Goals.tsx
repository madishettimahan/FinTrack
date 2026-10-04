import React, { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { SavingsGoal } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Plus,
  Target,
  Edit2,
  Trash2,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function Goals() {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Adjust Funds Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedGoalForAdjust, setSelectedGoalForAdjust] = useState<SavingsGoal | null>(null);
  const [adjustOperation, setAdjustOperation] = useState<'ADD' | 'WITHDRAW'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState('');

  // Delete Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    description: '',
  });

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await get<SavingsGoal[]>('/goals');
      setGoals(res || []);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to fetch savings goals', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      description: goal.description || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Goal name is required', 'warning');
      return;
    }
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) {
      addToast('Target amount must be greater than zero', 'warning');
      return;
    }

    try {
      setFormLoading(true);
      const payload: any = {
        name: formData.name.trim(),
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount || 0),
        description: formData.description.trim() || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      };

      if (editingGoal) {
        await put(`/goals/${editingGoal.id}`, payload);
        addToast('Savings goal updated', 'success');
      } else {
        await post('/goals', payload);
        addToast('New savings goal created', 'success');
      }
      setModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to save goal', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const openAdjustModal = (goal: SavingsGoal, op: 'ADD' | 'WITHDRAW') => {
    setSelectedGoalForAdjust(goal);
    setAdjustOperation(op);
    setAdjustAmount('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForAdjust) return;
    const amountNum = Number(adjustAmount);
    if (!amountNum || amountNum <= 0) {
      addToast('Please enter a valid amount', 'warning');
      return;
    }

    try {
      setFormLoading(true);
      await post(`/goals/${selectedGoalForAdjust.id}/adjust`, {
        amount: amountNum,
        operation: adjustOperation,
      });
      addToast(
        `${adjustOperation === 'ADD' ? 'Added funds to' : 'Withdrawn funds from'} goal`,
        'success'
      );
      setAdjustModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Transaction failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;
    try {
      setFormLoading(true);
      await del(`/goals/${goalToDelete}`);
      addToast('Goal removed', 'success');
      setDeleteConfirmOpen(false);
      setGoalToDelete(null);
      fetchGoals();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to delete goal', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + Number(g.targetAmount), 0);
  const totalSaved = goals.reduce((acc, g) => acc + Number(g.currentAmount), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Savings Goals</h1>
          <p className="text-sm text-slate-500">
            Set target milestones, deposit funds, and track your dreams
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Total Saved</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Total Target Goal</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="card">
          <span className="text-xs font-medium text-slate-500 uppercase">Remaining to Goal</span>
          <p className="text-2xl font-bold text-slate-700 mt-1">
            {formatCurrency(Math.max(0, totalTarget - totalSaved))}
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Target className="w-8 h-8 text-slate-400" />}
            title="No savings goals yet"
            message="Create a savings goal for a vacation, emergency fund, or gadget."
            action={
              <button onClick={openCreateModal} className="btn-primary text-xs">
                Create First Goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct = Math.round(goal.percentage);
            const isCompleted = goal.isCompleted;

            return (
              <div
                key={goal.id}
                className="card flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    COMPLETED
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{goal.name}</h3>
                  {goal.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
                  )}

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline & Details */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    {goal.deadline ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(goal.deadline).toLocaleDateString()}
                        {goal.daysRemaining !== null && (
                          <span className="text-[11px] text-slate-400">
                            ({goal.daysRemaining > 0 ? `${goal.daysRemaining}d left` : 'Due'})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>No deadline</span>
                    )}
                    <span>{formatCurrency(goal.remaining)} left</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAdjustModal(goal, 'ADD')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-medium inline-flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Add
                    </button>
                    <button
                      onClick={() => openAdjustModal(goal, 'WITHDRAW')}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-medium inline-flex items-center gap-1"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      Withdraw
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setGoalToDelete(goal.id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="label">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Vacation to Bali, Emergency Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Target Amount</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 5000.00"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Current Saved Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 500.00"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Target Deadline (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Notes about this savings goal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
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
              {formLoading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Funds Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`${adjustOperation === 'ADD' ? 'Deposit to' : 'Withdraw from'} ${
          selectedGoalForAdjust?.name
        }`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Current balance: {formatCurrency(selectedGoalForAdjust?.currentAmount || 0)}
          </p>
          <div>
            <label className="label">Amount to {adjustOperation === 'ADD' ? 'Deposit' : 'Withdraw'}</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="input"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="btn-secondary"
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={adjustOperation === 'ADD' ? 'btn-primary' : 'btn-secondary'}
              disabled={formLoading}
            >
              {formLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this goal? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setGoalToDelete(null);
        }}
        loading={formLoading}
      />
    </div>
  );
}
