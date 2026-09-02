/**
 * Pure text layout for printed documents. Kept free of pdf-lib so the wrapping
 * rules that decide what a client actually reads can be tested directly.
 */

export interface TextMeasurer {
  widthOfTextAtSize(text: string, size: number): number;
}

export const TRUNCATION_MARKER = "[…]";

/**
 * Wraps `text` to `maxWidth`, honouring the line breaks the author typed.
 * A blank source line stays blank so deliberate spacing survives to print.
 */
export function wrapText(
  text: string,
  measurer: TextMeasurer,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measurer.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length > 0 ? lines : [""];
}

/**
 * A last-resort ceiling so one pathological field cannot run off the page.
 * It sits far above what the input schema accepts, and when it does bite the
 * reader is told rather than silently handed a shortened document.
 */
export function clampLines(lines: string[], limit: number): string[] {
  if (limit < 1) return [];
  if (lines.length <= limit) return lines;
  return [...lines.slice(0, limit - 1), TRUNCATION_MARKER];
}
