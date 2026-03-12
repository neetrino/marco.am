import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminBannersService } from "@/lib/services/admin/admin-banners.service";

/**
 * GET /api/v1/admin/banners/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const data = await adminBannersService.getById(id);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "not-found", title: "Error", status: err.status || 500, detail: err.detail || "Not found" },
      { status: err.status || 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/banners/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await req.json();
    const data = await adminBannersService.update(id, {
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl,
      position: body.position,
      active: body.active,
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "validation", title: "Error", status: err.status || 500, detail: err.detail || "Failed to update" },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/banners/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "forbidden", title: "Forbidden", status: 403, detail: "Admin required" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await adminBannersService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string };
    return NextResponse.json(
      { type: "not-found", title: "Error", status: err.status || 500, detail: err.detail || "Failed to delete" },
      { status: err.status || 500 }
    );
  }
}
