'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  ADMIN_SIDE_SHEET_CLOSE_OUTSIDE_CLASS,
  ADMIN_SIDE_SHEET_OVERLAY_CLASS,
  ADMIN_SIDE_SHEET_PANEL_CLASS,
} from './admin-side-sheet.constants';

interface AdminSideSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name — not shown visually when header is custom. */
  ariaLabel: string;
  closeLabel: string;
  header: ReactNode;
  children: ReactNode;
}

/**
 * Reusable admin side sheet — slides from the right at 90% viewport width.
 * Close button sits outside the panel on the overlay (left edge of the sheet).
 */
export function AdminSideSheet({
  open,
  onClose,
  ariaLabel,
  closeLabel,
  header,
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
      <button
        type="button"
        onClick={handleClose}
        className={ADMIN_SIDE_SHEET_CLOSE_OUTSIDE_CLASS}
        aria-label={closeLabel}
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <aside
        className={`${ADMIN_SIDE_SHEET_PANEL_CLASS} animate-in slide-in-from-right duration-200 motion-reduce:animate-none`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <header className="shrink-0 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          {header}
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </aside>
    </>,
    document.body,
  );
}
