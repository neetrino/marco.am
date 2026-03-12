import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { toggleReelLike } from "@/lib/services/reels.service";

/**
 * POST /api/v1/reels/[id]/like
 * Toggle like for a reel. Requires auth.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication required",
        },
        { status: 401 }
      );
    }
    const { id: reelId } = await params;
    const result = await toggleReelLike(reelId, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; type?: string; title?: string; detail?: string };
    return NextResponse.json(
      {
        type: err.type || "internal",
        title: err.title || "Error",
        status: err.status || 500,
        detail: err.detail || "Failed to toggle like",
      },
      { status: err.status || 500 }
    );
  }
}
