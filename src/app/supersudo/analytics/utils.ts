import { MULTIPLE_SKUS_LABEL } from "@/lib/constants/product-analytics";

/** Used when `Intl` rejects the stored currency code (bad DB data). */
const CURRENCY_FORMAT_FALLBACK = "USD";

/**
 * Localized SKU label for product-level analytics (multi-variant sales).
 */
export function formatAnalyticsSku(
  sku: string,
  t: (key: string) => string
): string {
  return sku === MULTIPLE_SKUS_LABEL ? t("admin.analytics.multipleSkus") : sku;
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = CURRENCY_FORMAT_FALLBACK
): string {
  const code =
    typeof currency === "string" && currency.trim().length > 0
      ? currency.trim()
      : CURRENCY_FORMAT_FALLBACK;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: CURRENCY_FORMAT_FALLBACK,
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

/**
 * Format date to full format (year, month, day)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('hy-AM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date to short format (month, day)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('hy-AM', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}




