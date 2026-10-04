import React from 'react';
import { BudgetUtil } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  data: BudgetUtil[];
}

export const BudgetUtilizationChart: React.FC<Props> = ({ data }) => {
  const { formatCurrency } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        No active budgets set for this month
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
      {data.map((item) => {
        const pct = Math.round(item.percentage);
        const isExceeded = pct > 100;
        const isWarning = pct >= 80 && pct <= 100;

        const colorClass = isExceeded
          ? 'bg-rose-500'
          : isWarning
          ? 'bg-amber-500'
          : 'bg-emerald-500';

        const textColorClass = isExceeded
          ? 'text-rose-600 font-semibold'
          : isWarning
          ? 'text-amber-600 font-medium'
          : 'text-slate-600';

        return (
          <div key={item.id || item.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.category}</span>
              <span className={textColorClass}>
                {formatCurrency(item.spent)} / {formatCurrency(item.budget)} ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {isExceeded && (
              <p className="text-[11px] text-rose-500">
                Over budget by {formatCurrency(item.spent - item.budget)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
