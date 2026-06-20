import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { bannerManagementStorageSchema } from "@/lib/schemas/banner-management.schema";
import { bannerManagementService } from "@/lib/services/banner-management.service";
import { revalidateStorefrontHome } from "@/lib/revalidate-storefront";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/supersudo/banners — full stored banner configuration for admin.
 * PUT — replace configuration (validated). Admin JWT required.
 */
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
        { status: 403 },
      );
    }

    const data = await bannerManagementService.getAdminStorage();
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error("GET /api/v1/supersudo/banners failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}

export async function PUT(req: NextRequest) {
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

    const body: unknown = await req.json();
    const parsed = bannerManagementStorageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid banners payload",
          instance: req.url,
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const saved = await bannerManagementService.updateAdminStorage(parsed.data);
    revalidateStorefrontHome();
    return NextResponse.json(saved);
  } catch (error: unknown) {
    logger.error("PUT /api/v1/supersudo/banners failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
