import React, { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { Transaction, Category, Pagination as PaginationType } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useApi';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
} from 'lucide-react';

const PAYMENT_METHODS = [
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'UPI',
  'OTHER',
];

export default function Transactions() {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    notes: '',
  });

  // Fetch categories
  useEffect(() => {
    get<Category[]>('/categories')
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (pageNumber = 1) => {
      try {
        setLoading(true);
        const params: any = {
          page: pageNumber,
          limit: 10,
          sortBy,
          sortOrder,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedType) params.type = selectedType;
        if (selectedCategory) params.categoryId = selectedCategory;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const res = await get<{ transactions: Transaction[]; pagination: PaginationType }>(
          '/transactions',
          params
        );
        setTransactions(res.transactions || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } catch (err: any) {
        addToast(err?.response?.data?.message || 'Failed to load transactions', 'error');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, selectedType, selectedCategory, startDate, endDate, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  // Form handling
  const openCreateModal = () => {
    setEditingTx(null);
    const defaultExpenseCat = categories.find((c) => c.type === 'EXPENSE');
    setFormData({
      type: 'EXPENSE',
      amount: '',
      categoryId: defaultExpenseCat?.id || (categories[0]?.id ?? ''),
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      categoryId: tx.categoryId,
      description: tx.description,
      date: new Date(tx.date).toISOString().split('T')[0],
      paymentMethod: tx.paymentMethod,
      notes: tx.notes || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      addToast('Please enter a positive amount', 'warning');
      return;
    }
    if (!formData.description.trim()) {
      addToast('Description is required', 'warning');
      return;
    }
    if (!formData.categoryId) {
      addToast('Please select a category', 'warning');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (editingTx) {
        await put(`/transactions/${editingTx.id}`, payload);
        addToast('Transaction updated successfully', 'success');
      } else {
        await post('/transactions', payload);
        addToast('Transaction added successfully', 'success');
      }
      setModalOpen(false);
      fetchTransactions(pagination.page);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to save transaction', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!txToDelete) return;
    try {
      setFormLoading(true);
      await del(`/transactions/${txToDelete}`);
      addToast('Transaction deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setTxToDelete(null);
      fetchTransactions(pagination.page);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to delete transaction', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">
            Log, categorize, filter, and track all your financial activities
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* Quick Type Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 shrink-0">
            <button
              onClick={() => setSelectedType('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedType === '' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('INCOME')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedType === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setSelectedType('EXPENSE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedType === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expenses
            </button>
          </div>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-xs inline-flex items-center gap-2 ${
              showFilters ? 'bg-slate-100 border-slate-400' : ''
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            More Filters
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {/* Category Filter */}
            <div>
              <label className="label text-xs">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input text-xs"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="label text-xs">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input text-xs"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="label text-xs">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input text-xs"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="label text-xs">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input text-xs"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="description">Description</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary p-2.5 shrink-0"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <LoadingSpinner />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            message="No transactions match your current search or filter criteria."
            action={
              <button onClick={openCreateModal} className="btn-primary text-xs">
                Add Transaction
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Description</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Payment</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(tx.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-900">{tx.description}</p>
                          {tx.notes && <p className="text-xs text-slate-400 mt-0.5">{tx.notes}</p>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {tx.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {tx.paymentMethod.replace('_', ' ')}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTxToDelete(tx.id);
                                setDeleteConfirmOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
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

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                return (
                  <div key={tx.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{tx.description}</h4>
                        <p className="text-xs text-slate-400">
                          {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {tx.category?.name}
                      </span>
                      <span>{tx.paymentMethod.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="text-emerald-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setTxToDelete(tx.id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchTransactions(p)}
              />
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, type: 'EXPENSE' });
                }}
                className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                  formData.type === 'EXPENSE'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, type: 'INCOME' });
                }}
                className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                  formData.type === 'INCOME'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input pl-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              placeholder="e.g. Grocery shopping, Salary payment..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Payment Method</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="input pl-9"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="label">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Any additional remarks..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
            />
          </div>

          {/* Submit Buttons */}
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
              {formLoading ? 'Saving...' : editingTx ? 'Update Transaction' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTxToDelete(null);
        }}
        loading={formLoading}
      />
    </div>
  );
}
