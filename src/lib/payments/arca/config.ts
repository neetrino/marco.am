import { getDeploymentTier } from "@/lib/config/deployment-env";

const IDBANK_TEST_BASE = "https://ipaytest.arca.am:8445/payment/rest";
const IDBANK_LIVE_BASE = "https://ipay.arca.am/payment/rest";

/** AMD minor-unit multiplier (1 AMD = 100 minor units). */
export const ARCA_AMD_MINOR_FACTOR = 100;

/** ISO 4217 numeric currency for AMD. */
export const ARCA_CURRENCY_AMD = "051";

/** SmartVista deposited / paid indicators. */
export const ARCA_ORDER_STATUS_DEPOSITED = 2;
export const ARCA_PAYMENT_STATE_DEPOSITED = "DEPOSITED";

export type ArcaConfig = {
  testMode: boolean;
  username: string;
  password: string;
  restBaseUrl: string;
};

function envFlagTrue(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === "true";
}

function envFlagFalse(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === "false";
}

/** Trim and strip accidental wrapping quotes from Vercel/dashboard pastes. */
function readEnvCredential(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function resolveRestBaseUrl(testMode: boolean): string {
  const override = process.env.ARCA_PAYMENT_REST_BASE_URL?.trim();
  if (override) {
    return override.replace(/\/+$/, "");
  }
  return testMode ? IDBANK_TEST_BASE : IDBANK_LIVE_BASE;
}

/**
 * Resolves IDBank / ArCa REST credentials.
 * Production tier uses live unless ARCA_TEST_MODE=true explicitly.
 */
export function resolveArcaConfig(): ArcaConfig {
  const production = getDeploymentTier() === "production";
  const testMode = production
    ? envFlagTrue(process.env.ARCA_TEST_MODE)
    : !envFlagFalse(process.env.ARCA_TEST_MODE);

  const username = readEnvCredential(
    testMode
      ? process.env.ARCA_USERNAME || process.env.ARCA_LIVE_USERNAME
      : process.env.ARCA_LIVE_USERNAME || process.env.ARCA_USERNAME,
  );

  const password = readEnvCredential(
    testMode
      ? process.env.ARCA_PASSWORD || process.env.ARCA_LIVE_PASSWORD
      : process.env.ARCA_LIVE_PASSWORD || process.env.ARCA_PASSWORD,
  );

  return {
    testMode,
    username,
    password,
    restBaseUrl: resolveRestBaseUrl(testMode),
  };
}

export function assertArcaConfigured(config: ArcaConfig): void {
  if (!config.username || !config.password) {
    throw {
      status: 503,
      type: "https://api.shop.am/problems/internal-error",
      title: "Service Unavailable",
      detail: "ArCa / IDBank merchant credentials are not configured",
    };
  }
}

/** Convert AMD major units to ArCa minor units. */
export function toArcaAmountMinor(amountAmd: number): number {
  if (!Number.isFinite(amountAmd) || amountAmd <= 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Invalid payment amount for ArCa",
    };
  }
  return Math.round(amountAmd * ARCA_AMD_MINOR_FACTOR);
}
