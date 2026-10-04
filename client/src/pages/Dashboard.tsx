import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../services/api';
import { DashboardData } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { IncomeExpenseChart } from '../charts/IncomeExpenseChart';
import { CategoryPieChart } from '../charts/CategoryPieChart';
import { BudgetUtilizationChart } from '../charts/BudgetUtilizationChart';
import { SavingsProgressChart } from '../charts/SavingsProgressChart';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  PlusCircle,
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await get<DashboardData>('/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center py-12">
        <p className="text-rose-500 font-medium mb-4">{error || 'Unable to load dashboard'}</p>
        <button onClick={fetchDashboard} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const { summary, charts, recentTransactions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your personal financial health</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/transactions" className="btn-primary inline-flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="card border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalBalance)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Cumulative across all transactions</p>
        </div>

        {/* Total Income */}
        <div className="card border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalIncome)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This month: <span className="text-blue-600 font-medium">{formatCurrency(summary.monthIncome)}</span>
          </p>
        </div>

        {/* Total Expenses */}
        <div className="card border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalExpenses)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This month: <span className="text-rose-600 font-medium">{formatCurrency(summary.monthExpenses)}</span>
          </p>
        </div>

        {/* Monthly Savings */}
        <div className="card border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Monthly Savings
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.monthSavings)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Net savings this current month
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Monthly Cash Flow</h2>
              <p className="text-xs text-slate-400">Income vs Expenses (Last 6 Months)</p>
            </div>
          </div>
          <IncomeExpenseChart data={charts.monthlyTrends} />
        </div>

        {/* Expenses by Category */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Expense Breakdown</h2>
              <p className="text-xs text-slate-400">Spending grouped by category</p>
            </div>
          </div>
          <CategoryPieChart data={charts.expensesByCategory} />
        </div>

        {/* Budget Utilization */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Budget Status</h2>
              <p className="text-xs text-slate-400">Monthly category budget limits vs actuals</p>
            </div>
            <Link to="/budgets" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              Manage Budgets
            </Link>
          </div>
          <BudgetUtilizationChart data={charts.budgetUtilization} />
        </div>

        {/* Savings Goals Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Savings Goals</h2>
              <p className="text-xs text-slate-400">Target amounts and current completion</p>
            </div>
            <Link to="/goals" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              View Goals
            </Link>
          </div>
          <SavingsProgressChart data={charts.savingsProgress} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Recent Transactions</h2>
            <p className="text-xs text-slate-400">Your latest income and expense activities</p>
          </div>
          <Link
            to="/transactions"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            No transactions found. Add your first transaction to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {tx.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold whitespace-nowrap ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
