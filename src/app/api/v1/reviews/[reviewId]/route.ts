import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * PUT /api/v1/reviews/[reviewId]
 * Update an existing review
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    logger.devLog("📝 [REVIEWS API] PUT blocked (reviews disabled):", { reviewId });
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
    const err = error as { status?: number; type?: string; title?: string; detail?: string; message?: string };
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE /api/v1/reviews/[reviewId]
 * Delete a review
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    logger.devLog("📝 [REVIEWS API] DELETE blocked (reviews disabled):", { reviewId });
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
    const err = error as { status?: number; type?: string; title?: string; detail?: string; message?: string };
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}

