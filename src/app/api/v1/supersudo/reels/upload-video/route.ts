import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/utils/logger";

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

function getVideoExtension(mimeType: string): string {
  switch (mimeType) {
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    case "video/ogg":
      return "ogv";
    default:
      return "mp4";
  }
}

function hasBytesSequence(buffer: Buffer, value: string): boolean {
  return buffer.includes(Buffer.from(value, "ascii"));
}

/**
 * Minimal codec guard for MP4/MOV uploads.
 * Browsers can fail to play HEVC/H.265 (`hvc1`/`hev1`) in many environments,
 * so we allow AVC/H.264 (`avc1`) and reject likely unsupported HEVC payloads.
 */
function validateUploadedVideoCodec(fileBuffer: Buffer, mimeType: string): string | null {
  if (mimeType !== "video/mp4" && mimeType !== "video/quicktime") {
    return null;
  }

  const hasHevcMarker =
    hasBytesSequence(fileBuffer, "hvc1") || hasBytesSequence(fileBuffer, "hev1");
  if (hasHevcMarker) {
    return "Unsupported video codec. Please upload H.264/AVC MP4 (not HEVC/H.265).";
  }

  const hasAvcMarker = hasBytesSequence(fileBuffer, "avc1");
  if (!hasAvcMarker) {
    return "Could not verify a browser-safe H.264 codec. Please upload H.264/AVC MP4.";
  }

  return null;
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

    if (!ALLOWED_VIDEO_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Unsupported video format. Allowed: mp4, webm, mov, ogv",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Video size must be between 1 byte and 200MB",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const codecError = validateUploadedVideoCodec(fileBuffer, file.type);
    if (codecError) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: codecError,
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const ext = getVideoExtension(file.type);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const key = `reels/${date}-${nanoid(10)}.${ext}`;
    const url = await uploadToR2(key, fileBuffer, file.type);

    if (!url) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/internal-error",
          title: "Upload failed",
          status: 500,
          detail: "Failed to upload video to storage",
          instance: req.url,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: unknown) {
    logger.error("POST /api/v1/supersudo/reels/upload-video failed", { error });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: "An error occurred while uploading video",
        instance: req.url,
      },
      { status: 500 },
    );
  }
}
