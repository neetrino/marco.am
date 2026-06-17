'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  ADMIN_SIDE_SHEET_OVERLAY_CLASS,
  ADMIN_SIDE_SHEET_PANEL_CLASS,
} from './admin-side-sheet.constants';

interface AdminSideSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Reusable admin side sheet — slides from the right at 90% viewport width.
 * Use for product editor, order details, and similar admin overlays.
 */
export function AdminSideSheet({
  open,
  onClose,
  title,
  closeLabel,
  headerExtra,
  children,
}: AdminSideSheetProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleClose, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        className={ADMIN_SIDE_SHEET_OVERLAY_CLASS}
        onClick={handleClose}
        aria-label={closeLabel}
      />
      <aside
        className={`${ADMIN_SIDE_SHEET_PANEL_CLASS} animate-in slide-in-from-right duration-200 motion-reduce:animate-none`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex shrink-0 flex-col gap-3 border-b border-marco-border/80 px-5 py-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-4">
            <h2 className="min-w-0 text-lg font-bold text-marco-black dark:text-white">{title}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-marco-border bg-white text-marco-black transition-colors hover:bg-marco-gray dark:border-white/15 dark:bg-zinc-900 dark:text-white"
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {headerExtra ? <div className="min-w-0">{headerExtra}</div> : null}
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </aside>
    </>,
    document.body,
  );
}
