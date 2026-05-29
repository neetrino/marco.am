import type { PromoCodeFormState } from './types';

export function createEmptyPromoCodeForm(): PromoCodeFormState {
  return {
    id: crypto.randomUUID(),
    code: '',
    title: null,
    description: null,
    isActive: true,
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: null,
    minSubtotal: null,
    usageLimitTotal: null,
    usageLimitPerUser: null,
    startsAt: null,
    endsAt: null,
    scope: 'all',
  };
}

export function normalizePromoCodeInput(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '_');
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function parseOptionalPositiveNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function parseOptionalPositiveInt(raw: string): number | null {
  const parsed = parseOptionalPositiveNumber(raw);
  if (parsed == null) {
    return null;
  }
  const intValue = Math.trunc(parsed);
  return intValue > 0 ? intValue : null;
}
