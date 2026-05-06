import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products/[slug]/reviews
 * Get all reviews for a product (by slug)
 * Query params:
 *   - my=true: Get current user's review (requires authentication)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    logger.devLog("📝 [REVIEWS API] GET disabled, returning empty payload:", { slug });
    return NextResponse.json({
      reviews: [],
      aggregate: {
        averageRating: 0,
        reviewCount: 0,
        distribution: [
          { star: 5, count: 0, percentage: 0 },
          { star: 4, count: 0, percentage: 0 },
          { star: 3, count: 0, percentage: 0 },
          { star: 2, count: 0, percentage: 0 },
          { star: 1, count: 0, percentage: 0 },
        ],
      },
    });
  } catch (error: unknown) {
    const e = error as {
      type?: string;
      title?: string;
      status?: number;
      detail?: string;
      message?: string;
    };
    logger.error("REVIEWS API GET error", { detail: e.detail ?? e.message });
    return NextResponse.json(
      {
        type: e.type || "https://api.shop.am/problems/internal-error",
        title: e.title || "Internal Server Error",
        status: e.status || 500,
        detail: e.detail || e.message || "An error occurred",
        instance: req.url,
      },
      { status: e.status || 500 }
    );
  }
}

/**
 * POST /api/v1/products/[slug]/reviews
 * Create a new review for a product (by slug)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    logger.devLog("📝 [REVIEWS API] POST blocked (reviews disabled):", { slug });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/gone",
        title: "Reviews disabled",
        status: 410,
        detail: "Product reviews are disabled",
        instance: req.url,
      },
      { status: 410 }
    );
  } catch (error: unknown) {
    const e = error as {
      type?: string;
      title?: string;
      status?: number;
      detail?: string;
      message?: string;
    };
    logger.error("REVIEWS API POST error", { detail: e.detail ?? e.message });
    return NextResponse.json(
      {
        type: e.type || "https://api.shop.am/problems/internal-error",
        title: e.title || "Internal Server Error",
        status: e.status || 500,
        detail: e.detail || e.message || "An error occurred",
        instance: req.url,
      },
      { status: e.status || 500 }
    );
  }
}

