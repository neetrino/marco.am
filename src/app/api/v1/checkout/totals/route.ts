import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateToken } from "@/lib/middleware/auth";
import { checkoutTotalsService } from "@/lib/services/checkout-totals.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

const bodySchema = z.object({
  shippingMethod: z.enum(["pickup", "courier", "delivery"]),
  city: z.string().optional(),
  country: z.string().optional(),
  cartId: z.string().optional(),
  couponCode: z.string().trim().min(1).max(64).optional(),
  customerEmail: z.string().email().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

/**
 * POST /api/v1/checkout/totals
 * Dynamic subtotal (from cart DB rules) + shipping + order total in AMD.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: parsed.error.flatten().fieldErrors,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const locale =
      user?.locale ??
      req.headers.get("accept-language")?.split(",")[0]?.trim().split("-")[0] ??
      "en";

    if (user) {
      const result = await checkoutTotalsService.compute({
        userId: user.id,
        locale,
        cartId: body.cartId,
        couponCode: body.couponCode,
        shippingMethod: body.shippingMethod,
        city: body.city,
        country: body.country,
      });
      return NextResponse.json(result);
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Guest checkout requires a non-empty items array",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await checkoutTotalsService.compute({
      locale,
      guestItems: body.items,
      couponCode: body.couponCode,
      customerEmail: body.customerEmail,
      shippingMethod: body.shippingMethod,
      city: body.city,
      country: body.country,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Checkout totals error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}
