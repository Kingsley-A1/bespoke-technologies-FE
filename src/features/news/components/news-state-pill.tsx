import { cn } from "@/lib/utils";
import type { NewsState } from "../status";

const STYLES: Record<NewsState, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-slate-200 bg-slate-50 text-slate-600" },
  scheduled: { label: "Scheduled", className: "border-blue-200 bg-blue-50 text-blue-700" },
  published: { label: "Live", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  archived: { label: "Archived", className: "border-slate-200 bg-white text-slate-400" },
};

export function NewsStatePill({ state }: { state: NewsState }) {
  const style = STYLES[state];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}
