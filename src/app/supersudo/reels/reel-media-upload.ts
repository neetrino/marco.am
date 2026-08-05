import {
  ADMIN_VIDEO_ALLOWED_MIME_TYPES,
  ADMIN_VIDEO_MAX_SIZE_BYTES,
} from '@/lib/constants/admin-video-upload';
import { captureVideoFrameFile } from '@/lib/utils/capture-video-frame';
import {
  adminWebpFileFromDataUrl,
  processAdminImageFile,
} from '@/lib/utils/process-admin-image-file';

const VIDEO_UPLOAD_ENDPOINT = '/api/v1/supersudo/reels/upload-video';
const POSTER_UPLOAD_ENDPOINT = '/api/v1/supersudo/reels/upload-poster';

export type ReelVideoProblem = 'type' | 'size';

type UploadResponse = { url: string };

/** Mirrors the server-side upload guards so invalid files never leave the browser. */
export function validateReelVideoFile(file: File): ReelVideoProblem | null {
  const allowedTypes = new Set<string>(ADMIN_VIDEO_ALLOWED_MIME_TYPES);
  if (!allowedTypes.has(file.type)) {
    return 'type';
  }
  if (file.size <= 0 || file.size > ADMIN_VIDEO_MAX_SIZE_BYTES) {
    return 'size';
  }
  return null;
}

/** Empty message keeps the caller's localized fallback in `getApiOrErrorMessage`. */
async function uploadFile(endpoint: string, file: File): Promise<string> {
  const payload = new FormData();
  payload.append('file', file);

  const response = await fetch(endpoint, { method: 'POST', body: payload });
  const body = (await response.json().catch(() => null)) as
    | UploadResponse
    | { detail?: string }
    | null;

  if (!response.ok || !body || !('url' in body)) {
    const detail = body && 'detail' in body ? body.detail : null;
    throw new Error(detail ?? '');
  }
  return body.url;
}

export async function uploadReelVideo(file: File): Promise<string> {
  return uploadFile(VIDEO_UPLOAD_ENDPOINT, file);
}

export async function uploadReelPoster(file: File): Promise<string> {
  const dataUrl = await processAdminImageFile(file, 'catalog');
  const webpFile = await adminWebpFileFromDataUrl(dataUrl, 'poster.webp');
  return uploadFile(POSTER_UPLOAD_ENDPOINT, webpFile);
}

/** Builds the poster from the video itself, so a reel always has its own thumbnail. */
export async function uploadReelPosterFromVideo(file: File): Promise<string> {
  const frameFile = await captureVideoFrameFile(file);
  return uploadReelPoster(frameFile);
}
