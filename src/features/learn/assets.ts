const MAX_ASSET_BYTES = 100 * 1024 * 1024;

export type LearnAssetMetadataInput = {
  filename: string;
  mimeType: string;
  byteSize: number;
  decorative: boolean;
  altText?: string;
  caption?: string;
  transcript?: string;
};

export function validateLearnAssetMetadata(input: LearnAssetMetadataInput) {
  const errors: string[] = [];
  if (!input.filename.trim() || input.filename.length > 240) errors.push("A filename is required.");
  if (!/^[A-Za-z0-9][A-Za-z0-9.+/_-]{0,127}$/.test(input.mimeType)) errors.push("A valid MIME type is required.");
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0 || input.byteSize > MAX_ASSET_BYTES) errors.push("Asset size is outside the permitted range.");
  if (input.mimeType.startsWith("image/") && !input.decorative && !input.altText?.trim()) errors.push("Meaningful images require alternative text.");
  if ((input.mimeType.startsWith("video/") || input.mimeType.startsWith("audio/")) && !input.transcript?.trim()) errors.push("Audio and video assets require a transcript before publication.");
  return { valid: errors.length === 0, errors };
}

export function safeLearnAssetFilename(filename: string) {
  return filename.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160) || "asset";
}
