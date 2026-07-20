import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A small, dependency-free Markdown renderer for Bespoke AI answers.
 *
 * It intentionally supports only the subset the assistant produces — bold,
 * italic, inline code, links, headings, and ordered/unordered lists — and
 * renders everything as real React nodes (never raw HTML), so model output
 * can never inject markup. Anything it does not recognise is shown as plain
 * text, which means a stray asterisk degrades to a literal character rather
 * than leaking formatting syntax.
 */

type Block =
  | { type: "p"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

const UL_RE = /^\s*[-*+]\s+/;
const OL_RE = /^\s*\d+[.)]\s+/;
const HEADING_RE = /^\s*(#{1,6})\s+(.*)$/;

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i += 1;
      continue;
    }

    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].replace(OL_RE, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i]) &&
      !HEADING_RE.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", text: paragraph.join(" ") });
  }

  return blocks;
}

// Matches, in priority order: bold (** or __), inline code, links with a safe
// href (http(s) or site-relative), then italic (* or _). A fresh instance is
// created per call because the parser recurses and a shared stateful (`g`)
// regex would corrupt `lastIndex` across nested matches.
const INLINE_PATTERN =
  "\\*\\*(.+?)\\*\\*|__(.+?)__|`([^`]+?)`|\\[([^\\]]+?)\\]\\((https?:\\/\\/[^\\s)]+|\\/[^\\s)]*)\\)|\\*(.+?)\\*|_(.+?)_";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const inlineRe = new RegExp(INLINE_PATTERN, "g");
  while ((match = inlineRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [, bold, boldAlt, code, linkText, linkHref, italic, italicAlt] = match;
    const k = `${keyPrefix}-${key++}`;

    if (bold ?? boldAlt) {
      nodes.push(
        <strong key={k} className="font-semibold text-ktf-obsidian">
          {renderInline((bold ?? boldAlt) as string, k)}
        </strong>,
      );
    } else if (code) {
      nodes.push(
        <code
          key={k}
          className="rounded bg-ktf-surface px-1.5 py-0.5 font-mono text-[0.85em] text-ktf-obsidian"
        >
          {code}
        </code>,
      );
    } else if (linkText && linkHref) {
      const isInternal = linkHref.startsWith("/");
      nodes.push(
        isInternal ? (
          <Link
            key={k}
            href={linkHref}
            className="font-medium text-ktf-blue underline underline-offset-2 hover:text-ktf-blue-deep"
          >
            {renderInline(linkText, k)}
          </Link>
        ) : (
          <a
            key={k}
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ktf-blue underline underline-offset-2 hover:text-ktf-blue-deep"
          >
            {renderInline(linkText, k)}
          </a>
        ),
      );
    } else if (italic ?? italicAlt) {
      nodes.push(
        <em key={k} className="italic">
          {renderInline((italic ?? italicAlt) as string, k)}
        </em>,
      );
    }

    lastIndex = inlineRe.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

const HEADING_CLASS: Record<number, string> = {
  1: "text-base font-bold text-ktf-obsidian",
  2: "text-base font-bold text-ktf-obsidian",
  3: "text-[15px] font-bold text-ktf-obsidian",
  4: "text-sm font-semibold text-ktf-obsidian",
  5: "text-sm font-semibold text-ktf-obsidian",
  6: "text-sm font-semibold text-ktf-gray-700",
};

export function BespokeAIMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="grid gap-3 text-sm leading-relaxed text-ktf-obsidian">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === "heading") {
          const className = HEADING_CLASS[block.level] ?? HEADING_CLASS[4];
          return (
            <p key={key} className={className}>
              {renderInline(block.text, key)}
            </p>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={key} className="grid list-disc gap-1.5 pl-5 marker:text-ktf-gray-400">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={key} className="grid list-decimal gap-1.5 pl-5 marker:text-ktf-gray-400">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={key} className="whitespace-pre-wrap">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}
