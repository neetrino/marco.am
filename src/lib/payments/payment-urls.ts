import { getPublicAppUrl } from "@/lib/config/deployment-env";

/**
 * Public callback paths registered with Idram / IDBank (WooCommerce-era URLs).
 * Handlers also exist under `/api/v1/payments/...` — same logic.
 */
export const IDRAM_WC_RESULT_PATH = "/wc-api/idram_result";
export const IDRAM_WC_SUCCESS_PATH = "/wc-api/idram_complete";
export const IDRAM_WC_FAIL_PATH = "/wc-api/idram_fail";

export const ARCA_WC_SUCCESS_PATH = "/wc-api/idbank_successful";
export const ARCA_WC_FAIL_PATH = "/wc-api/idbank_failed";

export const IDRAM_API_CALLBACK_PATH = "/api/v1/payments/idram/callback";
export const IDRAM_API_SUCCESS_PATH = "/api/v1/payments/idram/success";
export const IDRAM_API_FAIL_PATH = "/api/v1/payments/idram/fail";
export const IDRAM_API_START_PATH = "/api/v1/payments/idram/start";

export const ARCA_API_CALLBACK_PATH = "/api/v1/payments/arca/callback";
export const ARCA_API_FAIL_PATH = "/api/v1/payments/arca/fail";

function absoluteUrl(path: string): string {
  const base = getPublicAppUrl();
  try {
    return new URL(path, `${base}/`).toString();
  } catch {
    throw {
      status: 503,
      type: "https://api.shop.am/problems/internal-error",
      title: "Service Unavailable",
      detail:
        "Public app URL is not configured. Set APP_URL or NEXT_PUBLIC_APP_URL to an absolute https URL (e.g. https://marco.am).",
    };
  }
}

/** URLs registered (or to register) with Idram merchant portal. */
export function getIdramMerchantCallbackUrls(): {
  resultUrl: string;
  successUrl: string;
  failUrl: string;
} {
  return {
    resultUrl: absoluteUrl(IDRAM_WC_RESULT_PATH),
    successUrl: absoluteUrl(IDRAM_WC_SUCCESS_PATH),
    failUrl: absoluteUrl(IDRAM_WC_FAIL_PATH),
  };
}

/** Return / fail URLs for ArCa register.do (IDBank). */
export function getArcaMerchantCallbackUrls(): {
  returnUrl: string;
  failUrl: string;
} {
  return {
    returnUrl: absoluteUrl(ARCA_WC_SUCCESS_PATH),
    failUrl: absoluteUrl(ARCA_WC_FAIL_PATH),
  };
}

export function buildIdramStartUrl(orderNumber: string): string {
  const url = new URL(absoluteUrl(IDRAM_API_START_PATH));
  url.searchParams.set("order", orderNumber);
  return url.toString();
}

export function buildOrderPaidRedirectUrl(orderNumber: string): string {
  return absoluteUrl(`/orders/${encodeURIComponent(orderNumber)}?payment=succeeded`);
}

export function buildOrderFailedRedirectUrl(orderNumber: string | null): string {
  if (orderNumber) {
    return absoluteUrl(`/orders/${encodeURIComponent(orderNumber)}?payment=failed`);
  }
  return absoluteUrl("/checkout?payment=failed");
}

/** Browser landed on success URL without bill number — RESULT_URL is source of truth. */
export function buildGenericPaymentSuccessRedirectUrl(): string {
  return absoluteUrl("/orders?payment=succeeded");
}
