import "server-only";

import { randomUUID } from "node:crypto";
import { deleteR2Object, putR2Object } from "@/lib/storage/r2";
import { MAX_NEWS_IMAGE_BYTES, NEWS_IMAGE_MIME } from "./editor-input";
import { NewsImageError, type ProcessedNewsImage } from "./images.server";
import type { NewsAsset } from "./types";

/** Reads and size/type-checks the uploaded image in a multipart form. */
export async function readUploadedImage(form: FormData, field = "file") {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) throw new NewsImageError("Choose an image to upload.");
  if (!(NEWS_IMAGE_MIME as readonly string[]).includes(file.type)) throw new NewsImageError("Upload a JPEG, PNG or WebP image.");
  if (file.size > MAX_NEWS_IMAGE_BYTES)
    throw new NewsImageError("That image is larger than 4 MB. Export a smaller version and try again.");
  return Buffer.from(await file.arrayBuffer());
}

/** Stores a processed image in R2 and returns the asset record to persist. */
export async function storeNewsImage(
  postId: string,
  purpose: NewsAsset["purpose"],
  image: ProcessedNewsImage,
): Promise<NewsAsset> {
  const id = randomUUID();
  const r2Key = `news/${postId}/${purpose}-${id}.${image.extension}`;
  await putR2Object({ key: r2Key, body: image.bytes, contentType: image.mime });
  return {
    id,
    postId,
    purpose,
    r2Key,
    mime: image.mime,
    width: image.width,
    height: image.height,
    byteSize: image.bytes.length,
  };
}

export async function removeNewsObjects(keys: string[]) {
  await Promise.all(keys.map((key) => deleteR2Object(key).catch(() => undefined)));
}
