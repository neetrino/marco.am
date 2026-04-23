/**
 * API Client
 *
 * Client for making requests to the backend API.
 *
 * Important:
 * Most calls in this app target the same Next.js instance via `/api/...`.
 * In the browser those requests should stay relative, otherwise a stale
 * `NEXT_PUBLIC_API_URL` (for example a LAN IP from a previous device/session)
 * can break the app even though the current origin is healthy.
 */

import { ApiError, getApiOrErrorMessage, getClientErrorDetail, getErrorHttpStatus } from "./api-client/types";
import type { RequestOptions } from "./api-client/types";
import { getRequest, postRequest, putRequest, patchRequest, deleteRequest } from "./api-client/http-methods";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private configuredBaseUrl: string;

  constructor(baseUrl: string) {
    this.configuredBaseUrl = baseUrl;
  }

  private resolveBaseUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.trim();
    const isInternalApiRoute =
      normalizedEndpoint.startsWith('/api/') || normalizedEndpoint.startsWith('api/');

    // In the browser, internal Next.js API calls should use same-origin relative paths.
    // This prevents hardcoded/stale LAN URLs from hijacking requests.
    if (typeof window !== 'undefined' && isInternalApiRoute) {
      return '';
    }

    return this.configuredBaseUrl;
  }

  async get<T>(endpoint: string, options?: RequestOptions, retryCount = 0): Promise<T> {
    return getRequest<T>(this.resolveBaseUrl(endpoint), endpoint, options, retryCount);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return postRequest<T>(this.resolveBaseUrl(endpoint), endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return putRequest<T>(this.resolveBaseUrl(endpoint), endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return patchRequest<T>(this.resolveBaseUrl(endpoint), endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return deleteRequest<T>(this.resolveBaseUrl(endpoint), endpoint, options);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError, getApiOrErrorMessage, getClientErrorDetail, getErrorHttpStatus };
