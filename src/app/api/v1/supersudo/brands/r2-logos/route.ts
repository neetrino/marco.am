import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

type R2LogoObject = {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
};

const BRAND_LOGOS_PREFIX = "brands/logos/";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function createR2Client(): S3Client {
  const accountId = readRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = readRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readRequiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function toPublicUrl(baseUrl: string, key: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
  return `${normalizedBase}/${normalizedKey}`;
}

/**
 * GET /api/v1/supersudo/brands/r2-logos
 * List uploaded brand logos from R2 `brands/logos/` prefix.
 */
export async function GET(req: NextRequest) {
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
        { status: 403 }
      );
    }

    const bucket = readRequiredEnv("R2_BUCKET_NAME");
    const publicUrl = readRequiredEnv("R2_PUBLIC_URL");
    const client = createR2Client();

    const objects: R2LogoObject[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: BRAND_LOGOS_PREFIX,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      );

      const listed = Array.isArray(response.Contents) ? response.Contents : [];
      for (const item of listed) {
        const key = item.Key;
        if (!key || key.endsWith("/")) {
          continue;
        }
        objects.push({
          key,
          url: toPublicUrl(publicUrl, key),
          size: Number(item.Size ?? 0),
          lastModified: item.LastModified ? item.LastModified.toISOString() : null,
        });
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    objects.sort((a, b) => a.key.localeCompare(b.key));
    return NextResponse.json({ data: objects });
  } catch (error: unknown) {
    logger.error("GET /api/v1/supersudo/brands/r2-logos failed", { error });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: error instanceof Error ? error.message : "Failed to list R2 logos",
        instance: req.url,
      },
      { status: 500 }
    );
  }
}
