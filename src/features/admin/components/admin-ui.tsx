import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "slate" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" strokeWidth={1.8} /></span>
      </div>
    </article>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes("paid") || normalized.includes("completed") || normalized.includes("won") || normalized.includes("active") || normalized.includes("approved") || normalized.includes("on_track")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized.includes("overdue") || normalized.includes("blocked") || normalized.includes("off_track") || normalized.includes("void") || normalized.includes("lost") || normalized.includes("failed") || normalized.includes("suspended")
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : normalized.includes("pending") || normalized.includes("at_risk") || normalized.includes("proposal") || normalized.includes("review") || normalized.includes("urgent")
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : normalized.includes("sent") || normalized.includes("qualified") || normalized.includes("discovery") || normalized.includes("in_progress")
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-slate-50 text-slate-600";
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize", tone)}>{value.replaceAll("_", " ")}</span>;
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]", className)}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
      <div>
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">{body}</p>
    </div>
  );
}

export const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/20";
export const textareaClass = "min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/20";
export const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";
export const primaryButtonClass = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ktf-blue px-4 text-xs font-semibold text-white transition hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";

