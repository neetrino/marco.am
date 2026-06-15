/**
 * Error types for API error handling
 */

import { getDeploymentTier } from "@/lib/config/deployment-env";

const GENERIC_SERVER_ERROR_DETAIL = "An error occurred";

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

function shouldSanitizeClientDetail(status: number | undefined): boolean {
  return getDeploymentTier() === "production" && (status ?? 500) >= 500;
}

/**
 * Convert unknown error to ApiError format
 */
export function toApiError(error: unknown, instance?: string): ApiError {
  if (isAppError(error)) {
    const status = error.status;
    return {
      type: error.type,
      title: error.title,
      status,
      detail: shouldSanitizeClientDetail(status)
        ? GENERIC_SERVER_ERROR_DETAIL
        : error.detail,
      instance: error.instance || instance,
    };
  }

  if (isApiError(error)) {
    const status = error.status ?? 500;
    return {
      ...error,
      detail: shouldSanitizeClientDetail(status)
        ? GENERIC_SERVER_ERROR_DETAIL
        : error.detail,
      instance: error.instance || instance,
    };
  }

  if (error instanceof Error) {
    const isProd = getDeploymentTier() === "production";
    return {
      type: 'https://api.shop.am/problems/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: isProd ? GENERIC_SERVER_ERROR_DETAIL : (error.message || GENERIC_SERVER_ERROR_DETAIL),
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
 * Safe message extraction for catch blocks (unknown errors).
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string') {
      return m;
    }
  }
  return 'Unknown error';
}

/**
 * Prisma-style error code when present (e.g. P2002).
 */
export function getPrismaErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const c = (error as { code: unknown }).code;
    return typeof c === 'string' ? c : undefined;
  }
  return undefined;
}

/**
 * Safe fields for structured error logging (avoid leaking full stack in prod).
 */
export function getErrorLogFields(error: unknown): Record<string, unknown> {
  const prismaCode = getPrismaErrorCode(error);
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      ...(prismaCode !== undefined ? { prismaCode } : {}),
    };
  }
  return { error: String(error) };
}

