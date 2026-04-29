/**
 * Idram GetPayment endpoint — same URL for test and live; mode is determined by merchant credentials in Idram.
 * @see docs/reference/payment integration/payments/IDRAM-INTEGRATION.md
 */
export function getIdramGetPaymentUrl(): string {
  const url = process.env.IDRAM_GET_PAYMENT_URL?.trim();
  if (url) {
    return url.replace(/\/+$/, "");
  }
  return "https://banking.idram.am/Payment/GetPayment";
}

export function getIdramMerchantCredentials(): { recAccount: string; secretKey: string } {
  const testMode = process.env.IDRAM_TEST_MODE?.trim().toLowerCase() === "true";
  const recAccount = (
    testMode
      ? process.env.IDRAM_REC_ACCOUNT?.trim()
      : process.env.IDRAM_LIVE_REC_ACCOUNT?.trim() ?? process.env.IDRAM_REC_ACCOUNT?.trim()
  ) ?? "";
  const secretKey = (
    testMode
      ? process.env.IDRAM_SECRET_KEY?.trim()
      : process.env.IDRAM_LIVE_SECRET_KEY?.trim() ?? process.env.IDRAM_SECRET_KEY?.trim()
  ) ?? "";

  if (!recAccount || !secretKey) {
    throw {
      status: 503,
      type: "https://api.shop.am/problems/service-unavailable",
      title: "Service Unavailable",
      detail:
        "Idram payment is not configured. Set IDRAM_REC_ACCOUNT, IDRAM_SECRET_KEY (and IDRAM_TEST_MODE) or live equivalents.",
    };
  }

  return { recAccount, secretKey };
}
