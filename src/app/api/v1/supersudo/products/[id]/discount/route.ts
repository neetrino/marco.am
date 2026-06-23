import { NextRequest, NextResponse } from "next/server";
import { parseIsoDate } from "@/lib/discount/discount-expiry";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { invalidateAdminProductDiscountsCache } from "@/lib/services/admin/admin-products-read/product-discounts-list";
import { revalidateStorefrontHome } from "@/lib/revalidate-storefront";
import { logger } from "@/lib/utils/logger";

/**
 * PATCH /api/v1/supersudo/products/[id]/discount
 * Update product discount percentage
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const discountPercent = body.discountPercent;
    const discountExpiresAt =
      body.discountExpiresAt === undefined
        ? undefined
        : parseIsoDate(body.discountExpiresAt);

    logger.devLog("💰 [ADMIN PRODUCTS] PATCH discount request:", { 
      id, 
      body, 
      discountPercent, 
      type: typeof discountPercent 
    });

    if (typeof discountPercent !== "number" || discountPercent < 0 || discountPercent > 100) {
      console.error("❌ [ADMIN PRODUCTS] Invalid discountPercent:", discountPercent);
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "discountPercent must be a number between 0 and 100",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (body.discountExpiresAt !== undefined && body.discountExpiresAt !== null && !discountExpiresAt) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "discountExpiresAt must be a valid ISO date string or null",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.devLog("💰 [ADMIN PRODUCTS] Calling updateProductDiscount:", {
      id,
      discountPercent,
      discountExpiresAt,
    });

    const result = await adminService.updateProductDiscount(
      id,
      discountPercent,
      discountExpiresAt ?? null,
    );
    logger.devLog("✅ [ADMIN PRODUCTS] Product discount updated:", { id, result });

    await invalidateAdminProductDiscountsCache();
    revalidateStorefrontHome();
    return NextResponse.json({
      success: true,
      discountPercent: result.discountPercent,
      discountExpiresAt: result.discountExpiresAt,
    });
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] PATCH discount Error:", error);
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 }
    );
  }
}

