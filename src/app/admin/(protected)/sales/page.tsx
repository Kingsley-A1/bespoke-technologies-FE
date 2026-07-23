import { Plus, Search, TrendingUp } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { EmptyPanel, inputClass, labelClass, Panel, PanelHeader, primaryButtonClass, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import type { LeadStage } from "@/features/admin/types";
import { addLeadActivityAction, convertLeadToDeliveryAction, createLeadAction, updateLeadStageAction } from "../actions";

const stages: LeadStage[] = ["new", "qualified", "discovery", "proposal", "negotiation", "won", "lost", "archived"];

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  await requireAdminPermission("crm.manage");
  const snapshot = await getAdminSnapshot();
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";
  const stageFilter = (await searchParams).stage ?? "open";
  const filtered = snapshot.leads.filter((lead) => {
    const matchesQuery = !query || [lead.companyName, lead.contactName, lead.email, lead.service].some((value) => value.toLowerCase().includes(query));
    const matchesStage = stageFilter === "all" || (stageFilter === "open" ? !["won", "lost", "archived"].includes(lead.stage) : lead.stage === stageFilter);
    return matchesQuery && matchesStage;
  });
  const activePipeline = snapshot.leads.filter((lead) => !["won", "lost", "archived"].includes(lead.stage));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Open pipeline</p><p className="mt-3 text-2xl font-extrabold text-slate-950">{formatMoney(activePipeline.reduce((sum, lead) => sum + lead.estimatedValue, 0))}</p><p className="mt-1 text-xs text-slate-500">{activePipeline.length} live opportunities</p></article>
        <article className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Proposal value</p><p className="mt-3 text-2xl font-extrabold text-slate-950">{formatMoney(snapshot.leads.filter((lead) => lead.stage === "proposal").reduce((sum, lead) => sum + lead.estimatedValue, 0))}</p><p className="mt-1 text-xs text-slate-500">Ready for a commercial decision</p></article>
        <article className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Won opportunities</p><p className="mt-3 text-2xl font-extrabold text-slate-950">{snapshot.leads.filter((lead) => lead.stage === "won").length}</p><p className="mt-1 text-xs text-slate-500">Converted into delivery</p></article>
      </section>

      <details className="group rounded-lg border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Plus className="h-4 w-4 text-ktf-blue" /> Add opportunity</span><span className="text-xs font-normal text-slate-500">Manual or referred lead</span></summary>
        <form action={createLeadAction} className="grid gap-4 border-t border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <label><span className={labelClass}>Company</span><input className={inputClass} name="companyName" required /></label>
          <label><span className={labelClass}>Contact</span><input className={inputClass} name="contactName" required /></label>
          <label><span className={labelClass}>Email</span><input className={inputClass} name="email" type="email" /></label>
          <label><span className={labelClass}>Phone</span><input className={inputClass} name="phone" /></label>
          <label><span className={labelClass}>Requested service</span><input className={inputClass} name="service" required /></label>
          <label><span className={labelClass}>Source</span><input className={inputClass} name="source" defaultValue="Manual" required /></label>
          <label><span className={labelClass}>Stage</span><select className={inputClass} name="stage" defaultValue="new">{stages.slice(0, 5).map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select></label>
          <label><span className={labelClass}>Estimated value</span><input className={inputClass} name="estimatedValue" type="number" min="0" step="0.01" defaultValue="0" /></label>
          <label><span className={labelClass}>Currency</span><select className={inputClass} name="currency" defaultValue="NGN"><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
          <label className="sm:col-span-2"><span className={labelClass}>Next action</span><input className={inputClass} name="nextAction" /></label>
          <label><span className={labelClass}>Next action date</span><input className={inputClass} name="nextActionAt" type="datetime-local" /></label>
          <div className="flex items-end"><button className={primaryButtonClass}><Plus className="h-4 w-4" /> Save opportunity</button></div>
        </form>
      </details>

      <Panel>
        <PanelHeader title="Opportunity pipeline" description="Owner, stage, value, follow-up, and history remain reportable." action={<span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"><TrendingUp className="h-4 w-4" /> {activePipeline.length} open</span>} />
        <form className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row" action="/admin/sales">
          <label className="relative flex-1"><span className="sr-only">Search opportunities</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-9`} name="q" defaultValue={query} placeholder="Search company, contact, email, or service" /></label>
          <select className={`${inputClass} sm:w-44`} name="stage" defaultValue={stageFilter}><option value="open">Open stages</option><option value="all">All stages</option>{stages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select>
          <button className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600">Apply filters</button>
        </form>
        {filtered.length === 0 ? <EmptyPanel title="No matching opportunities" body="Adjust the filters or add a new lead." /> : (
          <div className="divide-y divide-slate-100">
            {filtered.map((lead) => {
              const owner = snapshot.users.find((user) => user.id === lead.ownerUserId);
              const activities = snapshot.leadActivities.filter((activity) => activity.leadId === lead.id).slice(0, 3);
              return (
                <article key={lead.id} className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:p-6">
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-950">{lead.companyName}</h3><StatusPill value={lead.stage} /></div><p className="mt-1 text-xs text-slate-500">{lead.contactName} · {lead.service}</p><p className="mt-3 text-sm font-bold text-slate-800">{formatMoney(lead.estimatedValue, lead.currency)}</p><p className="mt-1 text-[11px] text-slate-400">Owner: {owner?.displayName ?? "Unassigned"} · Source: {lead.source}</p>{lead.lostReason && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Lost reason: {lead.lostReason}</p>}</div>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Next action</p><p className="mt-2 text-xs leading-5 text-slate-600">{lead.nextAction || "No next action"}</p><p className="mt-1 text-[11px] text-slate-400">{formatAdminDate(lead.nextActionAt)}</p><div className="mt-3 space-y-1">{activities.map((activity) => <p key={activity.id} className="text-[11px] leading-4 text-slate-500">{activity.body}</p>)}</div></div>
                  <div className="space-y-3">
                    <form action={updateLeadStageAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="id" value={lead.id} /><select name="stage" defaultValue={lead.stage} className={inputClass}>{stages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select><input className={inputClass} name="lostReason" defaultValue={lead.lostReason} placeholder="Reason if marking lost" /><button className="h-10 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600">Update</button></form>
                    <form action={addLeadActivityAction} className="flex gap-2"><input type="hidden" name="id" value={lead.id} /><input className={inputClass} name="body" placeholder="Add a sales note" required /><button className="h-10 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600">Save note</button></form>
                    {!["won", "lost", "archived"].includes(lead.stage) && <form action={convertLeadToDeliveryAction}><input type="hidden" name="id" value={lead.id} /><button className={primaryButtonClass}>Win and create client, project, invoice</button></form>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
