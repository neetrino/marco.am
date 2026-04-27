import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import { prepareRasterForR2Upload } from "@/lib/utils/prepare-raster-for-r2-upload";
import { logger } from "@/lib/utils/logger";

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  return { mime, buffer };
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        { type: "https://api.shop.am/problems/forbidden", title: "Forbidden", status: 403, detail: "Admin access required", instance: req.url },
        { status: 403 },
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { type: "https://api.shop.am/problems/config-error", title: "Storage not configured", status: 503, detail: "R2 is not configured", instance: req.url },
        { status: 503 },
      );
    }

    let body: { image?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { type: "https://api.shop.am/problems/validation-error", title: "Validation Error", status: 400, detail: "Invalid JSON", instance: req.url },
        { status: 400 },
      );
    }

    if (typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
      return NextResponse.json(
        { type: "https://api.shop.am/problems/validation-error", title: "Validation Error", status: 400, detail: "Field 'image' must be a valid base64 image (data:image/...)", instance: req.url },
        { status: 400 },
      );
    }

    const parsed = parseDataUrl(body.image);
    if (!parsed) {
      return NextResponse.json(
        { type: "https://api.shop.am/problems/validation-error", title: "Validation Error", status: 400, detail: "Invalid data URL", instance: req.url },
        { status: 400 },
      );
    }

    const prepared = await prepareRasterForR2Upload(parsed.buffer, parsed.mime);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const key = `banners/${date}-${nanoid(10)}.${prepared.extension}`;
    const url = await uploadToR2(key, prepared.buffer, prepared.contentType);

    if (!url) {
      logger.error("Banner upload: R2 upload failed", { key });
      return NextResponse.json(
        { type: "https://api.shop.am/problems/internal-error", title: "Upload failed", status: 500, detail: "Failed to upload image to storage", instance: req.url },
        { status: 500 },
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; type?: string; title?: string; detail?: string };
    logger.error("POST /api/v1/supersudo/banners/upload-image failed", { error });
    return NextResponse.json(
      { type: err?.type ?? "https://api.shop.am/problems/internal-error", title: err?.title ?? "Internal Server Error", status: err?.status ?? 500, detail: err?.detail ?? err?.message ?? "An error occurred", instance: req.url },
      { status: err?.status ?? 500 },
    );
  }
}
