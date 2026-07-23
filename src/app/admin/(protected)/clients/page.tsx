import { Building2, Mail, MapPin, Phone, Plus, Search } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { calculateDocumentTotals, formatMoney } from "@/features/admin/billing/money";
import { EmptyPanel, inputClass, labelClass, Panel, PanelHeader, primaryButtonClass, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { createClientAction, updateClientStateAction } from "../actions";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; state?: string }> }) {
  await requireAdminPermission("crm.manage");
  const snapshot = await getAdminSnapshot();
  const filters = await searchParams;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const state = filters.state ?? "active";
  const clients = snapshot.clients.filter((client) =>
    (!query || [client.name, client.email, client.phone].some((value) => value.toLowerCase().includes(query)))
    && (state === "all" || client.state === state),
  );
  return (
    <div className="space-y-6">
      <details className="group rounded-lg border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Plus className="h-4 w-4 text-ktf-blue" /> Add client</span><span className="text-xs font-normal text-slate-500">Create one shared company record</span></summary>
        <form action={createClientAction} className="grid gap-4 border-t border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <label><span className={labelClass}>Company name</span><input className={inputClass} name="name" required /></label>
          <label><span className={labelClass}>Billing contact</span><input className={inputClass} name="contactName" /></label>
          <label><span className={labelClass}>Email</span><input className={inputClass} name="email" type="email" /></label>
          <label><span className={labelClass}>Phone</span><input className={inputClass} name="phone" /></label>
          <label className="sm:col-span-2"><span className={labelClass}>Address</span><input className={inputClass} name="address" /></label>
          <label><span className={labelClass}>Currency</span><select className={inputClass} name="currency" defaultValue="NGN"><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
          <label><span className={labelClass}>Payment terms</span><select className={inputClass} name="paymentTermsDays" defaultValue="14"><option value="0">Due now</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
          <div className="sm:col-span-2 xl:col-span-4"><button className={primaryButtonClass}><Plus className="h-4 w-4" /> Save client</button></div>
        </form>
      </details>
      <Panel>
        <PanelHeader title="Client directory" description="First-class client records with delivery and billing history." action={<span className="text-xs font-semibold text-slate-500">{snapshot.clients.filter((client) => client.state === "active").length} active</span>} />
        <form action="/admin/clients" className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search clients</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-9`} name="q" defaultValue={query} placeholder="Search name, email, or phone" /></label><select className={`${inputClass} sm:w-40`} name="state" defaultValue={state}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select><button className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Apply filters</button></form>
        {clients.length === 0 ? <EmptyPanel title="No matching clients" body="Adjust the filters or create a client." /> : (
          <div className="grid gap-px bg-slate-200 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => {
              const documents = snapshot.documents.filter((document) => document.clientId === client.id);
              const projects = snapshot.projects.filter((project) => project.clientId === client.id);
              const billed = documents.reduce((sum, document) => sum + calculateDocumentTotals(document, snapshot.payments).total, 0);
              return <article key={client.id} className="bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Building2 className="h-5 w-5" /></span><StatusPill value={client.state} /></div><h3 className="mt-4 text-base font-bold text-slate-950">{client.name}</h3><p className="mt-1 text-xs text-slate-500">{projects.length} project{projects.length === 1 ? "" : "s"} · {documents.length} document{documents.length === 1 ? "" : "s"}</p><p className="mt-4 text-xl font-extrabold text-slate-900">{formatMoney(billed, client.currency)}</p><p className="text-[11px] text-slate-400">lifetime billed value</p><div className="mt-5 space-y-2 text-xs text-slate-500">{client.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {client.email}</p>}{client.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {client.phone}</p>}{client.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {client.address}</p>}</div>{client.contacts.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Billing contact</p><p className="mt-2 text-xs font-semibold text-slate-700">{client.contacts.find((contact) => contact.isBilling)?.name ?? client.contacts[0].name}</p></div>}<details className="mt-5 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-[11px] font-semibold text-slate-500">{client.state === "active" ? "Archive client" : "Restore client"}</summary><form action={updateClientStateAction} className="mt-2 flex gap-2"><input type="hidden" name="id" value={client.id} /><input type="hidden" name="state" value={client.state === "active" ? "archived" : "active"} /><input className={inputClass} name="reason" placeholder="Required reason" required /><button className="h-10 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold">Confirm</button></form></details></article>;
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
