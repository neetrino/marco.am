import { db } from "@white-shop/db";
import { registerArcaPayment } from "@/lib/payments/arca/client";
import { assertArcaConfigured, resolveArcaConfig } from "@/lib/payments/arca/config";
import { buildArcaMerchantOrderNumber } from "@/lib/payments/arca/order-number";
import {
  assertIdramConfigured,
  formatIdramAmount,
  resolveIdramConfig,
} from "@/lib/payments/idram/config";
import {
  buildIdramStartUrl,
  getArcaMerchantCallbackUrls,
} from "@/lib/payments/payment-urls";
import { logger } from "@/lib/utils/logger";
import type { CheckoutPaymentMethodId } from "@/lib/constants/checkout-payment-method";

type StartResult = {
  paymentUrl: string | null;
  expiresAt: string | null;
  nextAction: "view_order" | "redirect_to_payment";
};

/**
 * After checkout creates order+payment, starts provider session when needed.
 */
export async function startOnlinePaymentIfNeeded(input: {
  paymentMethod: CheckoutPaymentMethodId;
  orderId: string;
  orderNumber: string;
  amount: number;
  locale: string;
  paymentId: string;
}): Promise<StartResult> {
  if (input.paymentMethod === "cash") {
    return { paymentUrl: null, expiresAt: null, nextAction: "view_order" };
  }

  if (input.paymentMethod === "idram") {
    const config = resolveIdramConfig();
    assertIdramConfigured(config);
    const paymentUrl = buildIdramStartUrl(input.orderNumber);
    await db.payment.update({
      where: { id: input.paymentId },
      data: {
        providerResponse: {
          channel: "idram",
          amount: formatIdramAmount(input.amount),
          testMode: config.testMode,
          devMock: config.devMock,
        },
      },
    });
    return {
      paymentUrl,
      expiresAt: null,
      nextAction: "redirect_to_payment",
    };
  }

  if (input.paymentMethod === "arca") {
    const config = resolveArcaConfig();
    assertArcaConfigured(config);
    const urls = getArcaMerchantCallbackUrls();
    const merchantOrderNumber = buildArcaMerchantOrderNumber(
      input.orderNumber,
      input.paymentId,
    );
    const registered = await registerArcaPayment({
      orderNumber: merchantOrderNumber,
      amountAmd: input.amount,
      returnUrl: urls.returnUrl,
      failUrl: urls.failUrl,
      description: `Order ${input.orderNumber}`,
      language: input.locale,
    });

    await db.payment.update({
      where: { id: input.paymentId },
      data: {
        providerTransactionId: registered.orderId,
        providerResponse: {
          channel: "arca",
          formUrl: registered.formUrl,
          merchantOrderNumber,
          shopOrderNumber: input.orderNumber,
          testMode: config.testMode,
        },
      },
    });

    logger.info("ArCa payment registered", {
      orderNumber: input.orderNumber,
      merchantOrderNumber,
      bankOrderId: registered.orderId,
    });

    return {
      paymentUrl: registered.formUrl,
      expiresAt: null,
      nextAction: "redirect_to_payment",
    };
  }

  return { paymentUrl: null, expiresAt: null, nextAction: "view_order" };
}
