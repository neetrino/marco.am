import { logger } from "../utils/logger";
import { getPublicAppUrl } from "../config/deployment-env";

type DeliveryStatus = "sent" | "skipped" | "failed";

interface DeliveryChannelResult {
  status: DeliveryStatus;
  detail: string;
}

interface OrderConfirmationDeliveryResult {
  email: DeliveryChannelResult;
  sms: DeliveryChannelResult;
}

interface OrderConfirmationPayload {
  orderNumber: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function maskEmail(email: string): string {
  return email.replace(/(^.).*(@.*$)/, "$1***$2");
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})\d+(\d{2})$/, "$1***$2");
}

function formatOrderConfirmationEmailText(
  orderNumber: string,
  total: number,
  currency: string
): string {
  const origin = getPublicAppUrl();
  return [
    `Your order has been confirmed.`,
    `Order number: ${orderNumber}`,
    `Total: ${total} ${currency}`,
    "",
    `You can track your order at ${origin}/orders/${orderNumber}`,
  ].join("\n");
}

async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number,
  currency: string
): Promise<DeliveryChannelResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    logger.warn(
      "Order confirmation email skipped: Resend is not configured",
      { to: maskEmail(email), orderNumber }
    );
    return {
      status: "skipped",
      detail: "resend_not_configured",
    };
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Order confirmation #${orderNumber}`,
      text: formatOrderConfirmationEmailText(orderNumber, total, currency),
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    logger.error("Order confirmation email failed", {
      status: response.status,
      responseText,
      to: maskEmail(email),
      orderNumber,
    });
    return {
      status: "failed",
      detail: "email_provider_error",
    };
  }

  logger.info("Order confirmation email sent", {
    to: maskEmail(email),
    orderNumber,
  });
  return {
    status: "sent",
    detail: "delivered_by_resend",
  };
}

function sendOrderConfirmationSms(
  phone: string,
  orderNumber: string
): DeliveryChannelResult {
  logger.warn("Order confirmation SMS skipped: provider is not configured", {
    to: maskPhone(phone),
    orderNumber,
  });
  return {
    status: "skipped",
    detail: "sms_provider_not_configured",
  };
}

export async function deliverOrderConfirmation(
  payload: OrderConfirmationPayload
): Promise<OrderConfirmationDeliveryResult> {
  const { customerEmail, customerPhone, orderNumber, total, currency } = payload;

  let email: DeliveryChannelResult = {
    status: "skipped",
    detail: "email_missing",
  };
  if (typeof customerEmail === "string" && customerEmail.trim().length > 0) {
    try {
      email = await sendOrderConfirmationEmail(
        customerEmail.trim(),
        orderNumber,
        total,
        currency
      );
    } catch (error: unknown) {
      logger.error("Order confirmation email delivery crashed", {
        orderNumber,
        error,
      });
      email = {
        status: "failed",
        detail: "email_delivery_exception",
      };
    }
  }

  const sms =
    typeof customerPhone === "string" && customerPhone.trim().length > 0
      ? sendOrderConfirmationSms(customerPhone.trim(), orderNumber)
      : {
          status: "skipped" as const,
          detail: "phone_missing",
        };

  return {
    email,
    sms,
  };
}
