import {
  ADMIN_IMAGE_MAX_RAW_BYTES,
  ADMIN_IMAGE_MIME,
  ADMIN_IMAGE_PROCESS_OPTIONS,
  type AdminImageUploadProfile,
} from '@/lib/constants/admin-image-upload';
import { processImageFile } from '@/lib/utils/image-utils';

const IMAGE_FILE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

export const ADMIN_IMAGE_INVALID_MESSAGE = 'Only image files are allowed';

function isAdminImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime.startsWith('image/')) {
    return true;
  }
  return mime === '' && IMAGE_FILE_EXTENSION_PATTERN.test(file.name);
}

export function validateAdminImageFile(
  file: File,
  profile: AdminImageUploadProfile,
): string | null {
  if (!isAdminImageFile(file)) {
    return ADMIN_IMAGE_INVALID_MESSAGE;
  }
  if (file.size <= 0) {
    return 'Image file is empty';
  }
  const maxRawBytes = ADMIN_IMAGE_MAX_RAW_BYTES[profile];
  if (file.size > maxRawBytes) {
    return `Image exceeds maximum upload size of ${Math.round(maxRawBytes / 1024)}KB`;
  }
  return null;
}

/**
 * Validates image input and compresses/resizes to WebP for admin uploads.
 * @returns Base64 data URL (`data:image/webp;base64,...`)
 */
export async function processAdminImageFile(
  file: File,
  profile: AdminImageUploadProfile,
): Promise<string> {
  const validationError = validateAdminImageFile(file, profile);
  if (validationError) {
    throw new Error(validationError);
  }

  const options = ADMIN_IMAGE_PROCESS_OPTIONS[profile];
  return processImageFile(file, {
    ...options,
    useWebWorker: true,
    fileType: ADMIN_IMAGE_MIME,
  });
}

/** Builds a WebP File from a data URL (e.g. for FormData poster upload). */
export async function adminWebpFileFromDataUrl(
  dataUrl: string,
  filename = 'image.webp',
): Promise<File> {
  const blob = await fetch(dataUrl).then((response) => response.blob());
  return new File([blob], filename, { type: ADMIN_IMAGE_MIME });
}
