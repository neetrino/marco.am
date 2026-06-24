import { randomUUID } from "crypto";

/** Header used to correlate a request across proxy, handlers, and logs. */
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Returns the incoming request id header if present, otherwise generates a new
 * UUID. Used to propagate `x-request-id` from the proxy into downstream
 * handlers and responses for observability.
 */
export function getOrCreateRequestId(headers: Headers): string {
  const existing = headers.get(REQUEST_ID_HEADER);
  return existing && existing.trim() !== "" ? existing : randomUUID();
}
