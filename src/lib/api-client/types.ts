/**
 * Request options interface
 */
export interface RequestOptions extends globalThis.RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean; // Skip automatic token injection
  timeoutMs?: number;
  suppressNetworkErrorLogging?: boolean;
  suppressAbortErrorLogging?: boolean;
  suppressHttpErrorLogging?: boolean;
}

/**
 * Custom API Error class with proper typing
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(message: string, status: number, statusText: string = '', data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * HTTP-like status from thrown client/network errors.
 */
export function getErrorHttpStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) {
    return error.status;
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

function detailFromData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const o = data as Record<string, unknown>;
  if (typeof o.detail === 'string') {
    return o.detail;
  }
  if (typeof o.message === 'string') {
    return o.message;
  }
  return undefined;
}

/**
 * Prefer ApiError.data.detail / .message, then Error.message.
 */
export function getClientErrorDetail(error: unknown): string | undefined {
  if (error instanceof ApiError) {
    return detailFromData(error.data) ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

/**
 * Message for UI toasts: ApiError body/detail, then Error.message, else fallback.
 */
export function getApiOrErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return getClientErrorDetail(error) ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}




