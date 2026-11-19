'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);

      const timer = setTimeout(() => {
        removeToast(id);
      }, 5000);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message: string) => addToast('success', message),
      error: (message: string) => addToast('error', message),
      info: (message: string) => addToast('info', message),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((item) => {
            const styles =
              item.variant === 'error'
                ? 'bg-white border-rose-200 text-rose-800'
                : item.variant === 'success'
                  ? 'bg-white border-emerald-200 text-emerald-800'
                  : 'bg-white border-neutral-200 text-neutral-800';

            return (
              <div
                key={item.id}
                role="alert"
                className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg text-xs leading-relaxed ${styles}`}
              >
                {item.variant === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                {item.variant === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {item.variant === 'info' && (
                  <Info className="w-4 h-4 text-ug-navy shrink-0 mt-0.5" />
                )}
                <p className="flex-1 font-medium">{item.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  aria-label="Dismiss notification"
                  className="p-0.5 rounded-md text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return ctx;
}

