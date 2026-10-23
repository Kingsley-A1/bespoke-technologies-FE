/**
 * The What's New article body model.
 *
 * Articles are authored in a rich-text editor (TipTap) and stored as its
 * structured JSON document. Nothing from the editor is trusted: every save is
 * rebuilt through `normalizeNewsDocument`, which keeps only allow-listed nodes,
 * marks and attributes, validates links and image sources, and enforces size
 * limits. The public renderer only ever receives a normalized document, and it
 * never renders raw HTML.
 */

export type NewsMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "code" }
  | { type: "link"; attrs: { href: string } };

export type NewsText = { type: "text"; text: string; marks?: NewsMark[] };
export type NewsInline = NewsText | { type: "hardBreak" };

export type NewsHeadingLevel = 2 | 3 | 4;

export type NewsListItem = { type: "listItem"; content: NewsBlock[] };
export type NewsTableCell = {
  type: "tableCell" | "tableHeader";
  attrs: { colspan: number; rowspan: number };
  content: NewsBlock[];
};
export type NewsTableRow = { type: "tableRow"; content: NewsTableCell[] };

export type NewsBlock =
  | { type: "paragraph"; content?: NewsInline[] }
  | { type: "heading"; attrs: { level: NewsHeadingLevel }; content?: NewsInline[] }
  | { type: "bulletList"; content: NewsListItem[] }
  | { type: "orderedList"; attrs: { start: number }; content: NewsListItem[] }
  | { type: "blockquote"; content: NewsBlock[] }
  | { type: "codeBlock"; attrs: { language: string | null }; content?: NewsText[] }
  | { type: "horizontalRule" }
  | {
      type: "image";
      attrs: { src: string; alt: string; title: string | null; width: number | null; height: number | null };
    }
  | { type: "table"; content: NewsTableRow[] };

export type NewsDocument = { type: "doc"; content: NewsBlock[] };

export const EMPTY_NEWS_DOCUMENT: NewsDocument = { type: "doc", content: [] };

export const NEWS_MEDIA_PATH_PATTERN = /^\/news\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function newsMediaPath(assetId: string) {
  return `/news/media/${assetId}`;
}

export class NewsContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsContentError";
  }
}

const LIMITS = {
  maxDepth: 16,
  maxNodes: 20_000,
  maxTextLength: 200_000,
  maxAttrLength: 300,
  maxHrefLength: 2_048,
  maxTableSpan: 20,
};

/**
 * Returns a safe, normalized link target or `null`. Allows web, email and
 * phone links, site-relative paths and in-page anchors. Protocol-relative
 * (`//host`) and script/data URLs are rejected.
 */
export function safeNewsHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href.length > LIMITS.maxHrefLength) return null;
  if ([...href].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null;
  if (href.startsWith("#")) return /^#[\w-]{1,120}$/.test(href) ? href : null;
  if (href.startsWith("/")) return href.startsWith("//") || href.startsWith("/\\") ? null : href;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol === "https:" || url.protocol === "http:") return url.hostname ? url.toString() : null;
  if (url.protocol === "mailto:" || url.protocol === "tel:") return href;
  return null;
}

/** True for links that leave bespoketech.com.ng (rendered with a new tab and safe rel). */
export function isExternalNewsHref(href: string) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const { hostname } = new URL(href);
    return hostname !== "bespoketech.com.ng" && !hostname.endsWith(".bespoketech.com.ng");
  } catch {
    return true;
  }
}

type Counter = { nodes: number; textLength: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function children(node: Record<string, unknown>) {
  const content = node.content;
  if (content === undefined || content === null) return [];
  if (!Array.isArray(content)) throw new NewsContentError("The article body is malformed.");
  return content;
}

function shortAttr(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, LIMITS.maxAttrLength);
}

function bounded(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function tick(counter: Counter, depth: number) {
  counter.nodes += 1;
  if (counter.nodes > LIMITS.maxNodes) throw new NewsContentError("The article is too long to save.");
  if (depth > LIMITS.maxDepth) throw new NewsContentError("The article nests too many lists, quotes or tables.");
}

const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);

function normalizeMarks(value: unknown): NewsMark[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new NewsContentError("The article body is malformed.");
  const marks: NewsMark[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const mark = asRecord(raw);
    const type = mark?.type;
    if (typeof type !== "string" || seen.has(type)) continue;
    if (SIMPLE_MARKS.has(type)) {
      marks.push({ type } as NewsMark);
      seen.add(type);
      continue;
    }
    if (type === "link") {
      const href = safeNewsHref(asRecord(mark?.attrs)?.href);
      if (!href) throw new NewsContentError("A link in the article is not a valid web, email or phone address.");
      marks.push({ type: "link", attrs: { href } });
      seen.add(type);
      continue;
    }
    throw new NewsContentError(`The text formatting "${type}" is not supported.`);
  }
  return marks.length ? marks : undefined;
}

