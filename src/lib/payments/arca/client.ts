import { logger } from "@/lib/utils/logger";
import {
  ARCA_CURRENCY_AMD,
  ARCA_ORDER_STATUS_DEPOSITED,
  ARCA_PAYMENT_STATE_DEPOSITED,
  assertArcaConfigured,
  resolveArcaConfig,
  toArcaAmountMinor,
  type ArcaConfig,
} from "./config";

const ARCA_HTTP_TIMEOUT_MS = 25_000;

type ArcaRegisterSuccess = {
  orderId: string;
  formUrl: string;
};

type ArcaStatusResult = {
  orderNumber: string | null;
  orderStatus: number | null;
  paymentState: string | null;
  raw: Record<string, unknown>;
  isPaid: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function postArcaForm(
  config: ArcaConfig,
  action: "register.do" | "getOrderStatusExtended.do",
  fields: Record<string, string>,
): Promise<Record<string, unknown>> {
  assertArcaConfigured(config);
  const url = `${config.restBaseUrl}/${action}`;
  const body = new URLSearchParams({
    userName: config.username,
    password: config.password,
    ...fields,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ARCA_HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      logger.error("ArCa non-JSON response", { action, status: response.status });
      throw {
        status: 502,
        type: "https://api.shop.am/problems/bad-gateway",
        title: "Bad Gateway",
        detail: "ArCa returned an invalid response",
      };
    }
    return asRecord(json);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "type" in error
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "ArCa request failed";
    logger.error("ArCa HTTP request failed", { action, message, error });
    throw {
      status: 502,
      type: "https://api.shop.am/problems/bad-gateway",
      title: "Bad Gateway",
      detail: `ArCa / IDBank unreachable: ${message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Registers an order with ArCa / IDBank and returns hosted payment formUrl.
 */
export async function registerArcaPayment(input: {
  orderNumber: string;
  amountAmd: number;
  returnUrl: string;
  failUrl: string;
  description: string;
  language: string;
}): Promise<ArcaRegisterSuccess> {
  const config = resolveArcaConfig();
  const amount = String(toArcaAmountMinor(input.amountAmd));
  const language = normalizeArcaLanguage(input.language);

  const raw = await postArcaForm(config, "register.do", {
    orderNumber: input.orderNumber,
    amount,
    currency: ARCA_CURRENCY_AMD,
    returnUrl: input.returnUrl,
    failUrl: input.failUrl,
    description: input.description.slice(0, 512),
    language,
  });

  const errorCode = Number(raw.errorCode ?? -1);
  const orderId = typeof raw.orderId === "string" ? raw.orderId : "";
  const formUrl = typeof raw.formUrl === "string" ? raw.formUrl : "";

  if (errorCode !== 0 || !orderId || !formUrl) {
    logger.error("ArCa register.do failed", {
      orderNumber: input.orderNumber,
      errorCode: raw.errorCode,
      errorMessage: raw.errorMessage,
    });
    throw {
      status: 502,
      type: "https://api.shop.am/problems/bad-gateway",
      title: "Bad Gateway",
      detail:
        typeof raw.errorMessage === "string" && raw.errorMessage
          ? raw.errorMessage
          : "Failed to register payment with IDBank / ArCa",
    };
  }

  return { orderId, formUrl };
}

/**
 * Verifies payment status via getOrderStatusExtended.do (never trust URL alone).
 */
export async function getArcaOrderStatus(bankOrderId: string): Promise<ArcaStatusResult> {
  const config = resolveArcaConfig();
  const raw = await postArcaForm(config, "getOrderStatusExtended.do", {
    orderId: bankOrderId,
  });

  const errorCode = Number(raw.errorCode ?? -1);
  if (errorCode !== 0) {
    logger.warn("ArCa getOrderStatusExtended.do error", {
      bankOrderId,
      errorCode: raw.errorCode,
      errorMessage: raw.errorMessage,
    });
  }

  const orderNumber =
    typeof raw.orderNumber === "string"
      ? raw.orderNumber
      : typeof raw.orderNumber === "number"
        ? String(raw.orderNumber)
        : null;

  const orderStatus =
    typeof raw.orderStatus === "number"
      ? raw.orderStatus
      : typeof raw.orderStatus === "string" && raw.orderStatus !== ""
        ? Number(raw.orderStatus)
        : null;

  const paymentAmountInfo = asRecord(raw.paymentAmountInfo);
  const paymentState =
    typeof paymentAmountInfo.paymentState === "string"
      ? paymentAmountInfo.paymentState
      : typeof raw.paymentState === "string"
        ? raw.paymentState
        : null;

  const isPaid =
    orderStatus === ARCA_ORDER_STATUS_DEPOSITED ||
    paymentState?.toUpperCase() === ARCA_PAYMENT_STATE_DEPOSITED;

  return { orderNumber, orderStatus, paymentState, raw, isPaid };
}

function normalizeArcaLanguage(locale: string): string {
  const base = locale.trim().toLowerCase().slice(0, 2);
  if (base === "hy" || base === "am") return "hy";
  if (base === "ru") return "ru";
  return "en";
}
