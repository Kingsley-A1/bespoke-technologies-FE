import { parseContentBlock } from "./content/schemas";

type Fields = Record<string, string | undefined>;
const value = (fields: Fields, name: string) => fields[name]?.trim() ?? "";
const optional = (fields: Fields, name: string) => value(fields, name) || undefined;
const truthy = (fields: Fields, name: string) => value(fields, name) === "true";

function choices(fields: Fields) {
  return value(fields, "options").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [id, label, feedback, correct] = line.split("|").map((part) => part.trim());
    return { id, label, feedback, correct: correct === "true" };
  });
}

function slideAssets(fields: Fields) {
  return value(fields, "slides").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [assetId, altText] = line.split("|").map((part) => part.trim());
    return { assetId, altText, decorative: false };
  });
}

export function blockFromAuthoringInput(input: { id: string; type: string; order: number; required: boolean; completionRule: string; fields: Fields }) {
  const base = { id: input.id.trim(), type: input.type, order: input.order, required: input.required, completionRule: input.completionRule };
  const fields = input.fields;
  let config: unknown;
  switch (input.type) {
    case "rich_text": config = { paragraphs: value(fields, "paragraphs").split("\n").map((paragraph) => paragraph.trim()).filter(Boolean) }; break;
    case "callout": config = { title: value(fields, "title"), body: value(fields, "body"), tone: value(fields, "tone") || "info" }; break;
    case "image": config = { assetId: value(fields, "assetId"), altText: optional(fields, "altText"), decorative: truthy(fields, "decorative"), caption: optional(fields, "caption") }; break;
    case "slides": config = { slides: slideAssets(fields) }; break;
    case "video":
    case "audio": config = { assetId: value(fields, "assetId"), captionsAssetId: optional(fields, "captionsAssetId"), transcript: optional(fields, "transcript") }; break;
    case "download": config = { assetId: value(fields, "assetId"), label: value(fields, "label"), description: optional(fields, "description") }; break;
    case "quiz":
    case "interactive": {
      const kind = value(fields, "kind") || "single_choice";
      config = kind === "short_structured_response"
        ? { kind, prompt: value(fields, "prompt"), instructions: optional(fields, "instructions"), guidance: value(fields, "guidance"), retryLimit: Number(value(fields, "retryLimit") || "0") }
        : { kind, prompt: value(fields, "prompt"), instructions: optional(fields, "instructions"), options: choices(fields), retryLimit: Number(value(fields, "retryLimit") || "0") };
      break;
    }
    case "reflection": config = { prompt: value(fields, "prompt"), guidance: optional(fields, "guidance"), artifactKind: value(fields, "artifactKind") || "reflection" }; break;
    default: config = {};
  }
  return parseContentBlock({ ...base, config });
}
