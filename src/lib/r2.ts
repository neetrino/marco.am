import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const r2 =
  accountId && accessKeyId && secretAccessKey && bucketName
    ? new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

type UploadToR2Options = {
  /** Sent as `Cache-Control` on the object (CDN / browser caching). */
  cacheControl?: string;
};

const DEFAULT_R2_OBJECT_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

/**
 * Upload a buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  options?: UploadToR2Options,
): Promise<string | null> {
  if (!r2 || !bucketName || !publicUrl) {
    return null;
  }
  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: options?.cacheControl ?? DEFAULT_R2_OBJECT_CACHE_CONTROL,
    })
  );
  const base = publicUrl.replace(/\/$/, "");
  const path = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${path}`;
}

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName && publicUrl);
}
