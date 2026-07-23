import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { redirect } from "next/navigation";
import { inputClass, Panel, PanelHeader, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireAdminPermission("dashboard.view");
  if (session.role === "employee") redirect("/admin/unauthorized");
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";
  const snapshot = await getAdminSnapshot();
  const results = query ? [
    ...snapshot.clients.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, label: item.name, detail: item.email, type: "Client", status: item.state, href: "/admin/clients" })),
    ...snapshot.leads.filter((item) => `${item.companyName} ${item.contactName} ${item.service}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, label: item.companyName, detail: item.service, type: "Lead", status: item.stage, href: "/admin/sales" })),
    ...snapshot.projects.filter((item) => `${item.name} ${item.service}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, label: item.name, detail: item.service, type: "Project", status: item.status, href: "/admin/projects" })),
    ...snapshot.documents.filter((item) => `${item.documentNumber} ${item.client.name}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, label: item.documentNumber, detail: item.client.name, type: "Billing", status: item.status, href: `/admin/billing/${item.id}` })),
  ] : [];
  return <div className="space-y-5"><form className="flex gap-2"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-10`} name="q" defaultValue={query} placeholder="Search clients, leads, projects, or document numbers" autoFocus /></label><button className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white">Search</button></form><Panel><PanelHeader title={query ? `Results for “${query}”` : "Company search"} description={query ? `${results.length} matching records` : "Enter a name, company, service, or document number."} /><div className="divide-y divide-slate-100">{results.map((result) => <Link key={`${result.type}-${result.id}`} href={result.href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="text-sm font-semibold text-slate-800">{result.label}</p><p className="mt-1 text-xs text-slate-500">{result.type} · {result.detail}</p></div><StatusPill value={result.status} /></Link>)}{query && results.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No matching company records.</p>}</div></Panel></div>;
}
