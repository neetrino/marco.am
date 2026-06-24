/** Shared discount expiry helpers for admin settings and product discounts. */

/** Discount kind, mirrors the Prisma `DiscountType` enum. */
export type DiscountKind = 'NONE' | 'PERCENT' | 'AMOUNT';

/** Resolved discount ready for price computation. */
export type AppliedDiscount = { type: DiscountKind; value: number };

export const NO_DISCOUNT: AppliedDiscount = { type: 'NONE', value: 0 };

/** Raw product/variant discount as stored (supports PERCENT or AMOUNT). */
export type TypedDiscountInput = {
  type: DiscountKind | null | undefined;
  value: number | null | undefined;
  expiresAt: string | Date | null | undefined;
};

export type DiscountEntry = {
  percent: number;
  expiresAt: string | null;
};

export type DiscountMap = Record<string, DiscountEntry>;

export function parseIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function isDiscountExpired(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) {
    return false;
  }
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }
  return expiry.getTime() <= now.getTime();
}

export function activeDiscountPercent(
  percent: number,
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): number {
  if (percent <= 0 || isDiscountExpired(expiresAt, now)) {
    return 0;
  }
  return percent;
}

export function activeDiscountEntry(
  entry: DiscountEntry | undefined,
  now: Date = new Date(),
): number {
  if (!entry) {
    return 0;
  }
  return activeDiscountPercent(entry.percent, entry.expiresAt, now);
}

function parseDiscountEntry(raw: unknown): DiscountEntry | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return { percent: raw, expiresAt: null };
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as { percent?: unknown; expiresAt?: unknown };
  const percent = Number(record.percent);
  if (!Number.isFinite(percent) || percent <= 0) {
    return null;
  }

  return {
    percent,
    expiresAt: parseIsoDate(record.expiresAt),
  };
}

/** Parses legacy `{ id: number }` and new `{ id: { percent, expiresAt } }` maps. */
export function parseDiscountMap(raw: unknown): DiscountMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const out: DiscountMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const entry = parseDiscountEntry(value);
    if (entry) {
      out[key] = entry;
    }
  }
  return out;
}

export function serializeDiscountMap(map: DiscountMap): Record<string, DiscountEntry> {
  const out: Record<string, DiscountEntry> = {};
  for (const [key, entry] of Object.entries(map)) {
    if (entry.percent > 0) {
      out[key] = {
        percent: entry.percent,
        expiresAt: entry.expiresAt,
      };
    }
  }
  return out;
}

export function toActiveDiscountMap(map: DiscountMap, now: Date = new Date()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, entry] of Object.entries(map)) {
    const percent = activeDiscountEntry(entry, now);
    if (percent > 0) {
      out[key] = percent;
    }
  }
  return out;
}

/** Returns the active typed discount, or NONE when empty, non-positive, or expired. */
export function activeTypedDiscount(
  input: TypedDiscountInput | null | undefined,
  now: Date = new Date(),
): AppliedDiscount {
  if (!input || !input.type || input.type === 'NONE') {
    return NO_DISCOUNT;
  }
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    return NO_DISCOUNT;
  }
  if (isDiscountExpired(input.expiresAt, now)) {
    return NO_DISCOUNT;
  }
  return { type: input.type, value };
}

/**
 * Precedence chain: variant → product → category → brand → global.
 * Category/brand/global support percent only (already expiry-resolved by the caller).
 */
export type EffectiveDiscountChain = {
  variant?: TypedDiscountInput | null;
  product?: TypedDiscountInput | null;
  categoryPercent?: number;
  brandPercent?: number;
  globalPercent?: number;
};

export function resolveEffectiveDiscount(
  chain: EffectiveDiscountChain,
  now: Date = new Date(),
): AppliedDiscount {
  const variant = activeTypedDiscount(chain.variant, now);
  if (variant.type !== 'NONE') {
    return variant;
  }
  const product = activeTypedDiscount(chain.product, now);
  if (product.type !== 'NONE') {
    return product;
  }
  const settingsPercent =
    (chain.categoryPercent ?? 0) > 0
      ? chain.categoryPercent
      : (chain.brandPercent ?? 0) > 0
        ? chain.brandPercent
        : (chain.globalPercent ?? 0) > 0
          ? chain.globalPercent
          : 0;
  if (settingsPercent && settingsPercent > 0) {
    return { type: 'PERCENT', value: settingsPercent };
  }
  return NO_DISCOUNT;
}

export function formatDiscountExpiresAt(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Short date label for compact discount toolbars (day + month + year, no time). */
export function formatDiscountExpiresAtCompact(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
