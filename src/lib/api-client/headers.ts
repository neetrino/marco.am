import type { RequestOptions } from "./types";

/**
 * Get JSON request headers. Auth is carried by the HttpOnly session cookie.
 */
export function getHeaders(options?: RequestOptions): globalThis.HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  return headers as globalThis.HeadersInit;
}




