/**
 * Deterministic JSON-like string for cache keys (sorted object keys).
 */
export function stableStringifyForCacheKey(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    return JSON.stringify(value);
  }
  if (t !== 'object') {
    return JSON.stringify(String(value));
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringifyForCacheKey(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringifyForCacheKey(obj[k])}`)
    .join(',')}}`;
}
