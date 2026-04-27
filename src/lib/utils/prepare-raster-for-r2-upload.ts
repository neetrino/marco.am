import { encodeImageBufferToWebp } from "@/lib/utils/encode-image-to-webp";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/**
 * Normalizes admin-uploaded rasters for R2: WebP when possible (smaller files, faster storefront).
 * Keeps GIF unchanged (animation). Falls back to original bytes if sharp fails.
 */
export async function prepareRasterForR2Upload(
  buffer: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const normalizedMime = mime.toLowerCase();
  if (normalizedMime === "image/gif") {
    return { buffer, contentType: normalizedMime, extension: "gif" };
  }

  const webp = await encodeImageBufferToWebp(buffer);
  if (webp !== null) {
    return { buffer: webp, contentType: "image/webp", extension: "webp" };
  }

  return {
    buffer,
    contentType: normalizedMime,
    extension: MIME_TO_EXT[normalizedMime] ?? "jpg",
  };
}
