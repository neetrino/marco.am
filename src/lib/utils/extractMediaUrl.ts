export function extractMediaUrl(media: unknown): string | null {
  if (!media || !Array.isArray(media) || media.length === 0) {
    return null;
  }
  const first = media[0];
  if (typeof first === "string") {
    return first;
  }
  if (first && typeof first === "object" && "url" in first && typeof (first as { url?: string }).url === "string") {
    return (first as { url: string }).url;
  }
  if (first && typeof first === "object" && "src" in first && typeof (first as { src?: string }).src === "string") {
    return (first as { src: string }).src;
  }
  return null;
}
