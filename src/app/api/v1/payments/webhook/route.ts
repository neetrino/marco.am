import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { toApiError } from "@/lib/types/errors";
import { processPaymentWebhook, verifyWebhookSignature } from "@/lib/services/payment-psp.service";

const PSP_SIGNATURE_HEADER = "x-psp-signature";
const DEV_FALLBACK_WEBHOOK_SECRET = "dev-psp-webhook-secret";

function getWebhookSecret(): string {
  const explicitSecret = process.env.PAYMENT_PSP_WEBHOOK_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (jwtSecret) {
      logger.warn("PAYMENT_PSP_WEBHOOK_SECRET is missing, falling back to JWT_SECRET in non-production");
      return jwtSecret;
    }
    logger.warn(
      "PAYMENT_PSP_WEBHOOK_SECRET and JWT_SECRET are missing, using development webhook fallback secret"
    );
    return DEV_FALLBACK_WEBHOOK_SECRET;
  }

  throw {
    status: 503,
    type: "https://api.shop.am/problems/internal-error",
    title: "Service Unavailable",
    detail: "PAYMENT_PSP_WEBHOOK_SECRET is not configured",
  };
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get(PSP_SIGNATURE_HEADER);
    if (!signature) {
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Unauthorized",
        detail: `Missing ${PSP_SIGNATURE_HEADER} header`,
      };
    }

    const rawBody = await req.text();
    const secret = getWebhookSecret();
    const isValid = verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Unauthorized",
        detail: "Invalid PSP webhook signature",
      };
    }

    const payload = JSON.parse(rawBody) as unknown;
    const result = await processPaymentWebhook(payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    logger.error("PSP webhook error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}

