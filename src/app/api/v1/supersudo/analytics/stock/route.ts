import { NextRequest, NextResponse } from "next/server";

import { jsonErrorResponse } from "@/lib/api/json-error-response";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants/low-stock-threshold";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

const STOCK_ANALYTICS_LIMIT_DEFAULT = 50;
const STOCK_ANALYTICS_LIMIT_MAX = 200;
const STOCK_ANALYTICS_THRESHOLD_MIN = 2;
const STOCK_ANALYTICS_THRESHOLD_MAX = 999;
const STOCK_ANALYTICS_OFFSET_MAX = 10_000;

function validationError(detail: string, instance: string): NextResponse {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      status: 400,
      detail,
      instance,
    },
    { status: 400 }
  );
}

/**
 * GET /api/v1/supersudo/analytics/stock
 * Out-of-stock and low-stock variant lists (published variants, non-deleted products).
 *
 * Query: `locale` (default `en`), `threshold` (default 10, min 2),
 * `limit` (default 50, max 200), `offset` (default 0).
 */
export async function GET(req: NextRequest) {
  const instance = req.url;

  try {
    const user = await authenticateToken(req);

    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const localeRaw = searchParams.get("locale") ?? "en";
    const locale = (localeRaw.trim().slice(0, 16) || "en").toLowerCase();
    if (!/^[a-z]{2}([-_][a-z0-9]{2,8})?$/.test(locale)) {
      return validationError(
        "Parameter 'locale' must be a valid locale tag (e.g. en, hy, ru)",
        instance
      );
    }

    const thresholdParam = searchParams.get("threshold");
    let lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD;
    if (thresholdParam !== null && thresholdParam !== "") {
      lowStockThreshold = parseInt(thresholdParam, 10);
      if (
        Number.isNaN(lowStockThreshold) ||
        lowStockThreshold < STOCK_ANALYTICS_THRESHOLD_MIN ||
        lowStockThreshold > STOCK_ANALYTICS_THRESHOLD_MAX
      ) {
        return validationError(
          `Parameter 'threshold' must be an integer between ${STOCK_ANALYTICS_THRESHOLD_MIN} and ${STOCK_ANALYTICS_THRESHOLD_MAX}`,
          instance
        );
      }
    }

    const limitParam = searchParams.get("limit");
    let limit = STOCK_ANALYTICS_LIMIT_DEFAULT;
    if (limitParam !== null && limitParam !== "") {
      limit = parseInt(limitParam, 10);
      if (Number.isNaN(limit) || limit < 1 || limit > STOCK_ANALYTICS_LIMIT_MAX) {
        return validationError(
          `Parameter 'limit' must be an integer between 1 and ${STOCK_ANALYTICS_LIMIT_MAX}`,
          instance
        );
      }
    }

    const offsetParam = searchParams.get("offset");
    let offset = 0;
    if (offsetParam !== null && offsetParam !== "") {
      offset = parseInt(offsetParam, 10);
      if (Number.isNaN(offset) || offset < 0 || offset > STOCK_ANALYTICS_OFFSET_MAX) {
        return validationError(
          `Parameter 'offset' must be an integer between 0 and ${STOCK_ANALYTICS_OFFSET_MAX}`,
          instance
        );
      }
    }

    const result = await adminService.getStockAnalytics({
      locale,
      lowStockThreshold,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin stock analytics error", { error });
    return jsonErrorResponse(error, instance);
  }
}
