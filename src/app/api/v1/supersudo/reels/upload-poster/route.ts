import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/utils/logger";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

function getImageExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 },
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
          title: "Storage not configured",
          status: 503,
          detail:
            "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL in .env",
          instance: req.url,
        },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "FormData field 'file' is required",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Unsupported image format. Allowed: jpg, png, webp, gif",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Image size must be between 1 byte and 20MB",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const ext = getImageExtension(file.type);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const key = `reels/posters/${date}-${nanoid(10)}.${ext}`;
    const url = await uploadToR2(key, fileBuffer, file.type);

    if (!url) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/internal-error",
          title: "Upload failed",
          status: 500,
          detail: "Failed to upload poster to storage",
          instance: req.url,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: unknown) {
    logger.error("POST /api/v1/supersudo/reels/upload-poster failed", { error });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: "An error occurred while uploading poster",
        instance: req.url,
      },
      { status: 500 },
    );
  }
}
