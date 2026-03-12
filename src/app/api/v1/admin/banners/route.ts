import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminBannersService } from "@/lib/services/admin/admin-banners.service";

/**
 * GET /api/v1/admin/banners — list all banners
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const list = await adminBannersService.list();
    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "internal", title: "Error", status: 500, detail: err.detail || "Failed to list banners" },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST /api/v1/admin/banners — create banner
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = await adminBannersService.create({
      title: body.title ?? null,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl ?? null,
      position: body.position ?? 0,
      active: body.active ?? true,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "validation", title: "Error", status: err.status || 500, detail: err.detail || "Failed to create" },
      { status: err.status || 500 }
    );
  }
}