function normalizeText(node: Record<string, unknown>, counter: Counter, allowMarks: boolean): NewsText | null {
  if (typeof node.text !== "string") throw new NewsContentError("The article body is malformed.");
  if (!node.text) return null;
  counter.textLength += node.text.length;
  if (counter.textLength > LIMITS.maxTextLength) throw new NewsContentError("The article is too long to save.");
  const marks = allowMarks ? normalizeMarks(node.marks) : undefined;
  return marks ? { type: "text", text: node.text, marks } : { type: "text", text: node.text };
}

function normalizeInline(nodes: unknown[], counter: Counter, depth: number): NewsInline[] {
  const result: NewsInline[] = [];
  for (const raw of nodes) {
    const node = asRecord(raw);
    if (!node) throw new NewsContentError("The article body is malformed.");
    tick(counter, depth);
    if (node.type === "text") {
      const text = normalizeText(node, counter, true);
      if (text) result.push(text);
    } else if (node.type === "hardBreak") {
      result.push({ type: "hardBreak" });
    } else {
      throw new NewsContentError(`The inline element "${String(node.type)}" is not supported.`);
    }
  }
  return result;
}

function withInline<T extends Extract<NewsBlock, { type: "paragraph" | "heading" }>>(base: T, inline: NewsInline[]): T {
  return inline.length ? { ...base, content: inline } : base;
}

function normalizeBlocks(nodes: unknown[], counter: Counter, depth: number): NewsBlock[] {
  return nodes.map((raw) => normalizeBlock(raw, counter, depth));
}

function normalizeListItems(node: Record<string, unknown>, counter: Counter, depth: number): NewsListItem[] {
  const items = children(node).map((raw) => {
    const item = asRecord(raw);
    if (!item || item.type !== "listItem") throw new NewsContentError("A list contains an unsupported item.");
    tick(counter, depth + 1);
    const content = normalizeBlocks(children(item), counter, depth + 2);
    return { type: "listItem" as const, content: content.length ? content : [{ type: "paragraph" as const }] };
  });
  if (!items.length) throw new NewsContentError("A list in the article is empty.");
  return items;
}

function normalizeTable(node: Record<string, unknown>, counter: Counter, depth: number): NewsTableRow[] {
  const rows = children(node).map((rawRow) => {
    const row = asRecord(rawRow);
    if (!row || row.type !== "tableRow") throw new NewsContentError("A table contains an unsupported row.");
    tick(counter, depth + 1);
    const cells = children(row).map((rawCell) => {
      const cell = asRecord(rawCell);
      if (!cell || (cell.type !== "tableCell" && cell.type !== "tableHeader")) {
        throw new NewsContentError("A table contains an unsupported cell.");
      }
      tick(counter, depth + 2);
      const attrs = asRecord(cell.attrs) ?? {};
      const content = normalizeBlocks(children(cell), counter, depth + 3);
      return {
        type: cell.type,
        attrs: {
          colspan: bounded(attrs.colspan, 1, LIMITS.maxTableSpan, 1),
          rowspan: bounded(attrs.rowspan, 1, LIMITS.maxTableSpan, 1),
        },
        content: content.length ? content : [{ type: "paragraph" as const }],
      } satisfies NewsTableCell;
    });
    if (!cells.length) throw new NewsContentError("A table row has no cells.");
    return { type: "tableRow" as const, content: cells };
  });
  if (!rows.length) throw new NewsContentError("A table in the article is empty.");
  return rows;
}

