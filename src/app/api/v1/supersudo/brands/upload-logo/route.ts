import { NextRequest, NextResponse } from 'next/server';

import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import {
  buildBrandLogoR2Key,
  resolveBrandLogoR2Basename,
} from '@/lib/services/admin/brand-logo-storage';
import { prepareRasterForR2Upload } from '@/lib/utils/prepare-raster-for-r2-upload';
import { logger } from '@/lib/utils/logger';
import { parseAdminImageDataUrl } from '@/lib/utils/validate-admin-image-upload';

type UploadBrandLogoBody = {
  image?: unknown;
  name?: unknown;
  slug?: unknown;
  brandId?: unknown;
};

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Admin access required',
          instance: req.url,
        },
        { status: 403 },
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/config-error',
          title: 'Storage not configured',
          status: 503,
          detail: 'R2 is not configured',
          instance: req.url,
        },
        { status: 503 },
      );
    }

    let body: UploadBrandLogoBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid JSON',
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (typeof body.image !== 'string' || !body.image.startsWith('data:image/')) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: "Field 'image' must be a valid base64 image (data:image/...)",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const name = readNonEmptyString(body.name);
    if (!name) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: "Field 'name' is required",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const parsed = parseAdminImageDataUrl(body.image);
    if (!parsed) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid, unsupported, or oversized image',
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const basename = resolveBrandLogoR2Basename({
      slug: readNonEmptyString(body.slug),
      name,
      brandId: readNonEmptyString(body.brandId),
    });

    const prepared = await prepareRasterForR2Upload(parsed.buffer, parsed.mime);
    const key = buildBrandLogoR2Key(basename, prepared.extension);
    const url = await uploadToR2(key, prepared.buffer, prepared.contentType);

    if (!url) {
      logger.error('Brand logo upload: R2 upload failed', { key, basename });
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/internal-error',
          title: 'Upload failed',
          status: 500,
          detail: 'Failed to upload brand logo to storage',
          instance: req.url,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ url, key }, { status: 200 });
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      status?: number;
      type?: string;
      title?: string;
      detail?: string;
    };
    logger.error('POST /api/v1/supersudo/brands/upload-logo failed', { error });
    return NextResponse.json(
      {
        type: err?.type ?? 'https://api.shop.am/problems/internal-error',
        title: err?.title ?? 'Internal Server Error',
        status: err?.status ?? 500,
        detail: err?.detail ?? err?.message ?? 'An error occurred',
        instance: req.url,
      },
      { status: err?.status ?? 500 },
    );
  }
}
