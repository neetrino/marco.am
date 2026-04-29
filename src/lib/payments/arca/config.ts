import { getPublicAppUrl } from "@/lib/config/deployment-env";

export type ArcaBankId = "idbank" | "inecobank";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Base REST URL (no trailing path). Test/live and bank-specific per project docs.
 */
export function getArcaBaseUrl(): string {
  const override = process.env.ARCA_PAYMENT_REST_BASE_URL?.trim();
  if (override) {
    return stripTrailingSlash(override);
  }

  const testMode = process.env.ARCA_TEST_MODE?.trim().toLowerCase() === "true";
  const bank = (process.env.ARCA_BANK?.trim().toLowerCase() ?? "idbank") as ArcaBankId;

  if (testMode) {
    if (bank === "inecobank") {
      return "https://pg.inecoecom.am/payment/rest";
    }
    return "https://ipaytest.arca.am:8445/payment/rest";
  }

  if (bank === "inecobank") {
    return "https://pg.inecoecom.am/payment/rest";
  }
  return "https://ipay.arca.am/payment/rest";
}

export function getArcaCredentials(): { userName: string; password: string } {
  const testMode = process.env.ARCA_TEST_MODE?.trim().toLowerCase() === "true";
  const userName = (
    testMode
      ? process.env.ARCA_USERNAME?.trim()
      : process.env.ARCA_LIVE_USERNAME?.trim() ?? process.env.ARCA_USERNAME?.trim()
  ) ?? "";
  const password = (
    testMode
      ? process.env.ARCA_PASSWORD?.trim()
      : process.env.ARCA_LIVE_PASSWORD?.trim() ?? process.env.ARCA_PASSWORD?.trim()
  ) ?? "";

  if (!userName || !password) {
    throw {
      status: 503,
      type: "https://api.shop.am/problems/service-unavailable",
      title: "Service Unavailable",
      detail:
        "Arca payment is not configured. Set ARCA_USERNAME, ARCA_PASSWORD (and ARCA_TEST_MODE / ARCA_BANK) or ARCA_PAYMENT_REST_BASE_URL.",
    };
  }

  return { userName, password };
}

export function buildArcaReturnUrl(localOrderId: string): string {
  const base = getPublicAppUrl();
  const url = new URL("/api/v1/payments/arca/callback", base);
  url.searchParams.set("localOrderId", localOrderId);
  return url.toString();
}
