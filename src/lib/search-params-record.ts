export function searchParamsRecordToUrlSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) {
      continue;
    }
    const s = Array.isArray(value) ? value[0] : value;
    if (s !== undefined && s !== '') {
      q.set(key, s);
    }
  }
  return q;
}
