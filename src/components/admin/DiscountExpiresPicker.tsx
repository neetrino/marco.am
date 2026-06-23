'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { formatDiscountExpiresAt } from '@/lib/discount/discount-expiry';
import {
  clampHour,
  clampMinute,
  daysInMonth,
  defaultFutureParts,
  formatPartsLabel,
  monthLabel,
  parseIsoToParts,
  partsToIso,
  weekdayIndex,
  weekdayLabelsForLocale,
  type DateParts,
} from './discount-expires-picker.utils';

type DiscountExpiresPickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
};

function shiftMonth(parts: DateParts, delta: number): DateParts {
  const date = new Date(parts.year, parts.month + delta, 1);
  return {
    ...parts,
    year: date.getFullYear(),
    month: date.getMonth(),
    day: Math.min(parts.day, daysInMonth(date.getFullYear(), date.getMonth())),
  };
}

export function DiscountExpiresPicker({
  value,
  onChange,
  disabled = false,
  className = '',
}: DiscountExpiresPickerProps) {
  const { t, lang } = useTranslation();
  const locale = lang ?? 'en';
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateParts>(() => parseIsoToParts(value) ?? defaultFutureParts());

  useEffect(() => {
    if (open) {
      setDraft(parseIsoToParts(value) ?? defaultFutureParts());
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const weekdayLabels = useMemo(() => weekdayLabelsForLocale(locale), [locale]);
  const monthDays = daysInMonth(draft.year, draft.month);
  const leadingBlanks = weekdayIndex(draft.year, draft.month, 1);
  const dayCells = Array.from({ length: leadingBlanks + monthDays }, (_, index) => {
    if (index < leadingBlanks) {
      return null;
    }
    return index - leadingBlanks + 1;
  });

  const triggerLabel = value
    ? formatDiscountExpiresAt(value, locale)
    : t('admin.discountExpires.selectDate');

  const applyDraft = () => {
    onChange(partsToIso(draft));
    setOpen(false);
  };

  const clearValue = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 min-w-[9.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="truncate">{triggerLabel}</span>
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={t('admin.discountExpires.dialogLabel')}
          className="absolute right-0 z-50 mt-2 w-[18.5rem] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={t('admin.discountExpires.prevMonth')}
              onClick={() => setDraft((prev) => shiftMonth(prev, -1))}
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-slate-900">
              {monthLabel(draft.month, locale)} {draft.year}
            </p>
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={t('admin.discountExpires.nextMonth')}
              onClick={() => setDraft((prev) => shiftMonth(prev, 1))}
            >
              ›
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekdayLabels.map((label) => (
              <span key={label} className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </span>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-7 gap-1">
            {dayCells.map((day, index) =>
              day === null ? (
                <span key={`blank-${index}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, day }))}
                  className={`h-8 rounded-lg text-sm font-medium transition ${
                    draft.day === day
                      ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('admin.discountExpires.time')}
            </p>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs text-slate-500">
                {t('admin.discountExpires.hour')}
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={draft.hour}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, hour: clampHour(Number(event.target.value)) }))
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </label>
              <span className="mt-5 text-lg font-semibold text-slate-400">:</span>
              <label className="flex flex-1 flex-col gap-1 text-xs text-slate-500">
                {t('admin.discountExpires.minute')}
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={draft.minute}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, minute: clampMinute(Number(event.target.value)) }))
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">{formatPartsLabel(draft, locale)}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clearValue}>
              {t('admin.discountExpires.clear')}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={applyDraft}>
              {t('admin.discountExpires.apply')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
