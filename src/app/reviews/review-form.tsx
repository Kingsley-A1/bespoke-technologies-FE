"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-lg border border-ktf-gray-300 bg-white px-3.5 text-body-sm text-ktf-obsidian shadow-xs outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/20";

const labelClass = "mb-1.5 block text-body-sm font-semibold text-ktf-navy";

/**
 * Public review submission. Reviews land as "pending" and are verified by an
 * admin before publishing — the form says so plainly.
 */
export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    if (rating === 0) {
      setError("Pick a star rating.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName: String(data.get("reviewerName") ?? ""),
          projectName: String(data.get("projectName") ?? ""),
          projectUrl: String(data.get("projectUrl") ?? ""),
          body: String(data.get("body") ?? ""),
          rating,
          website: String(data.get("website") ?? ""),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "The review could not be submitted.");
      }
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The review could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-ktf-success/25 bg-ktf-success/5 p-8 text-center sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ktf-success/10 text-ktf-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-h5 font-bold text-ktf-navy">Thank you — review received.</h3>
        <p className="mx-auto mt-3 max-w-md text-body-sm leading-body text-ktf-gray-600">
          Every review is verified against a real engagement before it is
          published. Yours is now in that queue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Your name</span>
          <input name="reviewerName" required minLength={2} maxLength={120} className={inputClass} placeholder="Ada Obi" />
        </label>
        <label>
          <span className={labelClass}>Project name</span>
          <input name="projectName" required minLength={2} maxLength={160} className={inputClass} placeholder="Clinic booking platform" />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>
          Project URL <span className="font-normal text-ktf-gray-400">(optional)</span>
        </span>
        <input name="projectUrl" type="url" maxLength={300} className={inputClass} placeholder="https://…" />
      </label>

      <div>
        <span className={labelClass}>Your rating</span>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Star rating"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hovered || rating);
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                className="rounded p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    active ? "fill-ktf-warning text-ktf-warning" : "text-ktf-gray-300",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className={labelClass}>Your review</span>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className={cn(inputClass, "h-auto py-3 leading-body")}
          placeholder="What was delivered, and how was the experience? (at least 10 characters)"
        />
      </label>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && (
        <p role="alert" className="rounded-lg border border-ktf-error/25 bg-ktf-error/5 p-3 text-body-sm text-ktf-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ktf-blue-deep px-6 text-body-sm font-semibold text-white shadow-sm transition-colors hover:bg-ktf-blue-pressed disabled:opacity-60 sm:w-auto"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit review for verification
      </button>
      <p className="text-caption text-ktf-gray-500">
        Reviews are checked against real engagements before publishing.
      </p>
    </form>
  );
}
