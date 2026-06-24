'use client';

import { useEffect } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';

interface ProductDeleteConfirmDialogProps {
  open: boolean;
  productTitle: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProductDeleteConfirmDialog({
  open,
  productTitle,
  deleting,
  onConfirm,
  onCancel,
}: ProductDeleteConfirmDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, deleting, onCancel]);

  if (!open) {
    return null;
  }

  const message = t('admin.products.deleteConfirm').replace('{title}', productTitle);

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="product-delete-confirm-title"
      aria-describedby="product-delete-confirm-message"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_24px_56px_rgba(16,16,16,0.3)]">
        <h2
          id="product-delete-confirm-title"
          className="text-base font-semibold text-[var(--app-text)]"
        >
          {t('admin.products.delete')}
        </h2>
        <p
          id="product-delete-confirm-message"
          className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]"
        >
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="inline-flex h-10 items-center rounded-xl border border-[var(--app-border-strong)] px-4 text-sm font-medium text-[var(--app-text-muted)] transition hover:bg-[var(--app-bg-muted)] disabled:opacity-60"
          >
            {t('admin.common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? t('admin.products.deleting') : t('admin.common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
