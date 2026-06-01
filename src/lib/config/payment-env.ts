import { getDeploymentTier, getPublicAppUrl } from "./deployment-env";

/** Mock hosted checkout is allowed only outside production. */
export function isMockPaymentFlowAllowed(): boolean {
  return getDeploymentTier() !== "production";
}

/**
 * Resolves PSP checkout base URL. In production, mock fallback is forbidden.
 */
export function resolvePaymentCheckoutBaseUrl(): string {
  const configured = process.env.PAYMENT_PSP_CHECKOUT_BASE_URL?.trim();
  if (configured) {
    return configured;
  }

  if (getDeploymentTier() === "production") {
    throw {
      status: 503,
      type: "https://api.shop.am/problems/internal-error",
      title: "Service Unavailable",
      detail: "PAYMENT_PSP_CHECKOUT_BASE_URL is not configured",
    };
  }

  return `${getPublicAppUrl()}/api/v1/payments/mock-hosted`;
}
