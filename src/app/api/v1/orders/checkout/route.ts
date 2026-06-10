import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateToken } from "@/lib/middleware/auth";
import { withApiRouteMetrics } from "@/lib/observability/api-route-metrics";
import { ordersService } from "@/lib/services/orders.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

const checkoutBodySchema = z
  .object({
    cartId: z.string().min(1).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          variantId: z.string().min(1),
          quantity: z.number().int().positive(),
        }),
      )
      .optional(),
    email: z.string().email(),
    phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    notes: z.string().trim().max(2000).optional(),
    shippingAddress: z
      .object({
        firstName: z.string().trim().optional(),
        lastName: z.string().trim().optional(),
        addressLine1: z.string().trim().optional(),
        address: z.string().trim().optional(),
        pickupBranchId: z.string().trim().optional(),
        addressLine2: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        postalCode: z.string().trim().optional(),
        countryCode: z.string().trim().optional(),
        phone: z.string().trim().optional(),
      })
      .optional(),
    couponCode: z.string().trim().min(1).max(64).optional(),
    shippingMethod: z.string().min(1).optional(),
    paymentMethod: z.string().min(1).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    "/api/v1/orders/checkout",
    "POST",
    async () => {
      try {
        logger.info("Checkout request received");
        const user = await authenticateToken(req);
        const raw = await req.json();
        const parsed = checkoutBodySchema.safeParse(raw);
        if (!parsed.success) {
          return NextResponse.json(
            {
              type: "https://api.shop.am/problems/validation-error",
              title: "Validation Error",
              status: 400,
              detail: parsed.error.flatten().fieldErrors,
              instance: req.url,
            },
            {
              status: 400,
              headers: {
                "X-Route-Duration-Ms": String(Date.now() - startedAt),
              },
            },
          );
        }
        const data = parsed.data;
        const acceptLang =
          req.headers.get("accept-language")?.split(",")[0]?.trim().split("-")[0] ??
          "en";
        const checkoutLocale = user?.locale ?? acceptLang;

        logger.debug("Checkout data", {
          userId: user?.id,
          cartId: data.cartId,
          itemsCount: data.items?.length || 0,
          paymentMethod: data.paymentMethod,
          shippingMethod: data.shippingMethod,
        });

        const result = await ordersService.checkout(data, user?.id, checkoutLocale);

        logger.info("Checkout successful", {
          orderNumber: result.order?.number,
          orderId: result.order?.id,
          total: result.order?.total,
        });

        return NextResponse.json(result, {
          status: 201,
          headers: {
            "X-Route-Duration-Ms": String(Date.now() - startedAt),
          },
        });
      } catch (error: unknown) {
        logger.error("Checkout error", { error });
        if (error instanceof Error) {
          logger.error("Checkout error details", {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
        }
        const apiError = toApiError(error, req.url);
        return NextResponse.json(apiError, {
          status: apiError.status || 500,
          headers: {
            "X-Route-Duration-Ms": String(Date.now() - startedAt),
          },
        });
      }
    },
    (res) => res.status,
  );
}
