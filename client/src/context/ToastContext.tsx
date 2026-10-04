import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: number; message: string; type: ToastType }
interface ToastContextType { addToast: (message: string, type?: ToastType) => void }
const ToastContext = createContext<ToastContextType>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

let toastId = 0;
const ICONS = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
const COLORS = { success: 'bg-emerald-50 border-emerald-500 text-emerald-800', error: 'bg-red-50 border-red-500 text-red-800', warning: 'bg-amber-50 border-amber-500 text-amber-800', info: 'bg-blue-50 border-blue-500 text-blue-800' };

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="log" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg animate-slide-in ${COLORS[t.type]}`}>
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => removeToast(t.id)} className="shrink-0 hover:opacity-70" aria-label="Dismiss"><X className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
      <style>{`.animate-slide-in { animation: slideIn 0.3s ease-out; } @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  );
};
