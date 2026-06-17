import { ADMIN_IMAGE_MIME } from '@/lib/constants/admin-image-upload';
import { encodeImageBufferToWebp } from '@/lib/utils/encode-image-to-webp';

/**
 * Normalizes admin-uploaded WebP rasters for R2.
 * Re-encodes when sharp is available; otherwise keeps validated WebP bytes.
 */
export async function prepareRasterForR2Upload(
  buffer: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const normalizedMime = mime.toLowerCase();
  if (normalizedMime !== ADMIN_IMAGE_MIME) {
    const webp = await encodeImageBufferToWebp(buffer);
    if (webp !== null) {
      return { buffer: webp, contentType: ADMIN_IMAGE_MIME, extension: 'webp' };
    }
    throw new Error('Unsupported image format; only WebP is allowed');
  }

  const webp = await encodeImageBufferToWebp(buffer);
  if (webp !== null) {
    return { buffer: webp, contentType: ADMIN_IMAGE_MIME, extension: 'webp' };
  }

  return { buffer, contentType: ADMIN_IMAGE_MIME, extension: 'webp' };
}
