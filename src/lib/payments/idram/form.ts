import {
  assertIdramConfigured,
  formatIdramAmount,
  resolveIdramConfig,
} from "@/lib/payments/idram/config";
import { db } from "@white-shop/db";

const IDRAM_LANG_MAP: Record<string, string> = {
  hy: "AM",
  am: "AM",
  ru: "RU",
  en: "EN",
};

export type IdramFormPayload = {
  formAction: string;
  formData: Record<string, string>;
};

/**
 * Builds Idram GetPayment form fields for an order.
 */
export async function buildIdramPaymentForm(orderNumber: string): Promise<IdramFormPayload> {
  const config = resolveIdramConfig();
  assertIdramConfigured(config);

  const order = await db.order.findUnique({
    where: { number: orderNumber },
    include: {
      payments: {
        where: { provider: "idram" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order || order.payments.length === 0) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Not Found",
      detail: "Idram payment order was not found",
    };
  }

  if (order.paymentStatus === "paid") {
    throw {
      status: 409,
      type: "https://api.shop.am/problems/conflict",
      title: "Conflict",
      detail: "Order is already paid",
    };
  }

  const amount = formatIdramAmount(Number(order.total));
  const language =
    IDRAM_LANG_MAP[order.customerLocale.trim().toLowerCase().slice(0, 2)] ?? "EN";

  if (config.devMock) {
    return {
      formAction: `/api/v1/payments/idram/mock-complete?order=${encodeURIComponent(orderNumber)}`,
      formData: {
        EDP_BILL_NO: orderNumber,
        EDP_AMOUNT: amount,
      },
    };
  }

  return {
    formAction: config.getPaymentUrl,
    formData: {
      EDP_LANGUAGE: language,
      EDP_REC_ACCOUNT: config.recAccount,
      EDP_DESCRIPTION: `Order ${orderNumber}`,
      EDP_AMOUNT: amount,
      EDP_BILL_NO: orderNumber,
    },
  };
}

export function renderAutoSubmitHtml(payload: IdramFormPayload): string {
  const inputs = Object.entries(payload.formData)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to Idram…</title>
</head>
<body>
  <p>Redirecting to Idram…</p>
  <form id="idram" method="post" action="${escapeHtml(payload.formAction)}">
    ${inputs}
  </form>
  <script>document.getElementById("idram").submit();</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
