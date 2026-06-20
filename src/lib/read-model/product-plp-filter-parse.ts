/** Split a comma-separated query value into trimmed, optionally transformed tokens. */
export function firstCsvTokens(
  raw: string | undefined,
  transform?: (token: string) => string,
): string[] {
  return (
    raw
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  ).map((token) => (transform ? transform(token) : token));
}

export function parsePositiveInt(raw: string | undefined, fallback: number, max: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export function parseOptionalPrice(raw: string | undefined): number | undefined {
  const parsed = raw ? Number(raw) : undefined;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
