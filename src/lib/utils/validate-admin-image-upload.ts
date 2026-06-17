import {
  ADMIN_IMAGE_MAX_BYTES,
  ADMIN_IMAGE_MIME,
  MAX_ADMIN_IMAGE_COUNT,
  type AdminImageUploadProfile,
} from '@/lib/constants/admin-image-upload';

type ParsedAdminImageUpload = {
  mime: string;
  buffer: Buffer;
};

function isValidWebpMagicNumber(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

export function getMaxAdminImageCount(): number {
  return MAX_ADMIN_IMAGE_COUNT;
}

export function parseAdminImageDataUrl(
  dataUrl: string,
  profile: AdminImageUploadProfile = 'catalog',
): ParsedAdminImageUpload | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    return null;
  }

  const mime = match[1].toLowerCase();
  if (mime !== ADMIN_IMAGE_MIME) {
    return null;
  }

  const buffer = Buffer.from(match[2], 'base64');
  const maxBytes = ADMIN_IMAGE_MAX_BYTES[profile];
  if (
    buffer.length <= 0 ||
    buffer.length > maxBytes ||
    !isValidWebpMagicNumber(buffer)
  ) {
    return null;
  }

  return { mime, buffer };
}

export function validateAdminWebpBuffer(
  buffer: Buffer,
  profile: AdminImageUploadProfile = 'catalog',
): boolean {
  const maxBytes = ADMIN_IMAGE_MAX_BYTES[profile];
  if (buffer.length <= 0 || buffer.length > maxBytes) {
    return false;
  }
  return isValidWebpMagicNumber(buffer);
}
