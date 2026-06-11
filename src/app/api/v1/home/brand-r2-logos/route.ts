import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

const BRAND_LOGOS_PREFIX = "brands/logos/";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function toPublicUrl(baseUrl: string, key: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
  return `${normalizedBase}/${normalizedKey}`;
}

/**
 * Public endpoint returning uploaded brand logo URLs from R2.
 * Source prefix: `brands/logos/`.
 */
export async function GET() {
  try {
    const accountId = readRequiredEnv("R2_ACCOUNT_ID");
    const accessKeyId = readRequiredEnv("R2_ACCESS_KEY_ID");
    const secretAccessKey = readRequiredEnv("R2_SECRET_ACCESS_KEY");
    const bucket = readRequiredEnv("R2_BUCKET_NAME");
    const publicUrl = readRequiredEnv("R2_PUBLIC_URL");

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const urls: string[] = [];
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
        urls.push(toPublicUrl(publicUrl, key));
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    urls.sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ data: urls });
  } catch (error: unknown) {
    logger.error("GET /api/v1/home/brand-r2-logos failed", { error });
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

