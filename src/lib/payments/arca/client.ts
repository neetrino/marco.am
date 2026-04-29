import { getArcaBaseUrl, getArcaCredentials } from "./config";
import type { ArcaExtendedStatusResponse, ArcaRegisterResponse } from "./types";

function toMinorUnits(amount: number, currency: string): number {
  const c = currency.toUpperCase();
  if (c === "AMD" || c === "051") {
    return Math.round(amount * 100);
  }
  if (c === "JPY") {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

function numericCurrency(currency: string): string {
  const c = currency.toUpperCase();
  const map: Record<string, string> = {
    AMD: "051",
    USD: "840",
    EUR: "978",
    RUB: "643",
    "051": "051",
    "840": "840",
    "978": "978",
    "643": "643",
  };
  return map[c] ?? "051";
}

function mapCheckoutLocaleToArca(lang: string): string {
  const key = lang.trim().toLowerCase().slice(0, 2);
  if (key === "hy" || key === "am") return "hy";
  if (key === "ru") return "ru";
  return "en";
}

async function postForm(path: string, body: URLSearchParams): Promise<unknown> {
  const base = getArcaBaseUrl();
  const url = `${base}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString(),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw {
      status: 502,
      type: "https://api.shop.am/problems/bad-gateway",
      title: "Bad Gateway",
      detail: "Arca gateway returned a non-JSON response",
    };
  }
}

export async function arcaRegisterOrder(input: {
  orderNumber: string;
  amount: number;
  currency: string;
  returnUrl: string;
  description: string;
  language: string;
}): Promise<{ orderId: string; formUrl: string }> {
  const { userName, password } = getArcaCredentials();
  const amountMinor = toMinorUnits(input.amount, input.currency);
  const body = new URLSearchParams({
    userName,
    password,
    orderNumber: input.orderNumber,
    amount: String(amountMinor),
    currency: numericCurrency(input.currency),
    returnUrl: input.returnUrl,
    description: input.description,
    language: mapCheckoutLocaleToArca(input.language),
    jsonParams: JSON.stringify({ FORCE_3DS2: "true" }),
  });

  const json = (await postForm("register.do", body)) as ArcaRegisterResponse;
  const err = Number(json.errorCode ?? -1);
  if (err !== 0 || !json.orderId || !json.formUrl) {
    throw {
      status: 502,
      type: "https://api.shop.am/problems/bad-gateway",
      title: "Payment registration failed",
      detail: json.errorMessage ?? `Arca register.do errorCode=${String(json.errorCode)}`,
    };
  }

  return { orderId: json.orderId, formUrl: json.formUrl };
}

export async function arcaGetOrderStatusExtended(arcaOrderId: string): Promise<ArcaExtendedStatusResponse> {
  const { userName, password } = getArcaCredentials();
  const body = new URLSearchParams({
    userName,
    password,
    orderId: arcaOrderId,
  });
  return (await postForm("getOrderStatusExtended.do", body)) as ArcaExtendedStatusResponse;
}

export function isArcaDepositSuccess(data: ArcaExtendedStatusResponse): boolean {
  if (Number(data.errorCode ?? -1) !== 0) {
    return false;
  }
  const os = Number(data.orderStatus);
  if (os === 2) {
    return true;
  }
  const ps = data.paymentAmountInfo?.paymentState;
  if (typeof ps === "string" && ps.toUpperCase() === "DEPOSITED") {
    return true;
  }
  return false;
}

export function extractMaskedPan(data: ArcaExtendedStatusResponse): string | undefined {
  const pan = data.cardAuthInfo?.pan;
  if (typeof pan !== "string" || pan.length < 4) {
    return undefined;
  }
  const digits = pan.replace(/\D/g, "");
  return digits.slice(-4);
}
