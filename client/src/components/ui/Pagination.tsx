import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { currentPage: number; totalPages: number; onPageChange: (page: number) => void }

export const Pagination = ({ currentPage, totalPages, onPageChange }: Props) => {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-1 mt-4" aria-label="Pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Previous page">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {start > 1 && <><button onClick={() => onPageChange(1)} className="w-9 h-9 rounded-lg text-sm hover:bg-slate-100">1</button>{start > 2 && <span className="text-slate-400">…</span>}</>}
      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)} className={`w-9 h-9 rounded-lg text-sm font-medium ${p === currentPage ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>{p}</button>
      ))}
      {end < totalPages && <>{end < totalPages - 1 && <span className="text-slate-400">…</span>}<button onClick={() => onPageChange(totalPages)} className="w-9 h-9 rounded-lg text-sm hover:bg-slate-100">{totalPages}</button></>}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next page">
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
