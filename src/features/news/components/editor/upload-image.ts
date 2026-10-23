import { MAX_NEWS_IMAGE_BYTES, NEWS_IMAGE_MIME } from "../../editor-input";

/** Phone photos often exceed the upload limit; above this size they are re-encoded in the browser first. */
const DOWNSCALE_ABOVE_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2600;

export class UploadError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new UploadError("This browser could not prepare the image. Try a smaller file.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.9, 0.82, 0.72]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_NEWS_IMAGE_BYTES) return blob;
  }
  throw new UploadError("That image is too large. Export a smaller version and try again.");
}

/** Validates type and size, downscaling large photos so they fit the server limit. */
export async function prepareImage(file: File): Promise<Blob> {
  if (!(NEWS_IMAGE_MIME as readonly string[]).includes(file.type)) {
    throw new UploadError("Use a JPEG, PNG or WebP image.");
  }
  if (file.size <= DOWNSCALE_ABOVE_BYTES) return file;
  return downscale(file);
}

export async function postImage<T>(url: string, file: File, fields: Record<string, string> = {}): Promise<T> {
  const body = new FormData();
  const prepared = await prepareImage(file);
  body.set("file", prepared, prepared === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg");
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body });
  } catch {
    throw new UploadError("Network error. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!response.ok) throw new UploadError(data.error ?? "Upload failed. Try again.", data.code);
  return data as T;
}
