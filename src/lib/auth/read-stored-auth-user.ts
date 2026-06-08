type StoredAuthUser = {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
};

const AUTH_USER_KEY = 'auth_user';

/** Synchronous read of the persisted auth snapshot (client only). */
export function readStoredAuthUser(): StoredAuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export { AUTH_USER_KEY };
