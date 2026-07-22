import { createHash } from "crypto";
import { getDeploymentTier } from "@/lib/config/deployment-env";
import { isMockPaymentFlowAllowed } from "@/lib/config/payment-env";

const DEFAULT_GET_PAYMENT_URL = "https://banking.idram.am/Payment/GetPayment";

export type IdramConfig = {
  testMode: boolean;
  devMock: boolean;
  recAccount: string;
  secretKey: string;
  getPaymentUrl: string;
};

function envFlagTrue(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === "true";
}

function envFlagFalse(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === "false";
}

/**
 * Resolves Idram credentials. Production tier forces live keys when LIVE_* are set.
 */
export function resolveIdramConfig(): IdramConfig {
  const production = getDeploymentTier() === "production";
  const testMode = production
    ? envFlagTrue(process.env.IDRAM_TEST_MODE)
    : !envFlagFalse(process.env.IDRAM_TEST_MODE);

  const recAccount = (
    testMode
      ? process.env.IDRAM_REC_ACCOUNT || process.env.IDRAM_LIVE_REC_ACCOUNT
      : process.env.IDRAM_LIVE_REC_ACCOUNT || process.env.IDRAM_REC_ACCOUNT
  )?.trim() ?? "";

  const secretKey = (
    testMode
      ? process.env.IDRAM_SECRET_KEY || process.env.IDRAM_LIVE_SECRET_KEY
      : process.env.IDRAM_LIVE_SECRET_KEY || process.env.IDRAM_SECRET_KEY
  )?.trim() ?? "";

  const getPaymentUrl =
    process.env.IDRAM_GET_PAYMENT_URL?.trim() || DEFAULT_GET_PAYMENT_URL;

  const devMock =
    isMockPaymentFlowAllowed() && envFlagTrue(process.env.IDRAM_DEV_MOCK);

  return { testMode, devMock, recAccount, secretKey, getPaymentUrl };
}

export function assertIdramConfigured(config: IdramConfig): void {
  if (config.devMock) {
    return;
  }
  if (!config.recAccount || !config.secretKey) {
    throw {
      status: 503,
      type: "https://api.shop.am/problems/internal-error",
      title: "Service Unavailable",
      detail: "Idram merchant credentials are not configured",
    };
  }
}

/**
 * Idram confirmation checksum:
 * MD5(EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE)
 */
export function computeIdramChecksum(parts: {
  recAccount: string;
  amount: string;
  secretKey: string;
  billNo: string;
  payerAccount: string;
  transId: string;
  transDate: string;
}): string {
  const payload = [
    parts.recAccount,
    parts.amount,
    parts.secretKey,
    parts.billNo,
    parts.payerAccount,
    parts.transId,
    parts.transDate,
  ].join(":");
  return createHash("md5").update(payload, "utf8").digest("hex");
}

export function verifyIdramChecksum(
  expectedHex: string,
  parts: Parameters<typeof computeIdramChecksum>[0],
): boolean {
  const actual = computeIdramChecksum(parts);
  return expectedHex.trim().toUpperCase() === actual.toUpperCase();
}

/** Format AMD amount for EDP_AMOUNT (major units, dot decimal). */
export function formatIdramAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Invalid payment amount for Idram",
    };
  }
  return amount.toFixed(2);
}
