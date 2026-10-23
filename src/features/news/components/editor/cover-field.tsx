"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { inputClass, labelClass } from "@/features/admin/components/admin-ui";
import { newsMediaPath } from "../../content";

export function CoverField({
  coverAssetId,
  coverAlt,
  onAltChange,
  onUpload,
}: {
  coverAssetId?: string;
  coverAlt: string;
  onAltChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files[0]);
        }}
        className={`relative overflow-hidden rounded-lg border ${dragging ? "border-ktf-blue bg-blue-50" : coverAssetId ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50"}`}
      >
        {coverAssetId ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- processed cover served from the media route */}
            <img src={newsMediaPath(coverAssetId)} alt={coverAlt} className="aspect-[16/9] w-full object-cover" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="absolute right-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replace
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex min-h-44 w-full flex-col items-center justify-center gap-2 px-6 py-8 text-center text-xs text-slate-500"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ktf-blue-deep ring-1 ring-slate-200">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="font-semibold text-slate-800">Add a cover image</span>
            <span className="max-w-xs leading-5">
              Drop an image here or click to choose. Landscape, at least 1200×630 px. It becomes the WhatsApp and social preview.
            </span>
          </button>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-xs font-semibold text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing cover and share image…
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Upload cover image"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      {error && <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</p>}
      <label className="mt-4 block">
        <span className={labelClass}>Cover alt text</span>
        <input
          className={inputClass}
          value={coverAlt}
          maxLength={300}
          onChange={(event) => onAltChange(event.target.value)}
          placeholder="Describe what the cover image shows"
        />
      </label>
    </div>
  );
}
