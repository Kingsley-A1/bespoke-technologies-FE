import type { ReactNode } from "react";
import {
  headingAnchor,
  inlineText,
  isExternalNewsHref,
  safeNewsHref,
  type NewsBlock,
  type NewsDocument,
  type NewsInline,
  type NewsText,
} from "../content";

/**
 * Renders a normalized What's New document as semantic HTML. React escapes
 * all text; links and image sources are re-checked here as a second line of
 * defence, and no raw HTML is ever emitted.
 */
export function NewsArticleBody({ doc, className }: { doc: NewsDocument; className?: string }) {
  const anchors = new Map<string, number>();
  const anchorFor = (text: string) => {
    const base = headingAnchor(text);
    const seen = anchors.get(base) ?? 0;
    anchors.set(base, seen + 1);
    return seen ? `${base}-${seen + 1}` : base;
  };
  return (
    <div className={className ?? "bt-article"}>{doc.content.map((block, index) => renderBlock(block, index, anchorFor))}</div>
  );
}

/** The H2 outline of the article, used for the "On this page" navigation. */
export function newsOutline(doc: NewsDocument) {
  const anchors = new Map<string, number>();
  const outline: { id: string; text: string }[] = [];
  for (const block of doc.content) {
    if (block.type !== "heading") continue;
    const text = inlineText(block.content).trim();
    const base = headingAnchor(text);
    const seen = anchors.get(base) ?? 0;
    anchors.set(base, seen + 1);
    if (block.attrs.level === 2 && text) outline.push({ id: seen ? `${base}-${seen + 1}` : base, text });
  }
  return outline;
}

function renderText(node: NewsText, key: number): ReactNode {
  let content: ReactNode = node.text;
  let href: string | null = null;
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        content = <strong>{content}</strong>;
        break;
      case "italic":
        content = <em>{content}</em>;
        break;
      case "underline":
        content = <u>{content}</u>;
        break;
      case "strike":
        content = <s>{content}</s>;
        break;
      case "code":
        content = <code>{content}</code>;
        break;
      case "link":
        href = safeNewsHref(mark.attrs.href);
        break;
    }
  }
  if (href) {
    const external = isExternalNewsHref(href);
    return (
      <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {content}
      </a>
    );
  }
  return <span key={key}>{content}</span>;
}

function renderInline(nodes: NewsInline[] | undefined) {
  return (nodes ?? []).map((node, index) => (node.type === "hardBreak" ? <br key={index} /> : renderText(node, index)));
}

function renderBlock(block: NewsBlock, key: number, anchorFor: (text: string) => string): ReactNode {
  switch (block.type) {
    case "paragraph":
      return <p key={key}>{renderInline(block.content)}</p>;
    case "heading": {
      const Tag = `h${block.attrs.level}` as const;
      const id = anchorFor(inlineText(block.content).trim());
      return (
        <Tag key={key} id={id}>
          {renderInline(block.content)}
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul key={key}>
          {block.content.map((item, index) => (
            <li key={index}>{item.content.map((child, childIndex) => renderBlock(child, childIndex, anchorFor))}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} start={block.attrs.start === 1 ? undefined : block.attrs.start}>
          {block.content.map((item, index) => (
            <li key={index}>{item.content.map((child, childIndex) => renderBlock(child, childIndex, anchorFor))}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return <blockquote key={key}>{block.content.map((child, index) => renderBlock(child, index, anchorFor))}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key} data-language={block.attrs.language ?? undefined}>
          <code>{(block.content ?? []).map((node) => node.text).join("")}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return (
        <figure key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element -- already resized WebP served from the immutable media route */}
          <img
            src={block.attrs.src}
            alt={block.attrs.alt}
            width={block.attrs.width ?? undefined}
            height={block.attrs.height ?? undefined}
            loading="lazy"
            decoding="async"
          />
          {block.attrs.title && <figcaption>{block.attrs.title}</figcaption>}
        </figure>
      );
    case "table":
      return (
        <div key={key} className="bt-article-table" role="region" aria-label="Table" tabIndex={0}>
          <table>
            <tbody>
              {block.content.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.content.map((cell, cellIndex) => {
                    const Cell = cell.type === "tableHeader" ? "th" : "td";
                    return (
                      <Cell
                        key={cellIndex}
                        colSpan={cell.attrs.colspan > 1 ? cell.attrs.colspan : undefined}
                        rowSpan={cell.attrs.rowspan > 1 ? cell.attrs.rowspan : undefined}
                        scope={cell.type === "tableHeader" ? (rowIndex === 0 ? "col" : "row") : undefined}
                      >
                        {cell.content.map((child, index) => renderBlock(child, index, anchorFor))}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
