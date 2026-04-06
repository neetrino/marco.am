import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { categoriesService } from "@/lib/services/categories.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const result = await categoriesService.findBySlug(slug, lang);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [CATEGORIES] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

