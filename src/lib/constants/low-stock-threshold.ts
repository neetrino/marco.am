/**
 * Default "low stock" upper bound (exclusive): variants with `stock` in `1..threshold-1`
 * are listed as low stock. Matches dashboard KPI `stock < threshold` for published variants.
 */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
