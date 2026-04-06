import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { getErrorLogFields, toApiError } from "@/lib/types/errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/orders/[id]
 * Get full order details for admin
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
    console.log("📦 [ADMIN ORDERS] GET by id:", id);

    const order = await adminService.getOrderById(id);
    console.log("✅ [ADMIN ORDERS] Order loaded:", id);

    return NextResponse.json(order);
  } catch (error: unknown) {
    console.error("❌ [ADMIN ORDERS] GET Error:", {
      ...getErrorLogFields(error),
      fullError: error,
    });
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * PUT /api/v1/admin/orders/[id]
 * Update an order
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
    console.log("📤 [ADMIN ORDERS] PUT request:", { id, body });

    const order = await adminService.updateOrder(id, body);
    console.log("✅ [ADMIN ORDERS] Order updated:", id);

    return NextResponse.json(order);
  } catch (error: unknown) {
    console.error("❌ [ADMIN ORDERS] PUT Error:", {
      ...getErrorLogFields(error),
      fullError: error,
    });
    return toApiErrorResponse(error, req.url);
  }
}

/**
 * DELETE /api/v1/admin/orders/[id]
 * Delete an order
 * Հեռացնում է պատվերը
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let orderId: string | undefined;

  try {
    // Ստուգում ենք ավտորիզացիան
    console.log("🔐 [ADMIN ORDERS] DELETE - Ստուգվում է ավտորիզացիան...");
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      console.log("❌ [ADMIN ORDERS] DELETE - Մերժված մուտք (403)");
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

    // Ստանում ենք պատվերի ID-ն
    console.log("📋 [ADMIN ORDERS] DELETE - Ստանում ենք params...");
    let resolvedParams;
    try {
      resolvedParams = await params;
      console.log("✅ [ADMIN ORDERS] DELETE - Params ստացված:", resolvedParams);
    } catch (paramsError: unknown) {
      console.error("❌ [ADMIN ORDERS] DELETE - Params սխալ:", {
        error: paramsError,
        ...getErrorLogFields(paramsError),
      });
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Invalid order ID parameter",
      };
    }

    orderId = resolvedParams?.id;
    
    // Validation
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      console.error("❌ [ADMIN ORDERS] DELETE - Invalid orderId:", orderId);
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Order ID is required and must be a valid string",
      };
    }

    console.log("🗑️ [ADMIN ORDERS] DELETE request:", {
      orderId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    // Հեռացնում ենք պատվերը
    console.log("🔄 [ADMIN ORDERS] DELETE - Կանչվում է adminService.deleteOrder...");
    await adminService.deleteOrder(orderId);
    console.log("✅ [ADMIN ORDERS] DELETE - adminService.deleteOrder ավարտված");
    
    const duration = Date.now() - startTime;
    console.log("✅ [ADMIN ORDERS] Order deleted successfully:", {
      orderId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    // Մանրամասն լոգավորում
    console.error("❌ [ADMIN ORDERS] DELETE Error:", {
      orderId: orderId || "unknown",
      ...getErrorLogFields(error),
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    const api = toApiError(error, req.url);
    const statusCode = api.status ?? 500;
    const errorResponse = {
      type: api.type ?? "https://api.shop.am/problems/internal-error",
      title: api.title ?? "Internal Server Error",
      status: statusCode,
      detail:
        api.detail ||
        (error instanceof Error ? error.message : "An error occurred while deleting the order"),
      instance: req.url,
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

