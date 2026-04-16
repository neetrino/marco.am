/**
 * Development only: if the API returns a single image, duplicate it so the gallery
 * slider + dots can be tested without placeholder URLs.
 */
export function duplicateSingleImageForDevGalleryTest(
  urls: readonly string[],
): string[] {
  if (process.env.NODE_ENV === 'production') {
    return [...urls];
  }
  if (urls.length !== 1) {
    return [...urls];
  }
  const [first] = urls;
  /** Two slides — same real URL — enough to open the slider UI in dev. */
  return [first, first];
}
