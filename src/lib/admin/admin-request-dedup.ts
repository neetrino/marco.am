const inFlight = new Map<string, Promise<unknown>>();

/** Coalesces identical in-flight admin API requests (warm + page mount). */
export function dedupedAdminRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
