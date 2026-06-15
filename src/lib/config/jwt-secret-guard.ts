import { getDeploymentTier } from "@/lib/config/deployment-env";
import { logger } from "@/lib/utils/logger";

const MIN_JWT_SECRET_LENGTH = 32;

const WEAK_JWT_SECRET_VALUES = new Set([
  "your-super-secret-jwt-key-change-this-in-production",
  "change-me",
  "secret",
  "jwt-secret",
  "dev-secret",
]);

/**
 * Collects human-readable issues for the configured JWT signing secret.
 */
export function collectJwtSecretIssues(secret: string): string[] {
  const issues: string[] = [];

  if (!secret) {
    issues.push("JWT_SECRET is missing");
    return issues;
  }

  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    issues.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
  }

  if (WEAK_JWT_SECRET_VALUES.has(secret.toLowerCase())) {
    issues.push("JWT_SECRET uses a known weak placeholder value");
  }

  return issues;
}

/**
 * Fails fast in production when JWT_SECRET is missing or weak.
 */
export function assertJwtSecretConfigured(): void {
  const secret = process.env.JWT_SECRET?.trim() ?? "";
  const issues = collectJwtSecretIssues(secret);
  if (issues.length === 0) {
    return;
  }

  const tier = getDeploymentTier();
  const message = `JWT_SECRET is not production-safe: ${issues.join("; ")}`;

  if (tier === "production") {
    throw new Error(message);
  }

  if (tier === "staging") {
    logger.error(message, { tier });
    return;
  }

  logger.warn(message, { tier });
}

/**
 * Reports JWT_SECRET issues without crashing public pages during server cold start.
 */
export function reportJwtSecretConfiguration(): void {
  const secret = process.env.JWT_SECRET?.trim() ?? "";
  const issues = collectJwtSecretIssues(secret);
  if (issues.length === 0) {
    return;
  }

  const tier = getDeploymentTier();
  const message = `JWT_SECRET is not production-safe: ${issues.join("; ")}`;

  if (tier === "development") {
    logger.warn(message, { tier });
    return;
  }

  logger.error(message, { tier });
}
