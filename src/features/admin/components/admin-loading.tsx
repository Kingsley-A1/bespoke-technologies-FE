"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, label = "Loading", decorative = false }: { className?: string; label?: string; decorative?: boolean }) {
  return (
    <span role={decorative ? undefined : "status"} aria-hidden={decorative || undefined} className={cn("inline-flex items-center gap-2", className)}>
      <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? <><LoadingSpinner /><span>{pendingLabel}</span></> : children}
    </button>
  );
}

export function PageLoader({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <div className="relative h-1 overflow-hidden rounded-full bg-ktf-gray-200 bt-loading-rail" />
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-44 animate-pulse rounded bg-ktf-gray-200" />
          <div className="h-3 w-72 max-w-[70vw] animate-pulse rounded bg-ktf-gray-100" />
        </div>
        <LoadingSpinner className="text-ktf-blue" label={label} decorative />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border border-ktf-gray-200 bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-ktf-gray-200 bg-white" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function UploadLoading({ progress, label = "Uploading securely" }: { progress?: number; label?: string }) {
  const known = typeof progress === "number";
  return (
    <div role="status" className="rounded-lg border border-ktf-blue/20 bg-ktf-blue/5 p-3 text-xs text-ktf-navy">
      <div className="flex items-center justify-between gap-3"><span>{label}</span><span>{known ? `${Math.round(progress)}%` : <LoadingSpinner decorative />}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ktf-blue/10">
        <div className={cn("h-full bg-ktf-blue transition-[width]", !known && "relative w-full overflow-hidden bt-loading-rail")} style={known ? { width: `${Math.max(0, Math.min(100, progress))}%` } : undefined} />
      </div>
    </div>
  );
}
