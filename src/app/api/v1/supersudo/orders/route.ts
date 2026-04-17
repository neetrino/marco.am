import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { isAdminOrderListStatus } from "@/lib/constants/admin-order-list-status";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePage(value: string | null): number {
  const n = value ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE;
  return n;
}

function parseLimit(value: string | null): number {
  const n = value ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export async function GET(req: NextRequest) {
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

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parsePage(searchParams.get("page"));
    const limit = parseLimit(searchParams.get("limit"));
    const rawStatus = searchParams.get("status");
    const status =
      rawStatus && isAdminOrderListStatus(rawStatus) ? rawStatus : undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = searchParams.get('sortOrder') || undefined;

    const filters = {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(paymentStatus && { paymentStatus }),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder: sortOrder as 'asc' | 'desc' }),
    };

    logger.devLog('📦 [ADMIN ORDERS] GET request with filters:', filters);
    const result = await adminService.getOrders(filters);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin orders list error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}

