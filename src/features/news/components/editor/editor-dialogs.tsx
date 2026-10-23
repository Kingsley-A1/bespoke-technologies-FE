"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/features/admin/components/admin-ui";
import { safeNewsHref } from "../../content";

/** Accepts what people type ("bespoketech.com.ng/x") and returns a safe href or null. */
export function normalizeTypedHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const direct = safeNewsHref(trimmed);
  if (direct) return direct;
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(trimmed)) return safeNewsHref(`mailto:${trimmed}`);
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(trimmed)) return safeNewsHref(`https://${trimmed}`);
  return null;
}

export function LinkDialog({
  open,
  initialHref,
  needsText,
  onApply,
  onRemove,
  onClose,
}: {
  open: boolean;
  initialHref: string;
  needsText: boolean;
  onApply: (href: string, text?: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={initialHref ? "Edit link" : "Insert link"} className="max-w-[520px]">
      {open && (
        <LinkForm initialHref={initialHref} needsText={needsText} onApply={onApply} onRemove={onRemove} onClose={onClose} />
      )}
    </Modal>
  );
}

function LinkForm({
  initialHref,
  needsText,
  onApply,
  onRemove,
  onClose,
}: {
  initialHref: string;
  needsText: boolean;
  onApply: (href: string, text?: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [href, setHref] = useState(initialHref);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  // The form stays mounted during the closing animation; never apply twice.
  const applied = useRef(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (applied.current) return;
    const safe = normalizeTypedHref(href);
    if (!safe) {
      setError("Enter a web address (https://…), an email address, a phone link (tel:) or a site path (/contact).");
      return;
    }
    if (needsText && !text.trim()) {
      setError("Add the words readers will click.");
      return;
    }
    applied.current = true;
    onApply(safe, needsText ? text.trim() : undefined);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {needsText && (
        <label className="block">
          <span className={labelClass}>Text to display</span>
          <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} autoFocus />
        </label>
      )}
      <label className="block">
        <span className={labelClass}>Link to</span>
        <input
          className={inputClass}
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="https://www.bespoketech.com.ng/contact"
          autoFocus={!needsText}
          inputMode="url"
        />
        <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">
          Readers see your text, not the address. Links to other websites open in a new tab.
        </span>
      </label>
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {initialHref ? (
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-rose-700 hover:underline">
            Remove link
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            {initialHref ? "Update link" : "Insert link"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function ImageDialog({
  open,
  initialFile,
  onUpload,
  onClose,
}: {
  open: boolean;
  initialFile?: File;
  onUpload: (file: File, alt: string, caption: string) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Modal open={open} onClose={pending ? () => undefined : onClose} title="Insert image" className="max-w-[640px]">
      {open && <ImageForm initialFile={initialFile} onUpload={onUpload} onClose={onClose} onPendingChange={setPending} />}
    </Modal>
  );
}

function ImageForm({
  initialFile,
  onUpload,
  onClose,
  onPendingChange,
}: {
  initialFile?: File;
  onUpload: (file: File, alt: string, caption: string) => Promise<void>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [file, setFile] = useState<File | undefined>(initialFile);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [pending, setPendingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function setPending(value: boolean) {
    setPendingState(value);
    onPendingChange(value);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!file) return setError("Choose an image.");
    if (!alt.trim()) return setError("Describe the image for people who cannot see it.");
    setPending(true);
    setError(null);
    try {
      await onUpload(file, alt.trim(), caption.trim());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-ktf-blue hover:bg-blue-50/40"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview before upload
          <img src={preview} alt="" className="max-h-72 w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 py-12 text-xs">
            <ImagePlus className="h-6 w-6" />
            <span className="font-semibold text-slate-700">Choose an image</span>
            <span>JPEG, PNG or WebP. Large photos are resized automatically.</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => setFile(event.target.files?.[0])}
      />
      <label className="block">
        <span className={labelClass}>Alt text (required)</span>
        <input
          className={inputClass}
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          maxLength={300}
          placeholder="What the image shows, in one sentence"
        />
      </label>
      <label className="block">
        <span className={labelClass}>Caption (optional)</span>
        <input
          className={inputClass}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={300}
          placeholder="Shown under the image"
        />
      </label>
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={secondaryButtonClass} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className={primaryButtonClass} disabled={pending || !file}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Uploading…" : "Insert image"}
        </button>
      </div>
    </form>
  );
}

export function ImageDetailsDialog({
  open,
  alt: initialAlt,
  caption: initialCaption,
  onSave,
  onClose,
}: {
  open: boolean;
  alt: string;
  caption: string;
  onSave: (alt: string, caption: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Image details" className="max-w-[520px]">
      {open && <ImageDetailsForm alt={initialAlt} caption={initialCaption} onSave={onSave} onClose={onClose} />}
    </Modal>
  );
}

function ImageDetailsForm({
  alt: initialAlt,
  caption: initialCaption,
  onSave,
  onClose,
}: {
  alt: string;
  caption: string;
  onSave: (alt: string, caption: string) => void;
  onClose: () => void;
}) {
  const [alt, setAlt] = useState(initialAlt);
  const [caption, setCaption] = useState(initialCaption);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!alt.trim()) return setError("Alt text is required.");
        onSave(alt.trim(), caption.trim());
      }}
    >
      <label className="block">
        <span className={labelClass}>Alt text (required)</span>
        <input className={inputClass} value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={300} autoFocus />
      </label>
      <label className="block">
        <span className={labelClass}>Caption (optional)</span>
        <input className={inputClass} value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={300} />
      </label>
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" className={primaryButtonClass}>
          Save
        </button>
      </div>
    </form>
  );
}
