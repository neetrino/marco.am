import { encodeImageBufferToWebp } from "@/lib/utils/encode-image-to-webp";
import { smartSplitUrls } from "@/lib/utils/image-utils";

const DATA_URL_RE = /^data:(image\/[a-z+.-]+);base64,(.+)$/i;

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(DATA_URL_RE);
  if (!match) {
    return null;
  }
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  return { mime, buffer };
}

export type ProductMediaPayloadItem = string | { url?: string; src?: string; value?: string };

/**
 * Re-encodes admin inline raster uploads (`data:image/*;base64,...`) as WebP data URLs.
 * Skips GIF (animation), SVG, non-data URLs (http(s), `/assets/...`).
 */
export async function normalizeInboundRasterStringToWebpDataUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("data:image/")) {
    return url;
  }
  if (trimmed.startsWith("data:image/gif")) {
    return url;
  }
  if (trimmed.startsWith("data:image/svg+xml")) {
    return url;
  }
  if (trimmed.startsWith("data:image/webp")) {
    return url;
  }
  const parsed = parseDataUrl(trimmed);
  if (!parsed) {
    return url;
  }
  const webp = await encodeImageBufferToWebp(parsed.buffer);
  if (!webp) {
    return url;
  }
  return `data:image/webp;base64,${webp.toString("base64")}`;
}

/** Comma-separated gallery / variant slots — respects base64 commas via {@link smartSplitUrls}. */
export async function normalizeCommaSeparatedRasterDataUrls(input: string): Promise<string> {
  const parts = smartSplitUrls(input);
  const out = await Promise.all(parts.map((p) => normalizeInboundRasterStringToWebpDataUrl(p)));
  return out.join(",");
}

export async function normalizeProductMediaPayload(
  items: ProductMediaPayloadItem[],
): Promise<ProductMediaPayloadItem[]> {
  return Promise.all(
    items.map(async (m) => {
      if (typeof m === "string") {
        return await normalizeInboundRasterStringToWebpDataUrl(m);
      }
      if (typeof m.url === "string" && m.url.trim()) {
        return { ...m, url: await normalizeInboundRasterStringToWebpDataUrl(m.url) };
      }
      if (typeof m.src === "string" && m.src.trim()) {
        return { ...m, src: await normalizeInboundRasterStringToWebpDataUrl(m.src) };
      }
      if (typeof m.value === "string" && m.value.trim()) {
        return { ...m, value: await normalizeInboundRasterStringToWebpDataUrl(m.value) };
      }
      return m;
    }),
  );
}
