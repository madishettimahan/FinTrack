import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className={`relative bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto z-10`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
