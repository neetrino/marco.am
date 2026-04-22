import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { reelsViewsService } from "@/lib/services/reels-views.service";
import { logger } from "@/lib/utils/logger";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * POST /api/v1/reels/{id}/view
 * Public endpoint: increments views counter for visible reels.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const payload = await reelsViewsService.registerView({ reelId: id });
    return NextResponse.json(payload);
  } catch (error: unknown) {
    logger.error("POST /api/v1/reels/[id]/view failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
