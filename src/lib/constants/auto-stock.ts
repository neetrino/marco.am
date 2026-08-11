/**
 * Managed catalog stock: variants are created at a fixed level and
 * auto-replenished when stock falls to the threshold (inclusive).
 */
export const AUTO_STOCK_LEVEL = 1000;

/** When stock is at or below this value after a sale, reset to AUTO_STOCK_LEVEL. */
export const AUTO_STOCK_REPLENISH_THRESHOLD = 50;

export function shouldAutoReplenishStock(stock: number): boolean {
  return stock <= AUTO_STOCK_REPLENISH_THRESHOLD;
}
