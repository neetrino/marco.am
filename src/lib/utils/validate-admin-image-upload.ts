const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_ADMIN_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_ADMIN_IMAGE_COUNT = 12;

type ParsedAdminImageUpload = {
  mime: string;
  buffer: Buffer;
};

function hasSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }
  return signature.every((byte, index) => buffer[index] === byte);
}

function isValidImageMagicNumber(buffer: Buffer, mime: string): boolean {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return hasSignature(buffer, [0xff, 0xd8, 0xff]);
    case "image/png":
      return hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return hasSignature(buffer, [0x47, 0x49, 0x46, 0x38]);
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

export function getMaxAdminImageCount(): number {
  return MAX_ADMIN_IMAGE_COUNT;
}

export function parseAdminImageDataUrl(dataUrl: string): ParsedAdminImageUpload | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    return null;
  }

  const mime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    return null;
  }

  const buffer = Buffer.from(match[2], "base64");
  if (
    buffer.length <= 0 ||
    buffer.length > MAX_ADMIN_IMAGE_SIZE_BYTES ||
    !isValidImageMagicNumber(buffer, mime)
  ) {
    return null;
  }

  return { mime, buffer };
}
