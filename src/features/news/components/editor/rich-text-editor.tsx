"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, Extension, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Code,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table2,
  TextQuote,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageDetailsDialog, ImageDialog, LinkDialog, normalizeTypedHref } from "./editor-dialogs";

export interface UploadedImage {
  src: string;
  width: number;
  height: number;
}

interface RichTextEditorProps {
  initialContent: JSONContent;
  onChange: (content: JSONContent) => void;
  onUploadImage: (file: File) => Promise<UploadedImage>;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

function ToolbarButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-ktf-blue disabled:pointer-events-none disabled:opacity-35",
        active && "bg-blue-50 text-ktf-blue-deep hover:bg-blue-100 hover:text-ktf-blue-deep",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-slate-200" />;
}

function TextButton({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-semibold transition-colors",
        danger ? "text-rose-700 hover:bg-rose-50" : "text-slate-600 hover:bg-white hover:text-slate-950",
      )}
    >
      {children}
    </button>
  );
}

function blockStyle(editor: Editor) {
  for (const level of [2, 3, 4] as const) if (editor.isActive("heading", { level })) return `h${level}`;
  return "p";
}

export function RichTextEditor({ initialContent, onChange, onUploadImage }: RichTextEditorProps) {
  const [linkDialog, setLinkDialog] = useState<{ href: string; needsText: boolean } | null>(null);
  const [imageDialog, setImageDialog] = useState<{ file?: File } | null>(null);
  const [imageDetails, setImageDetails] = useState<{ alt: string; caption: string } | null>(null);
  const openLinkRef = useRef<() => void>(() => undefined);
  const openImageRef = useRef<(file?: File) => void>(() => undefined);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => Boolean(normalizeTypedHref(url)),
        },
      }),
      Image.configure({ inline: false, allowBase64: false, resize: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Write the article. Use the toolbar for headings, links, images and tables." }),
      CharacterCount,
      Extension.create({
        name: "newsShortcuts",
        addKeyboardShortcuts() {
          return {
            "Mod-k": () => {
              openLinkRef.current();
              return true;
            },
          };
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "bt-article px-5 py-6 sm:px-10 sm:py-8",
        "aria-label": "Article body",
      },
      // Pasted or dropped image files go through the upload dialog so they get alt text.
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        openImageRef.current(file);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files ?? []).find((item) => item.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        openImageRef.current(file);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
  });

  const openLink = useCallback(() => {
    if (!editor) return;
    const href = (editor.getAttributes("link").href as string | undefined) ?? "";
    setLinkDialog({ href, needsText: editor.state.selection.empty && !href });
  }, [editor]);
  useEffect(() => {
    openLinkRef.current = openLink;
    openImageRef.current = (file?: File) => setImageDialog({ file });
  }, [openLink]);

  if (!editor) {
    return <div className="min-h-[28rem] animate-pulse rounded-b-lg bg-slate-50" aria-label="Loading editor" />;
  }

  return (
    <EditorWorkspace
      editor={editor}
      linkDialog={linkDialog}
      setLinkDialog={setLinkDialog}
      imageDialog={imageDialog}
      setImageDialog={setImageDialog}
      imageDetails={imageDetails}
      setImageDetails={setImageDetails}
      openLink={openLink}
      onUploadImage={onUploadImage}
    />
  );
}

/** Rendered only once the editor exists, so its toolbar state subscribes to a live instance. */
function EditorWorkspace({
  editor,
  linkDialog,
  setLinkDialog,
  imageDialog,
  setImageDialog,
  imageDetails,
  setImageDetails,
  openLink,
  onUploadImage,
}: {
  editor: Editor;
  linkDialog: { href: string; needsText: boolean } | null;
  setLinkDialog: (value: { href: string; needsText: boolean } | null) => void;
  imageDialog: { file?: File } | null;
  setImageDialog: (value: { file?: File } | null) => void;
  imageDetails: { alt: string; caption: string } | null;
  setImageDetails: (value: { alt: string; caption: string } | null) => void;
  openLink: () => void;
  onUploadImage: (file: File) => Promise<UploadedImage>;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      return {
        style: blockStyle(current),
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        code: current.isActive("code"),
        link: current.isActive("link"),
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        blockquote: current.isActive("blockquote"),
        codeBlock: current.isActive("codeBlock"),
        table: current.isActive("table"),
        image: current.isActive("image"),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
        words: current.storage.characterCount.words() as number,
      };
    },
  });

  const chain = () => editor.chain().focus();

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-[86px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          <ToolbarButton label="Undo" shortcut={`${mod}+Z`} disabled={!state.canUndo} onClick={() => chain().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" shortcut={`${mod}+Shift+Z`} disabled={!state.canRedo} onClick={() => chain().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <label className="sr-only" htmlFor="news-block-style">
            Text style
          </label>
          <select
            id="news-block-style"
            value={state.style}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "p") chain().setParagraph().run();
              else
                chain()
                  .setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 })
                  .run();
            }}
            className="h-8 rounded-md border border-transparent bg-transparent px-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-ktf-blue"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading</option>
            <option value="h3">Subheading</option>
            <option value="h4">Small heading</option>
          </select>
          <Divider />
          <ToolbarButton label="Bold" shortcut={`${mod}+B`} active={state.bold} onClick={() => chain().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italic" shortcut={`${mod}+I`} active={state.italic} onClick={() => chain().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            shortcut={`${mod}+U`}
            active={state.underline}
            onClick={() => chain().toggleUnderline().run()}
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            shortcut={`${mod}+Shift+S`}
            active={state.strike}
            onClick={() => chain().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Inline code" shortcut={`${mod}+E`} active={state.code} onClick={() => chain().toggleCode().run()}>
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Link" shortcut={`${mod}+K`} active={state.link} onClick={openLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Bulleted list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
            <TextQuote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
            <SquareCode className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Insert image" onClick={() => setImageDialog({})}>
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Insert table"
            active={state.table}
            disabled={state.table}
            onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <Table2 className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {state.table && (
          <div
            className="flex flex-wrap items-center gap-0.5 border-t border-slate-100 bg-slate-50 px-2 py-1"
            aria-label="Table tools"
          >
            <span className="px-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Table</span>
            <TextButton onClick={() => chain().addRowBefore().run()}>Row above</TextButton>
            <TextButton onClick={() => chain().addRowAfter().run()}>Row below</TextButton>
            <TextButton onClick={() => chain().addColumnBefore().run()}>Column left</TextButton>
            <TextButton onClick={() => chain().addColumnAfter().run()}>Column right</TextButton>
            <TextButton onClick={() => chain().toggleHeaderRow().run()}>Header row</TextButton>
            <TextButton onClick={() => chain().mergeOrSplit().run()}>Merge / split</TextButton>
            <TextButton danger onClick={() => chain().deleteRow().run()}>
              Delete row
            </TextButton>
            <TextButton danger onClick={() => chain().deleteColumn().run()}>
              Delete column
            </TextButton>
            <TextButton danger onClick={() => chain().deleteTable().run()}>
              <Trash2 className="h-3 w-3" /> Table
            </TextButton>
          </div>
        )}

        {state.image && (
          <div
            className="flex flex-wrap items-center gap-0.5 border-t border-slate-100 bg-slate-50 px-2 py-1"
            aria-label="Image tools"
          >
            <span className="px-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Image</span>
            <TextButton
              onClick={() => {
                const attrs = editor.getAttributes("image");
                setImageDetails({ alt: String(attrs.alt ?? ""), caption: String(attrs.title ?? "") });
              }}
            >
              Alt text &amp; caption
            </TextButton>
            <TextButton danger onClick={() => chain().deleteSelection().run()}>
              <Trash2 className="h-3 w-3" /> Remove image
            </TextButton>
          </div>
        )}
      </div>

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-[11px] text-slate-500 sm:px-10">
        <span>
          {state.words.toLocaleString()} words · {Math.max(1, Math.round(state.words / 220))} min read
        </span>
        <span className="hidden sm:inline">Paste or drop images straight into the article</span>
      </div>

      <LinkDialog
        open={Boolean(linkDialog)}
        initialHref={linkDialog?.href ?? ""}
        needsText={linkDialog?.needsText ?? false}
        onClose={() => {
          setLinkDialog(null);
          editor.commands.focus();
        }}
        onRemove={() => {
          chain().extendMarkRange("link").unsetLink().run();
          setLinkDialog(null);
        }}
        onApply={(href, text) => {
          if (text) {
            // Clearing the stored mark means the next words typed are plain text, not part of the link.
            chain()
              .insertContent({ type: "text", text, marks: [{ type: "link", attrs: { href } }] })
              .unsetMark("link")
              .run();
          } else {
            chain().extendMarkRange("link").setLink({ href }).run();
          }
          // focus() is deferred a frame; focus now so the next keystroke never lands on the closing dialog.
          editor.view.focus();
          setLinkDialog(null);
        }}
      />

      <ImageDialog
        open={Boolean(imageDialog)}
        initialFile={imageDialog?.file}
        onClose={() => setImageDialog(null)}
        onUpload={async (file, alt, caption) => {
          const uploaded = await onUploadImage(file);
          chain()
            .setImage({ src: uploaded.src, alt, title: caption || undefined, width: uploaded.width, height: uploaded.height })
            .run();
          setImageDialog(null);
        }}
      />

      <ImageDetailsDialog
        open={Boolean(imageDetails)}
        alt={imageDetails?.alt ?? ""}
        caption={imageDetails?.caption ?? ""}
        onClose={() => setImageDetails(null)}
        onSave={(alt, caption) => {
          chain()
            .updateAttributes("image", { alt, title: caption || null })
            .run();
          setImageDetails(null);
        }}
      />
    </div>
  );
}
