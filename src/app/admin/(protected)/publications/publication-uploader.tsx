"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicationKind } from "@/features/admin/types";
import { inputClass, labelClass, primaryButtonClass, textareaClass } from "@/features/admin/components/admin-ui";
import { UploadLoading } from "@/features/admin/components/admin-loading";

const KIND_OPTIONS: { value: PublicationKind; label: string; help: string }[] = [
  { value: "handover", label: "Project handover doc", help: "Preview-only proof. Never downloadable by the public." },
  { value: "book", label: "Book", help: "Readable and downloadable. Shown with a priced, styled card." },
  { value: "research", label: "Research", help: "Readable and downloadable research paper." },
];

const CARD_VARIANTS = [
  { value: "standard", label: "Standard" },
  { value: "field-guide", label: "Field guide" },
  { value: "playbook", label: "Playbook" },
  { value: "deep-dive", label: "Deep dive" },
];

export function PublicationUploader() {
  const router = useRouter();
  const [kind, setKind] = useState<PublicationKind>("handover");
  const [isFree, setIsFree] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const body = new FormData(form);
    body.set("isFree", isFree ? "true" : "false");

    try {
      const response = await fetch("/admin/api/publications", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!response.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      setSuccess("Publication saved.");
      form.reset();
      setKind("handover");
      setIsFree(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <label className="sm:col-span-2">
        <span className={labelClass}>Type</span>
        <select
          className={inputClass}
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as PublicationKind)}
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-[11px] text-slate-500">
          {KIND_OPTIONS.find((option) => option.value === kind)?.help}
        </span>
      </label>

      <label className="sm:col-span-2">
        <span className={labelClass}>Title</span>
        <input className={inputClass} name="title" required minLength={3} maxLength={160} />
      </label>

      <label className="sm:col-span-2">
        <span className={labelClass}>Summary</span>
        <textarea className={textareaClass} name="summary" maxLength={600} placeholder="A short description shown on the card and detail page." />
      </label>

      <label>
        <span className={labelClass}>Cover image (PNG/JPG/WebP, ≤5 MB)</span>
        <input className={inputClass} type="file" name="cover" accept="image/png,image/jpeg,image/webp" />
      </label>
      <label>
        <span className={labelClass}>Document (PDF, ≤25 MB)</span>
        <input className={inputClass} type="file" name="document" accept="application/pdf" />
        <span className="mt-1 block text-[11px] text-ktf-gray-500">Optional for drafts. Upload it later before publishing.</span>
      </label>

      <label>
        <span className={labelClass}>Number of pages</span>
        <input className={inputClass} type="number" name="pageCount" min={0} max={100000} />
      </label>

      {kind === "handover" && (
        <>
          <label>
            <span className={labelClass}>Client label</span>
            <input className={inputClass} name="clientLabel" maxLength={160} placeholder="e.g. Luminary College" />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Project label</span>
            <input className={inputClass} name="projectLabel" maxLength={160} placeholder="e.g. Admissions & school portal" />
          </label>
        </>
      )}

      {kind === "book" && (
        <>
          <label>
            <span className={labelClass}>Author</span>
            <input className={inputClass} name="authorLabel" maxLength={160} defaultValue="Bespoke Technologies Team" />
          </label>
          <label>
            <span className={labelClass}>Card style</span>
            <select className={inputClass} name="cardVariant" defaultValue="standard">
              {CARD_VARIANTS.map((variant) => (
                <option key={variant.value} value={variant.value}>
                  {variant.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-ktf-blue"
              checked={isFree}
              onChange={(event) => setIsFree(event.target.checked)}
            />
            <span className="text-xs font-semibold text-slate-700">Free</span>
          </label>
          {!isFree && (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label>
                <span className={labelClass}>Price</span>
                <input className={inputClass} type="number" name="priceAmount" min={0} step="0.01" />
              </label>
              <label>
                <span className={labelClass}>Currency</span>
                <select className={inputClass} name="priceCurrency" defaultValue="NGN">
                  <option>NGN</option>
                  <option>USD</option>
                  <option>GBP</option>
                  <option>EUR</option>
                </select>
              </label>
            </div>
          )}
        </>
      )}

      {(kind === "research") && (
        <label className="sm:col-span-2">
          <span className={labelClass}>Author</span>
          <input className={inputClass} name="authorLabel" maxLength={160} defaultValue="Bespoke Technologies Team" />
        </label>
      )}

      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" name="publish" value="true" className="h-4 w-4 rounded border-slate-300 text-ktf-blue" />
        <span className="text-xs font-semibold text-slate-700">Publish immediately</span>
      </label>

      {error && (
        <p role="alert" className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </p>
      )}
      {success && (
        <p className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {success}
        </p>
      )}

      {pending && <div className="sm:col-span-2"><UploadLoading label="Saving files and publication" /></div>}

      <div className="sm:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "Uploading…" : "Save publication"}
        </button>
      </div>
    </form>
  );
}
