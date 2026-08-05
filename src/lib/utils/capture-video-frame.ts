import {
  VIDEO_POSTER_CAPTURE_DURATION_RATIO,
  VIDEO_POSTER_CAPTURE_MAX_TIME_SECONDS,
  VIDEO_POSTER_CAPTURE_MIME,
  VIDEO_POSTER_CAPTURE_MIN_TIME_SECONDS,
  VIDEO_POSTER_CAPTURE_QUALITY,
  VIDEO_POSTER_MAX_DIMENSION_PX,
} from '@/lib/constants/admin-video-upload';

const CAPTURE_FAILED_MESSAGE = 'Could not read a frame from the selected video';

/** Keeps the seek target inside the media so short clips still yield a frame. */
function resolveCaptureTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return VIDEO_POSTER_CAPTURE_MIN_TIME_SECONDS;
  }
  const preferred = Math.min(
    duration * VIDEO_POSTER_CAPTURE_DURATION_RATIO,
    VIDEO_POSTER_CAPTURE_MAX_TIME_SECONDS,
  );
  const latestSafeTime = Math.max(duration - 0.05, 0);
  return Math.min(Math.max(preferred, VIDEO_POSTER_CAPTURE_MIN_TIME_SECONDS), latestSafeTime);
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error(CAPTURE_FAILED_MESSAGE));
    video.src = src;
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error(CAPTURE_FAILED_MESSAGE));
    video.currentTime = time;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(CAPTURE_FAILED_MESSAGE))),
      VIDEO_POSTER_CAPTURE_MIME,
      VIDEO_POSTER_CAPTURE_QUALITY,
    );
  });
}

async function drawFrame(video: HTMLVideoElement, filename: string): Promise<File> {
  const { videoWidth, videoHeight } = video;
  if (videoWidth === 0 || videoHeight === 0) {
    throw new Error(CAPTURE_FAILED_MESSAGE);
  }

  const scale = Math.min(1, VIDEO_POSTER_MAX_DIMENSION_PX / Math.max(videoWidth, videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(videoWidth * scale);
  canvas.height = Math.round(videoHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error(CAPTURE_FAILED_MESSAGE);
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await canvasToBlob(canvas);
  return new File([blob], filename, { type: blob.type });
}

/**
 * Grabs an opening frame from a local video file as an image, so uploads can get
 * an automatic poster without server-side transcoding.
 */
export async function captureVideoFrameFile(
  file: File,
  filename = 'reel-frame.jpg',
): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = await loadVideo(objectUrl);
    await seekVideo(video, resolveCaptureTime(video.duration));
    return await drawFrame(video, filename);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
