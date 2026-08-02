type Asset = { id: string; mimeType: string };
type Block = { id: string; type: string; config: unknown };
type Course = { modules: Array<{ lessons: Array<{ blocks: Block[] }> }> };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function reference(assetId: unknown, blockId: string, type: "image" | "video" | "audio" | "caption" | "download", assets: Map<string, Asset>, errors: string[]) {
  if (typeof assetId !== "string" || !assetId) return;
  const asset = assets.get(assetId);
  if (!asset) {
    errors.push(`Block ${blockId} references unavailable asset ${assetId}.`);
    return;
  }
  if (type === "image" && !asset.mimeType.startsWith("image/")) errors.push(`Block ${blockId} needs an image asset.`);
  if (type === "video" && !asset.mimeType.startsWith("video/")) errors.push(`Block ${blockId} needs a video asset.`);
  if (type === "audio" && !asset.mimeType.startsWith("audio/")) errors.push(`Block ${blockId} needs an audio asset.`);
  if (type === "caption" && asset.mimeType !== "text/vtt") errors.push(`Block ${blockId} needs a WebVTT captions asset.`);
}

export function validateCourseAssetReferences(course: Course, assets: readonly Asset[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const errors: string[] = [];
  for (const courseModule of course.modules) for (const lesson of courseModule.lessons) for (const block of lesson.blocks) {
    const config = record(block.config);
    if (block.type === "image") reference(config.assetId, block.id, "image", byId, errors);
    if (block.type === "slides") for (const slide of Array.isArray(config.slides) ? config.slides : []) reference(record(slide).assetId, block.id, "image", byId, errors);
    if (block.type === "video") {
      reference(config.assetId, block.id, "video", byId, errors);
      reference(config.captionsAssetId, block.id, "caption", byId, errors);
    }
    if (block.type === "audio") {
      reference(config.assetId, block.id, "audio", byId, errors);
      reference(config.captionsAssetId, block.id, "caption", byId, errors);
    }
    if (block.type === "download") reference(config.assetId, block.id, "download", byId, errors);
  }
  return errors;
}
