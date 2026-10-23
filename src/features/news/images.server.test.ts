// @vitest-environment node
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  createShareImage,
  NewsImageError,
  processCoverImage,
  processInlineImage,
  SHARE_IMAGE_TARGET_BYTES,
} from "./images.server";

/** A photo-like image (random noise compresses badly, which is the worst case for size). */
async function photo(width: number, height: number, format: "jpeg" | "png" = "jpeg") {
  const raw = Buffer.alloc(width * height * 3);
  for (let index = 0; index < raw.length; index += 1) raw[index] = (index * 2654435761) % 251;
  const image = sharp(raw, { raw: { width, height, channels: 3 } }).withMetadata({
    exif: { IFD0: { Copyright: "private-camera-metadata" } },
  });
  return format === "png" ? image.png().toBuffer() : image.jpeg({ quality: 95 }).toBuffer();
}

describe("news image processing", () => {
  it("creates a 1200×630 JPEG share image small enough for WhatsApp", async () => {
    const share = await createShareImage(await photo(2400, 1600));
    const metadata = await sharp(share.bytes).metadata();
    expect(metadata).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
    expect(share.bytes.length).toBeLessThanOrEqual(SHARE_IMAGE_TARGET_BYTES);
  });

  it("re-encodes covers as bounded WebP without camera metadata", async () => {
    const cover = await processCoverImage(await photo(3200, 1800));
    const metadata = await sharp(cover.bytes).metadata();
    expect(metadata.format).toBe("webp");
    expect(cover.width).toBe(2400);
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects covers below the minimum share size", async () => {
    await expect(processCoverImage(await photo(640, 360))).rejects.toThrow(NewsImageError);
  });

  it("accepts PNG screenshots for article images and caps their width", async () => {
    const image = await processInlineImage(await photo(2400, 1200, "png"));
    expect(image.width).toBe(1800);
    expect(image.mime).toBe("image/webp");
  });

  it("rejects files that are not images", async () => {
    await expect(processInlineImage(Buffer.from("<svg onload=alert(1)>"))).rejects.toThrow(NewsImageError);
  });
});
