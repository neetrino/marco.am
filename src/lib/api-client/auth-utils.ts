import { logger } from "@/lib/utils/logger";

const AUTH_USER_KEY = 'auth_user';

/**
 * Client cannot read the HttpOnly auth cookie. This only reports whether
 * the browser has a persisted user snapshot for UI state.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_USER_KEY) ? 'cookie-session' : null;
  } catch {
    return null;
  }
}

/**
 * Handle 401 Unauthorized errors - clear auth and redirect
 */
export function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  
  logger.warn('[API CLIENT] Unauthorized (401) - clearing auth data');
  localStorage.removeItem('auth_user');
  
  // Trigger auth update event to notify AuthContext
  window.dispatchEvent(new Event('auth-updated'));
  
  // Redirect to login if not already there
  if (!window.location.pathname.includes('/login')) {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
  }
}




