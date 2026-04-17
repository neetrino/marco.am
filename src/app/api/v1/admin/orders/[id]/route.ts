import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { getErrorLogFields, toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

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
    logger.devLog("📦 [ADMIN ORDERS] GET by id:", id);

    const order = await adminService.getOrderById(id);
    logger.devLog("✅ [ADMIN ORDERS] Order loaded:", id);

    return NextResponse.json(order);
  } catch (error: unknown) {
    logger.error("Admin orders GET error", getErrorLogFields(error));
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
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
    logger.devLog("📤 [ADMIN ORDERS] PUT request:", { id, body });

    const order = await adminService.updateOrder(id, body, {
      actorUserId: user.id,
    });
    logger.devLog("✅ [ADMIN ORDERS] Order updated:", id);

    return NextResponse.json(order);
  } catch (error: unknown) {
    logger.error("Admin orders PUT error", getErrorLogFields(error));
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
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
    logger.devLog("🔐 [ADMIN ORDERS] DELETE - Ստուգվում է ավտորիզացիան...");
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.devLog("❌ [ADMIN ORDERS] DELETE - Մերժված մուտք (403)");
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
    logger.devLog("📋 [ADMIN ORDERS] DELETE - Ստանում ենք params...");
    let resolvedParams;
    try {
      resolvedParams = await params;
      logger.devLog("✅ [ADMIN ORDERS] DELETE - Params ստացված:", resolvedParams);
    } catch (paramsError: unknown) {
      logger.error("Admin orders DELETE params error", getErrorLogFields(paramsError));
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
      logger.error("Admin orders DELETE invalid orderId", { orderId });
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Order ID is required and must be a valid string",
      };
    }

    logger.devLog("🗑️ [ADMIN ORDERS] DELETE request:", {
      orderId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    // Հեռացնում ենք պատվերը
    logger.devLog("🔄 [ADMIN ORDERS] DELETE - Կանչվում է adminService.deleteOrder...");
    await adminService.deleteOrder(orderId);
    logger.devLog("✅ [ADMIN ORDERS] DELETE - adminService.deleteOrder ավարտված");
    
    const duration = Date.now() - startTime;
    logger.devLog("✅ [ADMIN ORDERS] Order deleted successfully:", {
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
    logger.error("Admin orders DELETE error", {
      ...getErrorLogFields(error),
      orderId: orderId ?? "unknown",
      durationMs: duration,
    });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}

