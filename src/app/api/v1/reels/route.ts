import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { getReels } from "@/lib/services/reels.service";

/**
 * GET /api/v1/reels
 * Public: list active reels for feed. If user is logged in, includes userLiked.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const reels = await getReels(user?.id);
    return NextResponse.json({ data: reels });
  } catch (error) {
    console.error("[REELS]", error);
    return NextResponse.json(
      { type: "internal", title: "Error", status: 500, detail: "Failed to load reels" },
      { status: 500 }
    );
  }
}
