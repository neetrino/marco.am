'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { formatDiscountExpiresAt, formatDiscountExpiresAtCompact } from '@/lib/discount/discount-expiry';
import {
  clampHour,
  clampMinute,
  computeDiscountExpiresPopoverCoords,
  daysInMonth,
  defaultFutureParts,
  DISCOUNT_EXPIRES_POPOVER_Z_INDEX,
  formatPartsLabel,
  monthLabel,
  parseIsoToParts,
  partsToIso,
  type PopoverCoords,
  weekdayIndex,
  weekdayLabelsForLocale,
  type DateParts,
} from './discount-expires-picker.utils';

type DiscountExpiresPickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  /** Icon-only trigger for compact toolbars (product variant editor). */
  compact?: boolean;
  className?: string;
};

function shiftMonthParts(parts: DateParts, delta: number): DateParts {
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
  compact = false,
  className = '',
}: DiscountExpiresPickerProps) {
  const { t, lang } = useTranslation();
  const locale = lang ?? 'en';
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords>({ top: 0, left: 0 });
  const [draft, setDraft] = useState<DateParts>(() => parseIsoToParts(value) ?? defaultFutureParts());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(parseIsoToParts(value) ?? defaultFutureParts());
    }
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updateCoords = () => {
      if (!triggerRef.current) {
        return;
      }
      setCoords(computeDiscountExpiresPopoverCoords(triggerRef.current.getBoundingClientRect()));
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
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

  const compactDateLabel = value ? formatDiscountExpiresAtCompact(value, locale) : '';

  const applyDraft = () => {
    onChange(partsToIso(draft));
    setOpen(false);
  };

  const clearValue = () => {
    onChange(null);
    setOpen(false);
  };

  const popover = open && mounted ? (
    <div
      ref={popoverRef}
      id={popoverId}
      role="dialog"
      aria-label={t('admin.discountExpires.dialogLabel')}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        zIndex: DISCOUNT_EXPIRES_POPOVER_Z_INDEX,
      }}
      className="w-[18.5rem] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={t('admin.discountExpires.prevMonth')}
          onClick={() => setDraft((prev) => shiftMonthParts(prev, -1))}
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
          onClick={() => setDraft((prev) => shiftMonthParts(prev, 1))}
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
  ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        title={triggerLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={
          compact
            ? `relative inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60${
                value
                  ? ' gap-1.5 px-2'
                  : ' w-9'
              }${value ? ' border-amber-400 bg-amber-100' : ''}`
            : 'inline-flex h-9 min-w-[9.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50/40 disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        <svg className={`h-4 w-4 shrink-0 ${compact ? 'text-amber-600' : 'text-rose-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {compact ? (
          value ? (
            <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-amber-950">
              {compactDateLabel}
            </span>
          ) : (
            <span className="sr-only">{triggerLabel}</span>
          )
        ) : (
          <span className="truncate">{triggerLabel}</span>
        )}
      </button>

      {popover ? createPortal(popover, document.body) : null}
    </div>
  );
}
