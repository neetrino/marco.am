import { createHash } from "crypto";

/**
 * EDP_REC_ACCOUNT : EDP_AMOUNT : SECRET_KEY : EDP_BILL_NO : EDP_PAYER_ACCOUNT : EDP_TRANS_ID : EDP_TRANS_DATE
 *
 * Idram Merchant API requires MD5 for `EDP_CHECKSUM` (hex). Stronger hashes are not supported by the gateway;
 * see `docs/reference/payment integration/official-api-integration-docs/IDram/Idram Merchant API New.md`.
 * This is vendor-mandated message authentication, not a general-purpose password hash.
 */
export function computeIdramChecksum(parts: {
  edpRecAccount: string;
  edpAmount: string;
  secretKey: string;
  edpBillNo: string;
  edpPayerAccount: string;
  edpTransId: string;
  edpTransDate: string;
}): string {
  const str = [
    parts.edpRecAccount,
    parts.edpAmount,
    parts.secretKey,
    parts.edpBillNo,
    parts.edpPayerAccount,
    parts.edpTransId,
    parts.edpTransDate,
  ].join(":");
  return createHash("md5").update(str, "utf8").digest("hex");
}

export function idramChecksumsMatch(received: string, computed: string): boolean {
  return received.trim().toUpperCase() === computed.toUpperCase();
}
