import { NextRequest, NextResponse } from "next/server";
import { parseIsoDate, type DiscountKind } from "@/lib/discount/discount-expiry";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { invalidateAdminProductDiscountsCache } from "@/lib/services/admin/admin-products-read/product-discounts-list";
import { revalidateStorefrontHome } from "@/lib/revalidate-storefront";
import { logger } from "@/lib/utils/logger";

const DISCOUNT_TYPES: readonly DiscountKind[] = ["NONE", "PERCENT", "AMOUNT"];
const PERCENT_MAX = 100;

function validationError(req: NextRequest, detail: string): NextResponse {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      status: 400,
      detail,
      instance: req.url,
    },
    { status: 400 },
  );
}

type ProblemError = {
  status?: number;
  type?: string;
  title?: string;
  detail?: string;
  message?: string;
};

function toProblemError(error: unknown): ProblemError {
  if (error && typeof error === "object") {
    return error as ProblemError;
  }
  return { message: String(error) };
}

type ParsedDiscount =
  | {
      ok: true;
      discountType: DiscountKind;
      discountValue: number | null;
      discountExpiresAt: string | null;
    }
  | { ok: false; response: NextResponse };

function parseDiscountBody(req: NextRequest, body: Record<string, unknown>): ParsedDiscount {
  const discountType = body.discountType;
  if (typeof discountType !== "string" || !DISCOUNT_TYPES.includes(discountType as DiscountKind)) {
    return { ok: false, response: validationError(req, "discountType must be one of NONE, PERCENT, AMOUNT") };
  }

  const rawValue = body.discountValue;
  const discountValue = rawValue === null || rawValue === undefined ? null : Number(rawValue);

  if (
    discountType === "PERCENT" &&
    (discountValue === null || !Number.isFinite(discountValue) || discountValue < 0 || discountValue > PERCENT_MAX)
  ) {
    return { ok: false, response: validationError(req, "discountValue must be a number between 0 and 100 for PERCENT") };
  }
  if (
    discountType === "AMOUNT" &&
    (discountValue === null || !Number.isFinite(discountValue) || discountValue <= 0)
  ) {
    return { ok: false, response: validationError(req, "discountValue must be a positive number for AMOUNT") };
  }

  const rawExpires = body.discountExpiresAt;
  const discountExpiresAt = rawExpires === undefined || rawExpires === null ? null : parseIsoDate(rawExpires);
  if (rawExpires !== undefined && rawExpires !== null && !discountExpiresAt) {
    return { ok: false, response: validationError(req, "discountExpiresAt must be a valid ISO date string or null") };
  }

  return {
    ok: true,
    discountType: discountType as DiscountKind,
    discountValue: discountType === "NONE" ? null : discountValue,
    discountExpiresAt,
  };
}

/**
 * PATCH /api/v1/supersudo/products/[id]/discount
 * Updates the product-level discount (PERCENT off, AMOUNT final price, or NONE).
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
    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseDiscountBody(req, body);
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await adminService.updateProductDiscount(id, {
      discountType: parsed.discountType,
      discountValue: parsed.discountValue,
      discountExpiresAt: parsed.discountExpiresAt,
    });

    await invalidateAdminProductDiscountsCache();
    revalidateStorefrontHome();
    return NextResponse.json({
      success: true,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountExpiresAt: result.discountExpiresAt,
    });
  } catch (error: unknown) {
    logger.error("[ADMIN PRODUCTS] PATCH discount error", error);
    const problem = toProblemError(error);
    const status = problem.status ?? 500;
    return NextResponse.json(
      {
        type: problem.type ?? "https://api.shop.am/problems/internal-error",
        title: problem.title ?? "Internal Server Error",
        status,
        detail: problem.detail ?? problem.message ?? "An error occurred",
        instance: req.url,
      },
      { status }
    );
  }
}