function normalizeBlock(raw: unknown, counter: Counter, depth: number): NewsBlock {
  const node = asRecord(raw);
  if (!node) throw new NewsContentError("The article body is malformed.");
  tick(counter, depth);
  const attrs = asRecord(node.attrs) ?? {};

  switch (node.type) {
    case "paragraph":
      return withInline<Extract<NewsBlock, { type: "paragraph" }>>(
        { type: "paragraph" },
        normalizeInline(children(node), counter, depth + 1),
      );
    case "heading": {
      const level = bounded(attrs.level, 2, 4, 2) as NewsHeadingLevel;
      return withInline<Extract<NewsBlock, { type: "heading" }>>(
        { type: "heading", attrs: { level } },
        normalizeInline(children(node), counter, depth + 1),
      );
    }
    case "bulletList":
      return { type: "bulletList", content: normalizeListItems(node, counter, depth) };
    case "orderedList":
      return {
        type: "orderedList",
        attrs: { start: bounded(attrs.start, 1, 10_000, 1) },
        content: normalizeListItems(node, counter, depth),
      };
    case "blockquote": {
      const content = normalizeBlocks(children(node), counter, depth + 1);
      return { type: "blockquote", content: content.length ? content : [{ type: "paragraph" }] };
    }
    case "codeBlock": {
      const language = typeof attrs.language === "string" && /^[a-z0-9+#-]{1,20}$/i.test(attrs.language) ? attrs.language : null;
      const content: NewsText[] = [];
      for (const rawText of children(node)) {
        const text = asRecord(rawText);
        if (!text || text.type !== "text") throw new NewsContentError("A code block contains unsupported content.");
        tick(counter, depth + 1);
        const normalized = normalizeText(text, counter, false);
        if (normalized) content.push(normalized);
      }
      return content.length ? { type: "codeBlock", attrs: { language }, content } : { type: "codeBlock", attrs: { language } };
    }
    case "horizontalRule":
      return { type: "horizontalRule" };
    case "image": {
      const src = typeof attrs.src === "string" ? attrs.src.trim() : "";
      if (!NEWS_MEDIA_PATH_PATTERN.test(src)) {
        throw new NewsContentError(
          "The article contains an image that was not uploaded through the editor. Remove it and use Insert image instead.",
        );
      }
      const alt = shortAttr(attrs.alt);
      if (!alt) throw new NewsContentError("Every image needs alt text. Select the image and add a short description.");
      const title = shortAttr(attrs.title) || null;
      const width = bounded(attrs.width, 1, 10_000, 0) || null;
      const height = bounded(attrs.height, 1, 10_000, 0) || null;
      return { type: "image", attrs: { src, alt, title, width, height } };
    }
    case "table":
      return { type: "table", content: normalizeTable(node, counter, depth) };
    default:
      throw new NewsContentError(`The block "${String(node.type)}" is not supported in articles.`);
  }
}

/** Rebuilds untrusted editor JSON into a safe `NewsDocument`, or throws `NewsContentError`. */
export function normalizeNewsDocument(input: unknown): NewsDocument {
  const doc = asRecord(input);
  if (!doc || doc.type !== "doc") throw new NewsContentError("The article body is malformed.");
  const counter: Counter = { nodes: 0, textLength: 0 };
  const content = normalizeBlocks(children(doc), counter, 1);
  // Drop trailing empty paragraphs the editor keeps for the cursor.
  while (content.length && content.at(-1)?.type === "paragraph" && !("content" in content.at(-1)!)) content.pop();
  return { type: "doc", content };
}

/** Lenient read for stored documents: a corrupt row renders as empty instead of crashing the page. */
export function readStoredNewsDocument(input: unknown): NewsDocument {
  try {
    return normalizeNewsDocument(typeof input === "string" ? JSON.parse(input) : input);
  } catch {
    return EMPTY_NEWS_DOCUMENT;
  }
}

export function inlineText(nodes: NewsInline[] | undefined) {
  return (nodes ?? []).map((node) => (node.type === "text" ? node.text : " ")).join("");
}

function blockText(block: NewsBlock): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return inlineText(block.content);
    case "codeBlock":
      return (block.content ?? []).map((node) => node.text).join("");
    case "bulletList":
    case "orderedList":
      return block.content.map((item) => item.content.map(blockText).join("\n")).join("\n");
    case "blockquote":
      return block.content.map(blockText).join("\n");
    case "table":
      return block.content.map((row) => row.content.map((cell) => cell.content.map(blockText).join(" ")).join(" | ")).join("\n");
    case "image":
      return block.attrs.title ?? "";
    case "horizontalRule":
      return "";
  }
}

/** Plain text of the article, for descriptions, search and reading time. */
export function newsDocumentText(doc: NewsDocument) {
  return doc.content
    .map(blockText)
    .filter((text) => text.trim().length > 0)
    .join("\n\n")
    .trim();
}

export function newsReadingMinutes(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function collectNewsImageIds(doc: NewsDocument) {
  const ids: string[] = [];
  const visit = (blocks: NewsBlock[]) => {
    for (const block of blocks) {
      if (block.type === "image") {
        const match = NEWS_MEDIA_PATH_PATTERN.exec(block.attrs.src);
        if (match) ids.push(match[1]);
      } else if (block.type === "bulletList" || block.type === "orderedList") {
        block.content.forEach((item) => visit(item.content));
      } else if (block.type === "blockquote") {
        visit(block.content);
      } else if (block.type === "table") {
        block.content.forEach((row) => row.content.forEach((cell) => visit(cell.content)));
      }
    }
  };
  visit(doc.content);
  return ids;
}

/** A plain-text excerpt cut on a word boundary. */
export function excerpt(text: string, maxLength = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > maxLength * 0.6 ? cut.slice(0, boundary) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}

export function headingAnchor(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "section"
  );
}
