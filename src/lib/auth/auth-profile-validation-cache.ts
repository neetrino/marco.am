import { AUTH_USER_KEY, readStoredAuthUser } from './read-stored-auth-user';

/** Session-scoped throttle for `/api/v1/users/profile` validation on client navigations. */
const AUTH_PROFILE_VALIDATED_AT_KEY = 'marco-auth-profile-validated-at';

const AUTH_PROFILE_VALIDATE_TTL_MS = 5 * 60 * 1000;

function readAuthProfileValidatedAt(): number | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(AUTH_PROFILE_VALIDATED_AT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function markAuthProfileValidated(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(AUTH_PROFILE_VALIDATED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearAuthProfileValidatedAt(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(AUTH_PROFILE_VALIDATED_AT_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldSkipAuthProfileValidation(): boolean {
  const validatedAt = readAuthProfileValidatedAt();
  if (validatedAt === null) {
    return false;
  }
  return Date.now() - validatedAt < AUTH_PROFILE_VALIDATE_TTL_MS;
}

export { AUTH_USER_KEY, readStoredAuthUser };
