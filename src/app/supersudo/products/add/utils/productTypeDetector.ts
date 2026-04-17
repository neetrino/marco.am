/**
 * Utilities for detecting product type (simple vs variable)
 */

/**
 * Checks if variants have attributes
 */
export function hasVariantsWithAttributes(variants: unknown[]): boolean {
  if (!variants || variants.length === 0) {
    return false;
  }

  return variants.some((variant) => {
    const rec = variant as Record<string, unknown>;
    if (rec.attributes && typeof rec.attributes === 'object' && rec.attributes !== null && Object.keys(rec.attributes).length > 0) {
      return true;
    }
    if (Array.isArray(rec.options) && rec.options.length > 0) {
      return true;
    }
    return false;
  });
}

