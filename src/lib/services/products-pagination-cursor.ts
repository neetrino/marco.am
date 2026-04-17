const PRODUCT_CURSOR_PREFIX = "offset:";

export function encodeProductCursor(offset: number): string {
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  return Buffer.from(`${PRODUCT_CURSOR_PREFIX}${safeOffset}`, "utf8").toString("base64url");
}

export function decodeProductCursor(cursor: string | undefined): number {
  if (!cursor) {
    return 0;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    if (!decoded.startsWith(PRODUCT_CURSOR_PREFIX)) {
      return 0;
    }

    const rawOffset = decoded.slice(PRODUCT_CURSOR_PREFIX.length);
    const parsed = Number(rawOffset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  } catch {
    return 0;
  }
}

