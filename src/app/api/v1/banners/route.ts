import { NextResponse } from "next/server";
import { getActiveBanners } from "@/lib/services/banners.service";

/**
 * GET /api/v1/banners
 * Public: list active banners for homepage.
 */
export async function GET() {
  try {
    const banners = await getActiveBanners();
    return NextResponse.json({ data: banners });
  } catch (error) {
    console.error("[BANNERS]", error);
    return NextResponse.json(
      { type: "internal", title: "Error", status: 500, detail: "Failed to load banners" },
      { status: 500 }
    );
  }
}
