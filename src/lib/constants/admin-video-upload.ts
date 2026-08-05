export const ADMIN_VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,video/ogg';

export const ADMIN_VIDEO_MAX_SIZE_BYTES = 200 * 1024 * 1024;

export const ADMIN_VIDEO_ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
] as const;

/** Frame grabbed as the auto poster — early enough to stay on the opening shot. */
export const VIDEO_POSTER_CAPTURE_MIN_TIME_SECONDS = 0.1;
export const VIDEO_POSTER_CAPTURE_MAX_TIME_SECONDS = 2;
export const VIDEO_POSTER_CAPTURE_DURATION_RATIO = 0.1;

/** Longest side of the generated poster, matching the catalog image profile. */
export const VIDEO_POSTER_MAX_DIMENSION_PX = 1200;
export const VIDEO_POSTER_CAPTURE_MIME = 'image/jpeg';
export const VIDEO_POSTER_CAPTURE_QUALITY = 0.9;
