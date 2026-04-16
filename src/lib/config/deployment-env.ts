/**
 * Deployment tier and public URL resolution for dev / staging / prod.
 * Use this instead of ad-hoc `process.env` chains in API and middleware.
 */

export type DeploymentTier = "development" | "staging" | "production";

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
 */
export function getPublicAppUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromPublic) {
    return stripTrailingSlash(fromPublic);
  }
  const fromApp = process.env.APP_URL?.trim();
  if (fromApp) {
    return stripTrailingSlash(fromApp);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}

/**
 * Value for `Access-Control-Allow-Origin`. Prefer `CORS_ORIGIN` when the API is served under a different host than the storefront.
 */
export function getCorsAllowedOrigin(): string {
  const cors = process.env.CORS_ORIGIN?.trim();
  if (cors) {
    return stripTrailingSlash(cors);
  }
  const nextPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (nextPublic) {
    return stripTrailingSlash(nextPublic);
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return getPublicAppUrl();
}
