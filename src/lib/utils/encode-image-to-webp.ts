import { logger } from "@/lib/utils/logger";

const WEBP_QUALITY = 82;

/**
 * Re-encodes raster image bytes as WebP (smaller payloads from R2 / faster loads).
 * Skips when sharp is unavailable or conversion fails; caller should keep original.
 * Do not use for animated GIF — preserve motion by skipping WebP in the caller.
 */
export async function encodeImageBufferToWebp(buffer: Buffer): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buffer).rotate().webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
  } catch (error: unknown) {
    logger.warn("[encodeImageBufferToWebp] sharp encode failed, keeping original", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
