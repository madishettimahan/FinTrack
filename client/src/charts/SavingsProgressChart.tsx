import React from 'react';
import { GoalProgress } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  data: GoalProgress[];
}

export const SavingsProgressChart: React.FC<Props> = ({ data }) => {
  const { formatCurrency } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        No savings goals created yet
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
      {data.map((goal) => {
        const pct = Math.round(goal.percentage);
        const isComplete = pct >= 100;

        return (
          <div key={goal.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{goal.name}</span>
              <span className={isComplete ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
