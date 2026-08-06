import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import { prepareRasterForR2Upload } from "@/lib/utils/prepare-raster-for-r2-upload";
import {
  getMaxAdminImageCount,
  parseAdminImageDataUrl,
} from "@/lib/utils/validate-admin-image-upload";
import { logger } from "@/lib/utils/logger";

const UPLOAD_SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

type UploadedImageMeta = {
  url: string;
  objectKey: string;
  mimeType: string;
  size: number;
};

function resolveObjectKey(uploadSessionId: string | undefined, extension: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const id = nanoid(12);
  if (uploadSessionId && UPLOAD_SESSION_ID_PATTERN.test(uploadSessionId)) {
    return `products/drafts/${uploadSessionId}/${id}.${extension}`;
  }
  return `products/${date}-${id}.${extension}`;
}

/**
 * POST /api/v1/supersudo/products/upload-images
 * Accepts compressed WebP data URLs as transport, uploads to R2, returns HTTPS URLs.
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  logger.debug("Admin upload images: POST received", { url: req.url });

  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.warn("Admin upload images: unauthorized", { userId: user?.id });
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

    let body: { images?: unknown; uploadSessionId?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid JSON in request body",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'images' is required and must be a non-empty array",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (body.images.length > getMaxAdminImageCount()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: `Maximum ${getMaxAdminImageCount()} images are allowed per upload`,
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const uploadSessionId =
      typeof body.uploadSessionId === "string" ? body.uploadSessionId.trim() : undefined;

    const validImages: string[] = [];
    for (let i = 0; i < body.images.length; i++) {
      const image = body.images[i];
      if (typeof image !== "string" || !image.startsWith("data:image/")) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Image at index ${i} must be a valid base64 image (data:image/...)`,
            instance: req.url,
          },
          { status: 400 },
        );
      }
      validImages.push(image);
    }

    const images: UploadedImageMeta[] = [];
    const urls: string[] = [];

    for (let i = 0; i < validImages.length; i++) {
      const parsed = parseAdminImageDataUrl(validImages[i], "catalog");
      if (!parsed) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Invalid, unsupported, or oversized WebP image at index ${i}`,
            instance: req.url,
          },
          { status: 400 },
        );
      }
      const prepared = await prepareRasterForR2Upload(parsed.buffer, parsed.mime);
      const objectKey = resolveObjectKey(uploadSessionId, prepared.extension);
      const url = await uploadToR2(objectKey, prepared.buffer, prepared.contentType);
      if (!url) {
        logger.error("Admin upload images: R2 upload failed", { objectKey });
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/internal-error",
            title: "Upload failed",
            status: 500,
            detail: "Failed to upload image to storage",
            instance: req.url,
          },
          { status: 500 },
        );
      }
      const meta: UploadedImageMeta = {
        url,
        objectKey,
        mimeType: prepared.contentType,
        size: prepared.buffer.length,
      };
      images.push(meta);
      urls.push(url);
    }

    const totalTime = Date.now() - requestStartTime;
    logger.info("Admin upload images: done", { count: urls.length, totalTime });

    return NextResponse.json({ urls, images }, { status: 200 });
  } catch (error: unknown) {
    const totalTime = Date.now() - requestStartTime;
    const err = error as {
      message?: string;
      status?: number;
      type?: string;
      title?: string;
      detail?: string;
    };
    logger.error("Admin upload images: POST error", {
      message: err?.message,
      status: err?.status,
      totalTime,
    });
    return NextResponse.json(
      {
        type: err?.type ?? "https://api.shop.am/problems/internal-error",
        title: err?.title ?? "Internal Server Error",
        status: err?.status ?? 500,
        detail: err?.detail ?? err?.message ?? "An error occurred",
        instance: req.url,
      },
      { status: err?.status ?? 500 },
    );
  }
}
