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

/** Pad a mobile rail page to `size` cells (null = empty slot). */
export function padChunkToSize<T>(chunk: readonly T[], size: number): (T | null)[] {
  const slots: (T | null)[] = [...chunk];
  while (slots.length < size) {
    slots.push(null);
  }
  return slots.slice(0, size);
}

/**
 * Ensure at least `minCount` horizontal pages (empty pages = `[]`) for mobile reel pagination.
 * Does not truncate when there are more pages than `minCount`.
 */
export function padChunksToMinimumCount<T>(chunks: T[][], minCount: number): T[][] {
  const padded: T[][] = [...chunks];
  while (padded.length < minCount) {
    padded.push([] as T[]);
  }
  return padded;
}
