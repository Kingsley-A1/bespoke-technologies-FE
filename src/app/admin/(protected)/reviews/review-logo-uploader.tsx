"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";

interface ReviewLogoUploaderProps {
  reviewId: string;
  hasLogo: boolean;
  disabled?: boolean;
}

export function ReviewLogoUploader({ reviewId, hasLogo, disabled }: ReviewLogoUploaderProps) {
  const router = useRouter();
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("logo", file);
      const response = await fetch(`/admin/api/reviews/${reviewId}/logo`, { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The upload failed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
        {hasLogo ? "Replace logo" : "Add project logo"}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-[11px] leading-4 text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
