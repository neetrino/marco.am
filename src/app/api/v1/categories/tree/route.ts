import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { categoriesService } from "@/lib/services/categories.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const result = await categoriesService.getTree(lang);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [CATEGORIES] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

