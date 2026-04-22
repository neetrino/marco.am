/** In-app Reels route — deep links use `?i=<index>`. */
export const REELS_PAGE_PATH = '/reels/watch';

export const REELS_INDEX_QUERY = 'i';

export function getReelsItemHref(index: number): string {
  return `${REELS_PAGE_PATH}?${REELS_INDEX_QUERY}=${index}`;
}

function clampReelsIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  if (!Number.isFinite(index) || index < 0) {
    return 0;
  }
  if (index >= length) {
    return length - 1;
  }
  return Math.trunc(index);
}

/**
 * Parses `i` from `/reels?i=N` for initial slide; clamps to `[0, length)`.
 */
export function parseReelsIndexParam(
  raw: string | undefined,
  length: number,
): number {
  if (raw === undefined || raw === '') {
    return 0;
  }
  const n = Number.parseInt(raw, 10);
  return clampReelsIndex(n, length);
}
