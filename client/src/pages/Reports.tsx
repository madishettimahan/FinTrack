import React, { useState, useEffect, useCallback } from 'react';
import { get } from '../services/api';
import { ReportData } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
} from 'lucide-react';

const RANGES = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'last-3-months', label: 'Last 3 Months' },
  { id: 'last-6-months', label: 'Last 6 Months' },
  { id: 'this-year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

export default function Reports() {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const [selectedRange, setSelectedRange] = useState('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { range: selectedRange };
      if (selectedRange === 'custom') {
        if (!customStart || !customEnd) return;
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const data = await get<ReportData>('/reports', params);
      setReport(data);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedRange, customStart, customEnd]);

  useEffect(() => {
    if (selectedRange !== 'custom' || (customStart && customEnd)) {
      fetchReport();
    }
  }, [fetchReport, selectedRange, customStart, customEnd]);

  const handleExportCsv = () => {
    const token = localStorage.getItem('accessToken');
    let url = `/api/reports/export/csv?range=${selectedRange}`;
    if (selectedRange === 'custom') {
      url += `&startDate=${customStart}&endDate=${customEnd}`;
    }
    // Fetch blob with auth token
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `financeflow-report-${selectedRange}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast('CSV export downloaded', 'success');
      })
      .catch(() => addToast('Failed to export CSV', 'error'));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-sm text-slate-500">
            Generate detailed statement summaries and export records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={!report}
            className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={!report}
            className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="card space-y-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRange(r.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                selectedRange === r.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {selectedRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="label text-xs">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="label text-xs">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input text-xs"
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={!customStart || !customEnd}
              className="btn-primary text-xs self-end mb-1"
            >
              Generate Custom Report
            </button>
          </div>
        )}
      </div>

      {/* Report Container */}
      {loading ? (
        <LoadingSpinner />
      ) : !report ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-400" />}
          title="No report generated"
          message="Select a date range above to view your financial report."
        />
      ) : (
        <div className="space-y-6">
          {/* Printable Header */}
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Financial Statement ({report.period.range})
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Period: {new Date(report.period.startDate).toLocaleDateString()} to{' '}
              {new Date(report.period.endDate).toLocaleDateString()}
            </p>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-l-4 border-l-blue-500">
              <span className="text-xs font-medium text-slate-500 uppercase">Total Income</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(report.summary.totalIncome)}
              </p>
            </div>
            <div className="card border-l-4 border-l-rose-500">
              <span className="text-xs font-medium text-slate-500 uppercase">Total Expenses</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(report.summary.totalExpenses)}
              </p>
            </div>
            <div className="card border-l-4 border-l-emerald-500">
              <span className="text-xs font-medium text-slate-500 uppercase">Net Savings</span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  report.summary.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(report.summary.netSavings)}
              </p>
            </div>
            <div className="card border-l-4 border-l-purple-500">
              <span className="text-xs font-medium text-slate-500 uppercase">Savings Rate</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {Math.round(report.summary.savingsRate)}%
              </p>
            </div>
          </div>

          {/* Breakdown Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Category Breakdown</h3>
              {report.categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No categories recorded</p>
              ) : (
                <div className="space-y-3">
                  {report.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {cat.name}{' '}
                          <span className="text-[10px] text-slate-400">({cat.type})</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(cat.amount)} ({Math.round(cat.percentage)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.type === 'INCOME' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">
                Payment Method Breakdown
              </h3>
              {report.paymentMethodBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No payment data available
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {report.paymentMethodBreakdown.map((pm, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {pm.method.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(pm.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions Statement Table */}
          <div className="card overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-sm">
                Transaction Ledger ({report.summary.transactionCount} entries)
              </h3>
            </div>
            {report.transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No transactions for this time period
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Description</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Method</th>
                      <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.transactions.map((tx) => {
                      const isIncome = tx.type === 'INCOME';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-500">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {tx.description}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">{tx.category}</td>
                          <td className="py-2.5 px-4 text-slate-500">
                            {tx.paymentMethod.replace('_', ' ')}
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-semibold whitespace-nowrap ${
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
      )}
    </div>
  );
}
