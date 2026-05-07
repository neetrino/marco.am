import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { normalizeProductClass } from "@/lib/constants/product-class";
import { logger } from "@/lib/utils/logger";

function isValidAttributeIds(attributeIds: unknown): attributeIds is string[] {
  return (
    Array.isArray(attributeIds) &&
    attributeIds.every((id) => typeof id === "string" && id.trim().length > 0)
  );
}

function hasValidVariantOptions(variant: unknown): boolean {
  if (!variant || typeof variant !== "object") {
    return false;
  }
  const options = (variant as { options?: unknown }).options;
  if (options === undefined) {
    return true;
  }
  if (!Array.isArray(options)) {
    return false;
  }
  return options.every((option) => {
    if (!option || typeof option !== "object") {
      return false;
    }
    const optionData = option as { valueId?: unknown; attributeKey?: unknown; value?: unknown };
    if (typeof optionData.valueId === "string" && optionData.valueId.trim().length > 0) {
      return true;
    }
    return (
      typeof optionData.attributeKey === "string" &&
      optionData.attributeKey.trim().length > 0 &&
      typeof optionData.value === "string" &&
      optionData.value.trim().length > 0
    );
  });
}

/**
 * GET /api/v1/supersudo/products/[id]
 * Get a single product by ID
 */
export async function GET(
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
    const product = await adminService.getProductById(id);

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] GET [id] Error:", error);
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

/**
 * PUT /api/v1/supersudo/products/[id]
 * Update a product
 */
export async function PUT(
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

    if (body.productClass !== undefined && normalizeProductClass(body.productClass) === null) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'productClass' must be one of: retail, wholesale",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (body.attributeIds !== undefined && !isValidAttributeIds(body.attributeIds)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'attributeIds' must be an array of non-empty strings",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (Array.isArray(body.variants)) {
      for (const [index, variant] of body.variants.entries()) {
        const variantClass = typeof variant === "object" && variant !== null
          ? (variant as { productClass?: unknown }).productClass
          : undefined;
        if (variantClass !== undefined && normalizeProductClass(variantClass) === null) {
          return NextResponse.json(
            {
              type: "https://api.shop.am/problems/validation-error",
              title: "Validation Error",
              status: 400,
              detail: `Field 'variants[${index}].productClass' must be one of: retail, wholesale`,
              instance: req.url,
            },
            { status: 400 }
          );
        }

        if (!hasValidVariantOptions(variant)) {
          return NextResponse.json(
            {
              type: "https://api.shop.am/problems/validation-error",
              title: "Validation Error",
              status: 400,
              detail:
                `Field 'variants[${index}].options' must be an array of option objects with either 'valueId' or ('attributeKey' + 'value')`,
              instance: req.url,
            },
            { status: 400 }
          );
        }
      }
    }

    logger.devLog("📤 [ADMIN PRODUCTS] PUT request:", { 
      id, 
      bodyKeys: Object.keys(body),
      hasVariants: !!body.variants,
      variantsCount: body.variants?.length || 0,
      body: JSON.stringify(body, null, 2) 
    });

    const product = await adminService.updateProduct(id, body);
    logger.devLog("✅ [ADMIN PRODUCTS] Product updated:", { id, productId: product?.id });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] PUT Error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
      type: error?.type,
      title: error?.title,
      status: error?.status,
      detail: error?.detail,
      fullError: error,
    });
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

/**
 * DELETE /api/v1/supersudo/products/[id]
 * Delete a product (soft delete)
 */
export async function DELETE(
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
    logger.devLog("🗑️ [ADMIN PRODUCTS] DELETE request:", id);

    await adminService.deleteProduct(id);
    logger.devLog("✅ [ADMIN PRODUCTS] Product deleted:", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] DELETE Error:", error);
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

