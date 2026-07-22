import { db } from "@white-shop/db";
import type { Prisma } from "@white-shop/db/prisma";
import {
  assertIdramConfigured,
  formatIdramAmount,
  resolveIdramConfig,
  verifyIdramChecksum,
} from "@/lib/payments/idram/config";
import { finalizePaymentPaid } from "@/lib/payments/finalize-payment";
import {
  buildGenericPaymentSuccessRedirectUrl,
  buildOrderFailedRedirectUrl,
  buildOrderPaidRedirectUrl,
} from "@/lib/payments/payment-urls";
import { logger } from "@/lib/utils/logger";

const PROVIDER = "idram";
const OK_BODY = "OK";

export type IdramResultFields = {
  EDP_PRECHECK?: string;
  EDP_BILL_NO?: string;
  EDP_REC_ACCOUNT?: string;
  EDP_AMOUNT?: string;
  EDP_PAYER_ACCOUNT?: string;
  EDP_TRANS_ID?: string;
  EDP_TRANS_DATE?: string;
  EDP_CHECKSUM?: string;
};

function pickField(source: Record<string, string>, key: string): string | undefined {
  const direct = source[key];
  if (direct !== undefined && direct !== "") return direct;
  const lower = source[key.toLowerCase()];
  if (lower !== undefined && lower !== "") return lower;
  return undefined;
}

export function parseIdramFields(
  source: Record<string, string>,
): IdramResultFields {
  return {
    EDP_PRECHECK: pickField(source, "EDP_PRECHECK"),
    EDP_BILL_NO: pickField(source, "EDP_BILL_NO"),
    EDP_REC_ACCOUNT: pickField(source, "EDP_REC_ACCOUNT"),
    EDP_AMOUNT: pickField(source, "EDP_AMOUNT"),
    EDP_PAYER_ACCOUNT: pickField(source, "EDP_PAYER_ACCOUNT"),
    EDP_TRANS_ID: pickField(source, "EDP_TRANS_ID"),
    EDP_TRANS_DATE: pickField(source, "EDP_TRANS_DATE"),
    EDP_CHECKSUM: pickField(source, "EDP_CHECKSUM"),
  };
}

/**
 * RESULT_URL handler: precheck → OK; confirmation → checksum + mark paid → OK.
 * Response must be plain text `OK` with no HTML.
 */
export async function handleIdramResult(
  fields: IdramResultFields,
): Promise<{ body: string; status: number }> {
  const config = resolveIdramConfig();
  assertIdramConfigured(config);

  const billNo = fields.EDP_BILL_NO?.trim();
  const amount = fields.EDP_AMOUNT?.trim();
  const recAccount = fields.EDP_REC_ACCOUNT?.trim();

  if (!billNo || !amount || !recAccount) {
    logger.warn("Idram RESULT missing required fields", { billNo, amount, recAccount });
    return { body: "", status: 400 };
  }

  if (recAccount !== config.recAccount && !config.devMock) {
    logger.warn("Idram RESULT rec account mismatch", { recAccount });
    return { body: "", status: 403 };
  }

  const payment = await db.payment.findFirst({
    where: { provider: PROVIDER, order: { number: billNo } },
    include: { order: true },
  });

  if (!payment) {
    logger.warn("Idram RESULT unknown bill", { billNo });
    return { body: "", status: 404 };
  }

  const expectedAmount = formatIdramAmount(Number(payment.amount));
  if (amount !== expectedAmount && Number(amount) !== Number(payment.amount)) {
    logger.warn("Idram RESULT amount mismatch", {
      billNo,
      amount,
      expectedAmount,
    });
    return { body: "", status: 400 };
  }

  if (fields.EDP_PRECHECK?.toUpperCase() === "YES") {
    return { body: OK_BODY, status: 200 };
  }

  const payer = fields.EDP_PAYER_ACCOUNT?.trim();
  const transId = fields.EDP_TRANS_ID?.trim();
  const transDate = fields.EDP_TRANS_DATE?.trim();
  const checksum = fields.EDP_CHECKSUM?.trim();

  if (!payer || !transId || !transDate || !checksum) {
    logger.warn("Idram confirmation missing fields", { billNo });
    return { body: "", status: 400 };
  }

  if (!config.devMock) {
    const valid = verifyIdramChecksum(checksum, {
      recAccount: config.recAccount,
      amount,
      secretKey: config.secretKey,
      billNo,
      payerAccount: payer,
      transId,
      transDate,
    });
    if (!valid) {
      logger.warn("Idram checksum mismatch", { billNo, transId });
      return { body: "", status: 403 };
    }
  }

  await finalizePaymentPaid({
    orderId: payment.orderId,
    paymentId: payment.id,
    provider: PROVIDER,
    providerTransactionId: transId,
    providerResponse: { ...fields } as Prisma.InputJsonValue,
    eventType: "payment_idram_paid",
    userId: payment.order.userId,
  });

  return { body: OK_BODY, status: 200 };
}

export async function handleIdramBrowserReturn(params: {
  orderNumber: string | null;
  success: boolean;
}): Promise<{ redirectUrl: string }> {
  const orderNumber = params.orderNumber?.trim() || null;
  if (!orderNumber) {
    return {
      redirectUrl: params.success
        ? buildGenericPaymentSuccessRedirectUrl()
        : buildOrderFailedRedirectUrl(null),
    };
  }

  const order = await db.order.findUnique({
    where: { number: orderNumber },
    select: { number: true, paymentStatus: true },
  });

  if (!order) {
    return { redirectUrl: buildOrderFailedRedirectUrl(null) };
  }

  if (params.success && order.paymentStatus === "paid") {
    return { redirectUrl: buildOrderPaidRedirectUrl(order.number) };
  }

  if (params.success) {
    // RESULT_URL may still be in flight — send user to order page; UI can poll status.
    return { redirectUrl: buildOrderPaidRedirectUrl(order.number) };
  }

  return { redirectUrl: buildOrderFailedRedirectUrl(order.number) };
}
