/**
 * Error types for API error handling
 */

export interface ApiError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  instance?: string;
}

export class AppError extends Error implements ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;

  constructor(
    message: string,
    status: number = 500,
    type?: string,
    title?: string,
    detail?: string,
    instance?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type || 'https://api.shop.am/problems/internal-error';
    this.title = title || 'Internal Server Error';
    this.status = status;
    this.detail = detail || message;
    this.instance = instance;
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error has ApiError shape
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'type' in error || 'title' in error)
  );
}

/**
 * Convert unknown error to ApiError format
 */
export function toApiError(error: unknown, instance?: string): ApiError {
  if (isAppError(error)) {
    return {
      type: error.type,
      title: error.title,
      status: error.status,
      detail: error.detail,
      instance: error.instance || instance,
    };
  }

  if (isApiError(error)) {
    return {
      ...error,
      instance: error.instance || instance,
    };
  }

  if (error instanceof Error) {
    return {
      type: 'https://api.shop.am/problems/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message || 'An error occurred',
      instance,
    };
  }

  return {
    type: 'https://api.shop.am/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unknown error occurred',
    instance,
  };
}

/**
 * Safe message extraction for catch (error: unknown) blocks.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Optional stack for logging when error is an Error.
 */
export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * For thrown objects like `{ status: 400, detail: "..." }` used across services.
 */
export function getThrownHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

/**
 * Narrow axios/fetch-style errors with optional `data` payload.
 */
export function getApiLikeData(error: unknown): {
  data?: { detail?: string; message?: string };
} {
  if (typeof error === "object" && error !== null && "data" in error) {
    return error as { data?: { detail?: string; message?: string } };
  }
  return {};
}

/**
 * Message for user-facing alerts from API client errors (ApiError, fetch, etc.).
 */
export function getClientErrorMessage(error: unknown): string {
  const api = getApiLikeData(error);
  if (api.data?.detail) {
    return api.data.detail;
  }
  if (api.data?.message) {
    return api.data.message;
  }
  return getErrorMessage(error);
}

export function getErrorLogFields(error: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (error instanceof Error) {
    out.message = error.message;
    out.stack = error.stack;
    out.name = error.name;
  }
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if ('status' in e) out.status = e.status;
    if ('type' in e) out.type = e.type;
    if ('title' in e) out.title = e.title;
    if ('detail' in e) out.detail = e.detail;
    if ('code' in e) out.code = e.code;
    if ('meta' in e) out.meta = e.meta;
  }
  return out;
}

