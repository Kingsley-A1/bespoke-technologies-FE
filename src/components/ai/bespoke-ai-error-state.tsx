"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock3,
  LifeBuoy,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  getBespokeAIErrorPayload,
  type BespokeAIErrorPayload,
} from "@/lib/ai/bespoke-ai-errors";
import { cn } from "@/lib/utils";

type BespokeAIErrorStateProps = {
  error: Error;
  onRetry?: () => void;
  className?: string;
};

export function BespokeAIErrorState({
  error,
  onRetry,
  className,
}: BespokeAIErrorStateProps) {
  const payload = getBespokeAIErrorPayload(error);
  const icon = getErrorIcon(payload);

  return (
    <div
      className={cn(
        "rounded-2xl border border-ktf-gray-200 bg-ktf-surface/70 p-4 shadow-xs sm:p-5",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className={getIconShellClassName(payload)}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ktf-gray-500">
            Assistant unavailable for the moment
          </p>
          <h3 className="mt-2 text-base font-semibold text-ktf-obsidian">
            {payload.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ktf-gray-700">
            {payload.message}
          </p>
          <p className="mt-2 text-sm font-medium text-ktf-gray-600">
            {payload.recoveryLabel}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {payload.canRetry && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-ktf-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            ) : null}
            {payload.contactRecommended ? (
              <Link
                href="/contact"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ktf-gray-300 bg-white px-4 text-sm font-semibold text-ktf-obsidian transition-colors hover:border-ktf-blue/35 hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
              >
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                Contact the team
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function getErrorIcon(payload: BespokeAIErrorPayload) {
  switch (payload.type) {
    case "rate-limit":
      return <Clock3 className="h-4 w-4" aria-hidden="true" />;
    case "provider-overloaded":
    case "quota-exhausted":
      return <TriangleAlert className="h-4 w-4" aria-hidden="true" />;
    case "not-configured":
      return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
    default:
      return <TriangleAlert className="h-4 w-4" aria-hidden="true" />;
  }
}

function getIconShellClassName(payload: BespokeAIErrorPayload) {
  switch (payload.type) {
    case "rate-limit":
      return "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ktf-blue/10 text-ktf-blue";
    case "invalid-request":
      return "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ktf-warning/12 text-ktf-warning";
    default:
      return "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ktf-error/8 text-ktf-error";
  }
}
