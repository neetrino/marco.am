'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const visibleDuration = toast.duration || 3000;
    const leaveDuration = 220;

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(toast.id), leaveDuration);
    }, visibleDuration);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [toast.id, toast.duration, onClose]);

  const bgColors = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-100',
    error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-100',
    info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/60 dark:text-sky-100',
  };

  const iconColors = {
    success: 'text-emerald-600 dark:text-emerald-300',
    error: 'text-rose-600 dark:text-rose-300',
    warning: 'text-amber-600 dark:text-amber-300',
    info: 'text-sky-600 dark:text-sky-300',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const handleClose = () => {
    if (isLeaving) {
      return;
    }
    setIsLeaving(true);
    setTimeout(() => onClose(toast.id), 220);
  };

  return (
    <div
      className={`
        ${bgColors[toast.type]}
        mb-3 flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-[0_14px_32px_rgba(16,16,16,0.16)]
        transition-all duration-300 ease-out
        ${
          isLeaving
            ? 'translate-y-1 opacity-0'
            : isVisible
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0'
        }
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 ${iconColors[toast.type]}`}>
        {icons[toast.type]}
      </div>
      <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${iconColors[toast.type]} hover:opacity-70 transition-opacity`}
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent<Omit<Toast, 'id'>>;
      if (!customEvent.detail) return;
      
      const newToast: Toast = {
        ...customEvent.detail,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('show-toast', handleShowToast);

    return () => {
      window.removeEventListener('show-toast', handleShowToast);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col items-stretch">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
}

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of toast (success, error, warning, info)
 * @param duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}

