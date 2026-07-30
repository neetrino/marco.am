/**
 * Deployment tier and public URL resolution for dev / staging / prod.
 * Use this instead of ad-hoc `process.env` chains in API and middleware.
 */

type DeploymentTier = "development" | "staging" | "production";

const APP_ENV_ALIASES: Record<string, DeploymentTier> = {
  development: "development",
  dev: "development",
  staging: "staging",
  stage: "staging",
  production: "production",
  prod: "production",
};

function parseAppEnv(raw: string | undefined): DeploymentTier | undefined {
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }
  const key = raw.trim().toLowerCase();
  return APP_ENV_ALIASES[key];
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const LOCAL_DEV_APP_URL = "http://localhost:3000";

/**
 * Normalizes a configured public origin to `https?://host[:port]` (no path/trailing slash).
 * Accepts bare hostnames (`marco.am`, `*.vercel.app`) by prefixing `https://`.
 * Returns null when the value cannot form a valid absolute http(s) URL.
 */
export function normalizePublicAppUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    return stripTrailingSlash(`${parsed.protocol}//${parsed.host}`);
  } catch {
    return null;
  }
}

/**
 * Logical environment: local dev, Vercel Preview (staging), or production.
 * - Prefer `APP_ENV` on self-hosted or when you need to override Vercel defaults.
 * - On Vercel, `VERCEL_ENV=preview` maps to `staging` (NODE_ENV is still `production` on builds).
 */
export function getDeploymentTier(): DeploymentTier {
  const fromApp = parseAppEnv(process.env.APP_ENV);
  if (fromApp) {
    return fromApp;
  }

  const vercel = process.env.VERCEL_ENV;
  if (vercel === "development") {
    return "development";
  }
  if (vercel === "preview") {
    return "staging";
  }
  if (vercel === "production") {
    return "production";
  }

  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/**
 * Canonical public site URL (no trailing slash). Server-side absolute URLs and CORS fallbacks.
 * Skips invalid `NEXT_PUBLIC_APP_URL` / `APP_URL` values instead of returning them raw
 * (raw hostnames without a scheme cause `new URL(...)` → "Invalid URL" on checkout).
 */
export function getPublicAppUrl(): string {
  const fromPublic = normalizePublicAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (fromPublic) {
    return fromPublic;
  }
  const fromApp = normalizePublicAppUrl(process.env.APP_URL);
  if (fromApp) {
    return fromApp;
  }
  const fromVercel = normalizePublicAppUrl(process.env.VERCEL_URL);
  if (fromVercel) {
    return fromVercel;
  }
  return LOCAL_DEV_APP_URL;
}

/**
 * Values allowed for `Access-Control-Allow-Origin`.
 * Prefer `CORS_ORIGIN` when the API is served under a different host than the storefront.
 */
export function getCorsAllowedOrigins(): string[] {
  const cors = process.env.CORS_ORIGIN?.trim();
  if (cors) {
    return cors
      .split(",")
      .map((origin) => normalizePublicAppUrl(origin.trim()))
      .filter((origin): origin is string => origin !== null);
  }
  const nextPublic = normalizePublicAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (nextPublic) {
    return [nextPublic];
  }
  if (process.env.NODE_ENV === "development") {
    return [LOCAL_DEV_APP_URL];
  }
  return [getPublicAppUrl()];
}

/**
 * Backwards-compatible single-origin accessor for callers/tests that only need the primary origin.
 */
export function getCorsAllowedOrigin(): string {
  return getCorsAllowedOrigins()[0] ?? "";
}
