import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type UploadToR2Options = {
  /** Sent as `Cache-Control` on the object (CDN / browser caching). */
  cacheControl?: string;
};

const DEFAULT_R2_OBJECT_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

type R2RuntimeConfig = {
  client: S3Client;
  bucketName: string;
  publicUrl: string;
};

function readR2RuntimeConfig(): R2RuntimeConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }
  return {
    bucketName,
    publicUrl,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
  };
}

/**
 * Upload a buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  options?: UploadToR2Options,
): Promise<string | null> {
  const config = readR2RuntimeConfig();
  if (!config) {
    return null;
  }
  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: options?.cacheControl ?? DEFAULT_R2_OBJECT_CACHE_CONTROL,
    }),
  );
  const base = config.publicUrl.replace(/\/$/, "");
  const path = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${path}`;
}

export function isR2Configured(): boolean {
  return readR2RuntimeConfig() !== null;
}
