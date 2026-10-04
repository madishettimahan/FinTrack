import React from 'react';
import { Loader2 } from 'lucide-react';
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return <div className="flex items-center justify-center p-8"><Loader2 className={`${s} text-emerald-600 animate-spin`} /></div>;
};

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);
export const SkeletonCard = () => <div className="card space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-32" /><Skeleton className="h-3 w-20" /></div>;
export const SkeletonRow = () => <div className="flex gap-4 p-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>;
