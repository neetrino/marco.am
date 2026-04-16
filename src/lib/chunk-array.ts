/**
 * Split `items` into chunks of at most `size` elements.
 */
export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) {
    return [];
  }
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size) as T[]);
  }
  return out;
}
