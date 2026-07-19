import { Fingerprint, ShieldCheck } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate } from "@/features/admin/billing/money";
import { EmptyPanel, Panel, PanelHeader } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";

export default async function ActivityPage() {
  await requireAdminPermission("audit.view");
  const snapshot = await getAdminSnapshot();
  return <Panel><PanelHeader title="Append-only activity history" description="Security and business-critical actions remain attributable to a named administrator." action={<span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Founder access</span>} />{snapshot.audits.length === 0 ? <EmptyPanel title="No activity yet" body="New admin actions will be recorded here." /> : <div className="divide-y divide-slate-100">{snapshot.audits.map((event) => <article key={event.id} className="flex gap-4 px-5 py-4 sm:px-6"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Fingerprint className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{event.action.replaceAll(".", " ")}</p><time className="text-[11px] text-slate-400">{formatAdminDate(event.createdAt)}</time></div><p className="mt-1 text-xs text-slate-500">{event.actorLabel} · {event.entityType}{event.entityId ? ` · ${event.entityId}` : ""}</p>{event.reason && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{event.reason}</p>}</div></article>)}</div>}</Panel>;
}
