import { MULTIPLE_SKUS_LABEL } from "@/lib/constants/product-analytics";

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
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
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




