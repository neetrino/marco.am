import {
  ADMIN_IMAGE_MAX_RAW_BYTES,
  ADMIN_IMAGE_MIME,
  ADMIN_IMAGE_PROCESS_OPTIONS,
  type AdminImageUploadProfile,
} from '@/lib/constants/admin-image-upload';
import { processImageFile } from '@/lib/utils/image-utils';

export const ADMIN_IMAGE_WEBP_ONLY_MESSAGE = 'Only WebP images are allowed';

function isAdminWebpFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime === ADMIN_IMAGE_MIME) {
    return true;
  }
  return mime === '' && file.name.toLowerCase().endsWith('.webp');
}

export function validateAdminWebpFile(
  file: File,
  profile: AdminImageUploadProfile,
): string | null {
  if (!isAdminWebpFile(file)) {
    return ADMIN_IMAGE_WEBP_ONLY_MESSAGE;
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
 * Validates WebP input and compresses/resizes for admin uploads.
 * @returns Base64 data URL (`data:image/webp;base64,...`)
 */
export async function processAdminImageFile(
  file: File,
  profile: AdminImageUploadProfile,
): Promise<string> {
  const validationError = validateAdminWebpFile(file, profile);
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
