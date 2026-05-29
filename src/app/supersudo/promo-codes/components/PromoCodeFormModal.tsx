'use client';

import { Button } from '@shop/ui';
import type { PromoCodeFormState } from '../types';
import {
  fromDatetimeLocalValue,
  parseOptionalPositiveNumber,
  toDatetimeLocalValue,
} from '../promo-code-form.utils';

type PromoCodeFormModalProps = {
  open: boolean;
  form: PromoCodeFormState;
  saving: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onChange: (next: PromoCodeFormState) => void;
  onSave: () => void;
};

const inputClass =
  'w-full rounded-xl border border-marco-border bg-white px-3 py-2 text-sm text-[var(--app-text)] focus:border-marco-primary focus:outline-none focus:ring-2 focus:ring-marco-primary/20 dark:border-white/10 dark:bg-white/5';

export function PromoCodeFormModal({
  open,
  form,
  saving,
  t,
  onClose,
  onChange,
  onSave,
}: PromoCodeFormModalProps) {
  if (!open) {
    return null;
  }

  const setField = <K extends keyof PromoCodeFormState>(key: K, value: PromoCodeFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-code-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-marco-border bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[var(--app-surface)]"
      >
        <h2 id="promo-code-modal-title" className="text-xl font-semibold text-[var(--app-text)]">
          {form.code ? t('admin.promoCodes.editTitle') : t('admin.promoCodes.createTitle')}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.code')}
            </span>
            <input
              type="text"
              value={form.code}
              onChange={(event) => setField('code', event.target.value.toUpperCase())}
              placeholder={t('admin.promoCodes.codePlaceholder')}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.discountType')}
            </span>
            <select
              value={form.discountType}
              onChange={(event) =>
                setField('discountType', event.target.value as PromoCodeFormState['discountType'])
              }
              className={inputClass}
            >
              <option value="percentage">{t('admin.promoCodes.typePercentage')}</option>
              <option value="fixed">{t('admin.promoCodes.typeFixed')}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.discountValue')}
            </span>
            <input
              type="number"
              min={0}
              step={form.discountType === 'percentage' ? 1 : 100}
              value={form.discountValue}
              onChange={(event) => setField('discountValue', Number(event.target.value))}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.maxDiscount')}
            </span>
            <input
              type="number"
              min={0}
              value={form.maxDiscountAmount ?? ''}
              onChange={(event) =>
                setField('maxDiscountAmount', parseOptionalPositiveNumber(event.target.value))
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.minSubtotal')}
            </span>
            <input
              type="number"
              min={0}
              value={form.minSubtotal ?? ''}
              onChange={(event) => setField('minSubtotal', parseOptionalPositiveNumber(event.target.value))}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.startsAt')}
            </span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(form.startsAt)}
              onChange={(event) => setField('startsAt', fromDatetimeLocalValue(event.target.value))}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              {t('admin.promoCodes.endsAt')}
            </span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(form.endsAt)}
              onChange={(event) => setField('endsAt', fromDatetimeLocalValue(event.target.value))}
              className={inputClass}
            />
          </label>

        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('admin.promoCodes.cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={onSave} disabled={saving}>
            {saving ? t('admin.promoCodes.saving') : t('admin.promoCodes.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
