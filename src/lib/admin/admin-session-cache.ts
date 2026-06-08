const ADMIN_SESSION_CACHE_PREFIX = 'marco-admin:';

type StoredEntry<T> = {
  storedAt: number;
  payload: T;
};

/** Reads a TTL-scoped payload from sessionStorage (sync — instant paint on navigation). */
export function readAdminSessionCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(`${ADMIN_SESSION_CACHE_PREFIX}${key}`);
    if (!raw) {
      return null;
    }
    const entry = JSON.parse(raw) as StoredEntry<T>;
    if (Date.now() - entry.storedAt > ttlMs) {
      sessionStorage.removeItem(`${ADMIN_SESSION_CACHE_PREFIX}${key}`);
      return null;
    }
    return entry.payload;
  } catch {
    return null;
  }
}

/** Persists payload for the current browser tab session. */
export function writeAdminSessionCache<T>(key: string, payload: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const entry: StoredEntry<T> = { storedAt: Date.now(), payload };
    sessionStorage.setItem(`${ADMIN_SESSION_CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded — ignore; in-memory consumers still work for this navigation.
  }
}

export const ADMIN_SESSION_CACHE_TTL_MS = 120_000;
