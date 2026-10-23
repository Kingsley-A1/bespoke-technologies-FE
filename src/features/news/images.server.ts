import "server-only";

import sharp from "sharp";

export class NewsImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsImageError";
  }
}

export interface ProcessedNewsImage {
  bytes: Buffer;
  mime: "image/webp" | "image/jpeg";
  extension: "webp" | "jpg";
  width: number;
  height: number;
}

/** Open Graph card size recognised by WhatsApp, LinkedIn, X and Facebook. */
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;
/** WhatsApp is unreliable with large preview images; stay well under ~300 KB. */
export const SHARE_IMAGE_TARGET_BYTES = 280 * 1024;

const MIN_COVER = { width: 800, height: 420 };
const MAX_INPUT_PIXELS = 50_000_000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

async function inspect(input: Buffer) {
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new NewsImageError("That file is not a readable image.");
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new NewsImageError("Upload a JPEG, PNG or WebP image.");
  }
  // EXIF orientations 5–8 swap the displayed width and height.
  const rotated = (metadata.orientation ?? 1) >= 5;
  const width = (rotated ? metadata.height : metadata.width) ?? 0;
  const height = (rotated ? metadata.width : metadata.height) ?? 0;
  return { width, height };
}

/**
 * Normalizes an uploaded image for the web: honours EXIF orientation, strips
 * all metadata (including GPS), bounds the width and re-encodes as WebP.
 */
async function toWebImage(input: Buffer, maxWidth: number): Promise<ProcessedNewsImage> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, mime: "image/webp", extension: "webp", width: info.width, height: info.height };
}

export async function processInlineImage(input: Buffer) {
  const { width, height } = await inspect(input);
  if (width < 200 || height < 120)
    throw new NewsImageError("That image is too small to read clearly. Use one at least 200 px wide.");
  return toWebImage(input, 1800);
}

export async function processCoverImage(input: Buffer) {
  const { width, height } = await inspect(input);
  if (width < MIN_COVER.width || height < MIN_COVER.height) {
    throw new NewsImageError(
      `Cover images must be at least ${MIN_COVER.width}×${MIN_COVER.height} px. 1600×900 or larger works best.`,
    );
  }
  return toWebImage(input, 2400);
}

/**
 * The 1200×630 JPEG used as `og:image`. The crop keeps the most visually
 * important region, and quality steps down until the file is small enough for
 * WhatsApp to show it reliably.
 */
export async function createShareImage(input: Buffer): Promise<ProcessedNewsImage> {
  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize(SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT, { fit: "cover", position: sharp.strategy.attention })
    .flatten({ background: "#ffffff" });
  let bytes: Buffer = Buffer.alloc(0);
  for (const quality of [82, 72, 62, 52]) {
    bytes = await base.clone().jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
    if (bytes.length <= SHARE_IMAGE_TARGET_BYTES) break;
  }
  return { bytes, mime: "image/jpeg", extension: "jpg", width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT };
}
