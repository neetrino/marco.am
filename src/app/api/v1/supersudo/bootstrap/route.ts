import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { withApiRouteMetrics } from "@/lib/observability/api-route-metrics";
import {
  buildAdminBootstrap,
  parseAdminBootstrapPaths,
} from "@/lib/services/admin/admin-bootstrap.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/supersudo/bootstrap?paths=dashboard,discounts&lang=en
 * Collapses multi-fetch admin cold loads into one HTTP round-trip.
 */
export async function GET(req: NextRequest) {
  return withApiRouteMetrics(
    "/api/v1/supersudo/bootstrap",
    "GET",
    async () => {
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
            { status: 403 },
          );
        }

        const { searchParams } = new URL(req.url);
        const paths = parseAdminBootstrapPaths(searchParams.get("paths"));
        if (paths.length === 0) {
          return NextResponse.json(
            {
              type: "https://api.shop.am/problems/validation-error",
              title: "Validation Error",
              status: 400,
              detail: "Query param paths is required (e.g. paths=dashboard or paths=discounts)",
              instance: req.url,
            },
            { status: 400 },
          );
        }

        const locale = searchParams.get("lang") ?? "en";
        logger.devLog("[ADMIN BOOTSTRAP] paths", { paths, locale, userId: user.id });

        const payload = await buildAdminBootstrap(paths, locale);
        return NextResponse.json(payload);
      } catch (error: unknown) {
        logger.error("Admin bootstrap GET error", { error, url: req.url });
        return toApiErrorResponse(error, req.url);
      }
    },
    (res) => res.status,
  );
}
