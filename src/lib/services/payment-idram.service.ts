import { NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { getIdramGetPaymentUrl, getIdramMerchantCredentials } from "@/lib/payments/idram/config";
import { computeIdramChecksum, idramChecksumsMatch } from "@/lib/payments/idram/checksum";
import { logger } from "@/lib/utils/logger";
import { markOrderPaymentPaid } from "./payment-order-completion.service";

function formatEdpAmount(total: number): string {
  if (Number.isInteger(total)) {
    return String(total);
  }
  return total.toFixed(2);
}

function amountsMatch(orderTotal: number, edpAmountRaw: string): boolean {
  const edp = Number(edpAmountRaw);
  if (!Number.isFinite(edp)) {
    return false;
  }
  return Math.abs(orderTotal - edp) < 0.02;
}

function mapLocaleToEdpLanguage(locale: string): string {
  const k = locale.trim().toLowerCase().slice(0, 2);
  if (k === "hy" || k === "am") return "AM";
  if (k === "ru") return "RU";
  return "EN";
}

export function buildIdramFormFields(input: {
  orderNumber: string;
  amount: number;
  description: string;
  checkoutLocale: string;
  customerEmail?: string | null;
}): Record<string, string> {
  const { recAccount } = getIdramMerchantCredentials();
  const fields: Record<string, string> = {
    EDP_LANGUAGE: mapLocaleToEdpLanguage(input.checkoutLocale),
    EDP_REC_ACCOUNT: recAccount,
    EDP_DESCRIPTION: input.description.slice(0, 500),
    EDP_AMOUNT: formatEdpAmount(input.amount),
    EDP_BILL_NO: input.orderNumber,
    order_number: input.orderNumber,
  };
  if (input.customerEmail?.trim()) {
    fields.EDP_EMAIL = input.customerEmail.trim();
  }
  return fields;
}

export function getIdramCheckoutForm(input: {
  orderNumber: string;
  amount: number;
  description: string;
  checkoutLocale: string;
  customerEmail?: string | null;
}): { action: string; fields: Record<string, string> } {
  return {
    action: getIdramGetPaymentUrl(),
    fields: buildIdramFormFields(input),
  };
}

function plainOk(): NextResponse {
  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function plainNotOk(message: string): NextResponse {
  return new NextResponse(message, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function processIdramCallback(formData: FormData): Promise<NextResponse> {
  const body: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") {
      body[k] = v;
    }
  }

  const { recAccount, secretKey } = getIdramMerchantCredentials();

  if (body.EDP_PRECHECK?.toUpperCase() === "YES") {
    return handleIdramPrecheck(body, recAccount);
  }

  return handleIdramConfirmation(body, recAccount, secretKey);
}

async function handleIdramPrecheck(body: Record<string, string>, recAccount: string): Promise<NextResponse> {
  const billNo = body.EDP_BILL_NO?.trim();
  const amountStr = body.EDP_AMOUNT?.trim();
  const reqRec = body.EDP_REC_ACCOUNT?.trim();

  if (!billNo || !amountStr || reqRec !== recAccount) {
    return plainNotOk("Invalid precheck parameters");
  }

  const order = await db.order.findFirst({
    where: { number: billNo },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!order) {
    return plainNotOk("EDP_BILL_NO not found");
  }

  const payment = order.payments.find((p) => p.provider === "idram" && p.status === "pending");
  if (!payment) {
    return plainNotOk("No pending Idram payment");
  }

  if (order.currency !== "AMD") {
    return plainNotOk("Currency not supported");
  }

  if (order.paymentStatus !== "pending") {
    return plainNotOk("Order not pending");
  }

  if (!amountsMatch(Number(order.total), amountStr)) {
    return plainNotOk("EDP_AMOUNT mismatch");
  }

  return plainOk();
}

async function handleIdramConfirmation(
  body: Record<string, string>,
  recAccount: string,
  secretKey: string
): Promise<NextResponse> {
  const billNo = body.EDP_BILL_NO?.trim();
  const edpAmount = body.EDP_AMOUNT?.trim();
  const reqRec = body.EDP_REC_ACCOUNT?.trim();
  const payer = body.EDP_PAYER_ACCOUNT?.trim();
  const transId = body.EDP_TRANS_ID?.trim();
  const transDate = body.EDP_TRANS_DATE?.trim();
  const checksum = body.EDP_CHECKSUM?.trim();

  if (!billNo || !edpAmount || !reqRec || !payer || !transId || !transDate || !checksum) {
    return plainNotOk("Missing confirmation fields");
  }

  if (reqRec !== recAccount) {
    return plainNotOk("EDP_REC_ACCOUNT mismatch");
  }

  const expected = computeIdramChecksum({
    edpRecAccount: reqRec,
    edpAmount,
    secretKey,
    edpBillNo: billNo,
    edpPayerAccount: payer,
    edpTransId: transId,
    edpTransDate: transDate,
  });

  if (!idramChecksumsMatch(checksum, expected)) {
    logger.warn("Idram checksum mismatch", { billNo });
    return plainNotOk("EDP_CHECKSUM not correct");
  }

  const order = await db.order.findFirst({
    where: { number: billNo },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!order) {
    return plainNotOk("EDP_BILL_NO not found");
  }

  const payment = order.payments.find((p) => p.provider === "idram");
  if (!payment) {
    return plainNotOk("Payment not found");
  }

  if (order.currency !== "AMD") {
    return plainNotOk("Currency not supported");
  }

  if (!amountsMatch(Number(order.total), edpAmount)) {
    return plainNotOk("EDP_AMOUNT mismatch");
  }

  if (order.paymentStatus === "paid") {
    return plainOk();
  }

  const result = await markOrderPaymentPaid({
    paymentId: payment.id,
    providerTransactionId: transId,
    providerResponse: body,
  });

  if (!result.ok) {
    return plainNotOk("Payment not found");
  }

  return plainOk();
}
