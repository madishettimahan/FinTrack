import React, { useState, useEffect } from 'react';
import { get } from '../services/api';
import { AnalyticsData } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';

export default function Analytics() {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await get<AnalyticsData>('/analytics');
      setData(res);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!data) {
    return (
      <EmptyState
        icon={<LineChart className="w-8 h-8 text-slate-400" />}
        title="No analytics data available"
        message="Add more transactions and budgets to generate comparative financial insights."
      />
    );
  }

  const { metrics, insights } = data;

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const incomeChange = calculateChange(metrics.currentMonth.income, metrics.lastMonth.income);
  const expenseChange = calculateChange(metrics.currentMonth.expense, metrics.lastMonth.expense);
  const savingsChange = calculateChange(metrics.currentMonth.savings, metrics.lastMonth.savings);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Insights & Analytics</h1>
        <p className="text-sm text-slate-500">
          Descriptive monthly trends, pacing analysis, and automated budget observations
        </p>
      </div>

      {/* Month-over-Month Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics.currentMonth.income)}
            </span>
            {incomeChange !== null && (
              <span
                className={`text-xs font-semibold inline-flex items-center ${
                  incomeChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {incomeChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {Math.abs(incomeChange)}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Last month: {formatCurrency(metrics.lastMonth.income)}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics.currentMonth.expense)}
            </span>
            {expenseChange !== null && (
              <span
                className={`text-xs font-semibold inline-flex items-center ${
                  expenseChange <= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {expenseChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {Math.abs(expenseChange)}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Last month: {formatCurrency(metrics.lastMonth.expense)}
          </p>
        </div>

        {/* Net Savings Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Net Savings</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold ${
                metrics.currentMonth.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(metrics.currentMonth.savings)}
            </span>
            {savingsChange !== null && (
              <span
                className={`text-xs font-semibold inline-flex items-center ${
                  savingsChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {savingsChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {Math.abs(savingsChange)}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Savings rate: {Math.round(metrics.currentMonth.savingsRate)}%
          </p>
        </div>

        {/* Projections Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Spending Pace</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics.dailyAverageSpending)}/day
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Proj. month end: {formatCurrency(metrics.projectedMonthEndExpense)}
          </p>
        </div>
      </div>

      {/* Automated Spending Insights Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold text-slate-900">Smart Observations & Insights</h2>
        </div>
        <p className="text-xs text-slate-400 -mt-3 mb-4">
          Heuristic observations calculated from your spending distribution and history
        </p>

        {insights.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            No specific insights yet. Keep tracking transactions to unlock pattern recognition!
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((ins) => {
              const isWarning = ins.type === 'warning';
              const isPositive = ins.type === 'positive';

              const Icon = isWarning
                ? AlertTriangle
                : isPositive
                ? CheckCircle2
                : Info;

              const bgClass = isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : isPositive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900';

              const iconColor = isWarning
                ? 'text-amber-600'
                : isPositive
                ? 'text-emerald-600'
                : 'text-blue-600';

              return (
                <div
                  key={ins.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${bgClass}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <h3 className="text-sm font-semibold">{ins.title}</h3>
                    <p className="text-xs mt-0.5 opacity-90">{ins.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
