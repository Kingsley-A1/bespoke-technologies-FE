import Link from "next/link";
import { CalendarClock, CircleDollarSign, Clock3, FilePlus2, Play, Search } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { calculateDocumentTotals, formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { inputClass, MetricCard, Panel, PanelHeader, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { runRecurringAction } from "../actions";

const PAGE_SIZE = 20;

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string; page?: string }> }) {
  await requireAdminPermission("billing.manage");
  const snapshot = await getAdminSnapshot();
  const filters = await searchParams;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const type = filters.type ?? "all";
  const status = filters.status ?? "all";
  const page = Math.max(1, Number(filters.page) || 1);
  const matching = snapshot.documents.filter((document) =>
    (!query || [document.documentNumber, document.client.name, document.client.email].some((value) => value.toLowerCase().includes(query)))
    && (type === "all" || document.type === type)
    && (status === "all" || document.status === status || document.recurrence?.state === status),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const documents = matching.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);
  const issued = snapshot.documents.filter((document) => document.type !== "recurring" && !["draft", "pending_approval", "approved", "voided"].includes(document.status) && document.currency === "NGN");
  const outstanding = issued.reduce((sum, document) => sum + calculateDocumentTotals(document, snapshot.payments).balance, 0);
  const paid = snapshot.payments.filter((payment) => payment.state === "recorded" && payment.currency === "NGN").reduce((sum, payment) => sum + payment.amount, 0);
  const schedules = snapshot.documents.filter((document) => document.type === "recurring");
  const recurringValue = schedules.filter((document) => document.currency === "NGN" && document.recurrence?.state === "active").reduce((sum, document) => sum + calculateDocumentTotals(document).total, 0);
  const failedJobs = snapshot.recurringRuns.filter((run) => run.state === "failed");

  const pageHref = (target: number) => {
    const values = new URLSearchParams({ q: filters.q ?? "", type, status, page: String(target) });
    return `/admin/billing?${values.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="max-w-2xl text-sm leading-6 text-slate-500">Create consistent documents, reconcile delivered invoices, and keep recurring work reliable.</p><div className="flex flex-wrap gap-2"><form action={runRecurringAction}><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"><Play className="h-4 w-4" /> Run due schedules</button></form><Link href="/admin/billing/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-ktf-blue px-4 text-xs font-semibold text-white"><FilePlus2 className="h-4 w-4" /> New document</Link></div></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Outstanding" value={formatMoney(outstanding)} detail="Delivered NGN unpaid balance" icon={Clock3} tone="amber" /><MetricCard label="Payments recorded" value={formatMoney(paid)} detail="Recorded non-reversed NGN payments" icon={CircleDollarSign} tone="green" /><MetricCard label="Active recurring value" value={formatMoney(recurringValue)} detail="NGN value per active schedule run" icon={CalendarClock} tone="blue" /><MetricCard label="Failed jobs" value={String(failedJobs.length)} detail="Visible and retryable schedules" icon={CalendarClock} tone={failedJobs.length ? "rose" : "slate"} /></section>

      <Panel>
        <PanelHeader title="Billing register" description="Searchable, filtered, server-authoritative document history." />
        <form action="/admin/billing" className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_170px_190px_auto]"><label className="relative"><span className="sr-only">Search billing</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-9`} name="q" defaultValue={filters.q} placeholder="Number, client, or email" /></label><select className={inputClass} name="type" defaultValue={type}><option value="all">All types</option><option value="standard">Standard</option><option value="proforma">Proforma</option><option value="recurring">Recurring</option></select><select className={inputClass} name="status" defaultValue={status}><option value="all">All states</option><option value="draft">Draft</option><option value="pending_approval">Pending approval</option><option value="approved">Approved</option><option value="sent">Sent</option><option value="partially_paid">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="voided">Voided</option><option value="active">Active schedule</option><option value="paused">Paused schedule</option><option value="failed">Failed schedule</option></select><button className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600">Apply filters</button></form>
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-6 py-3">Document</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Open</th></tr></thead><tbody className="divide-y divide-slate-100">{documents.map((document) => { const totals = calculateDocumentTotals(document, snapshot.payments); return <tr key={document.id} className="text-sm hover:bg-slate-50/70"><td className="px-6 py-4"><p className="font-semibold text-slate-900">{document.documentNumber}</p><p className="mt-1 text-[11px] capitalize text-slate-400">{document.type}{document.recurrence ? ` · ${document.recurrence.frequency}` : ""}{document.revision > 1 ? ` · revision ${document.revision}` : ""}</p></td><td className="px-4 py-4"><p className="font-medium text-slate-700">{document.client.name}</p><p className="mt-1 text-xs text-slate-400">{document.client.email}</p></td><td className="px-4 py-4 text-xs text-slate-500">{formatAdminDate(document.issueDate)}</td><td className="px-4 py-4 font-semibold text-slate-800">{formatMoney(totals.total, document.currency)}</td><td className="px-4 py-4 font-semibold text-slate-800">{formatMoney(totals.balance, document.currency)}</td><td className="px-4 py-4"><StatusPill value={document.recurrence?.state ?? document.status} /></td><td className="px-6 py-4 text-right"><Link href={`/admin/billing/${document.id}`} className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">Review</Link></td></tr>; })}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>{matching.length} matching documents · page {Math.min(page, totalPages)} of {totalPages}</span><div className="flex gap-2">{page > 1 && <Link className="rounded-lg border border-slate-200 px-3 py-2 font-semibold" href={pageHref(page - 1)}>Previous</Link>}{page < totalPages && <Link className="rounded-lg border border-slate-200 px-3 py-2 font-semibold" href={pageHref(page + 1)}>Next</Link>}</div></div>
      </Panel>

      {(snapshot.recurringRuns.length > 0 || schedules.some((document) => document.recurrence?.lastError)) && <Panel><PanelHeader title="Recurring job history" description="Completed and failed runs remain visible; failed schedules can be retried from their document." /><div className="divide-y divide-slate-100">{snapshot.recurringRuns.slice(0, 20).map((run) => { const template = snapshot.documents.find((document) => document.id === run.templateDocumentId); return <article key={run.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"><div><Link href={`/admin/billing/${run.templateDocumentId}`} className="text-sm font-semibold text-slate-800 hover:text-ktf-blue">{template?.documentNumber ?? "Recurring schedule"}</Link><p className="mt-1 text-[11px] text-slate-400">Due {formatAdminDate(run.dueDate)} · started {formatAdminDate(run.createdAt)}</p>{run.error && <p className="mt-2 text-xs text-rose-700">{run.error}</p>}</div><StatusPill value={run.state} /></article>; })}</div></Panel>}
    </div>
  );
}
