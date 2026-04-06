import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { getErrorLogFields } from "@/lib/types/errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/products/[id]
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
  } catch (error: unknown) {
    console.error("❌ [ADMIN PRODUCTS] GET [id] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * PUT /api/v1/admin/products/[id]
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
    console.log("📤 [ADMIN PRODUCTS] PUT request:", { 
      id, 
      bodyKeys: Object.keys(body),
      hasVariants: !!body.variants,
      variantsCount: body.variants?.length || 0,
      body: JSON.stringify(body, null, 2) 
    });

    const product = await adminService.updateProduct(id, body);
    console.log("✅ [ADMIN PRODUCTS] Product updated:", { id, productId: product?.id });

    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error("❌ [ADMIN PRODUCTS] PUT Error:", {
      ...getErrorLogFields(error),
      fullError: error,
    });
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * DELETE /api/v1/admin/products/[id]
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
    console.log("🗑️ [ADMIN PRODUCTS] DELETE request:", id);

    await adminService.deleteProduct(id);
    console.log("✅ [ADMIN PRODUCTS] Product deleted:", id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("❌ [ADMIN PRODUCTS] DELETE Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

