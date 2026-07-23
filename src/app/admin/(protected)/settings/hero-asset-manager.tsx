"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Smartphone, Trash2 } from "lucide-react";

const SLOTS = [
  { key: "hero-phone-1", label: "Left phone", hint: "Portrait screenshot — shown tilted left" },
  { key: "hero-phone-2", label: "Center phone", hint: "Portrait screenshot — the lead device" },
  { key: "hero-phone-3", label: "Right phone", hint: "Portrait screenshot — shown tilted right" },
] as const;

type SlotKey = (typeof SLOTS)[number]["key"];

interface HeroAssetManagerProps {
  /** Slot keys that currently have an uploaded screenshot. */
  configured: SlotKey[];
  storageReady: boolean;
}

export function HeroAssetManager({ configured, storageReady }: HeroAssetManagerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<SlotKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const inputs = useRef<Partial<Record<SlotKey, HTMLInputElement | null>>>({});

  async function upload(key: SlotKey, file: File) {
    setBusy(key);
    setError(null);
    try {
      const body = new FormData();
      body.set("key", key);
      body.set("image", file);
      const response = await fetch("/admin/api/site-assets", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The upload failed.");
      setVersion((current) => current + 1);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(key: SlotKey) {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch(`/admin/api/site-assets?key=${key}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The removal failed.");
      setVersion((current) => current + 1);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The removal failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-5 sm:p-6">
      {!storageReady && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Image storage is not configured. Add the Cloudflare R2 environment variables to enable
          hero screenshot uploads. The homepage renders its designed fallback until then.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {SLOTS.map((slot) => {
          const isSet = configured.includes(slot.key);
          const isBusy = busy === slot.key;
          return (
            <article key={slot.key} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900">{slot.label}</p>
                <Smartphone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </div>
              <div className="mt-3 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                {isSet ? (
                  // eslint-disable-next-line @next/next/no-img-element -- streamed private-route image with cache-busting
                  <img
                    src={`/api/site-assets/${slot.key}?v=${version}`}
                    alt={`${slot.label} screenshot`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="px-4 text-center text-[11px] leading-4 text-slate-400">
                    Designed fallback in use
                  </p>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-slate-400">{slot.hint}</p>
              <input
                ref={(node) => {
                  inputs.current[slot.key] = node;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(slot.key, file);
                  event.target.value = "";
                }}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={!storageReady || isBusy}
                  onClick={() => inputs.current[slot.key]?.click()}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-2.5 text-[11px] font-semibold text-white transition disabled:opacity-40"
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {isSet ? "Replace" : "Upload"}
                </button>
                {isSet && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void remove(slot.key)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-700 disabled:opacity-40"
                    aria-label={`Remove ${slot.label} screenshot`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
