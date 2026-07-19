import Link from "next/link";
import { BarChart3, Download, Landmark, TimerReset, TrendingUp } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { calculateDocumentTotals, formatMoney } from "@/features/admin/billing/money";
import { MetricCard, Panel, PanelHeader, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";

export default async function ReportsPage() {
  const session = await requireAdminPermission("reports.view");
  const snapshot = await getAdminSnapshot();
  const today = new Date().toISOString().slice(0, 10);
  const ngnDocuments = snapshot.documents.filter((document) => document.currency === "NGN" && document.type !== "recurring" && !["draft", "pending_approval", "approved", "voided"].includes(document.status));
  const receivables = ngnDocuments.reduce((sum, document) => sum + calculateDocumentTotals(document, snapshot.payments).balance, 0);
  const revenue = snapshot.payments.filter((payment) => payment.currency === "NGN" && payment.state === "recorded").reduce((sum, payment) => sum + payment.amount, 0);
  const pipeline = snapshot.leads.filter((lead) => lead.currency === "NGN" && !["won", "lost", "archived"].includes(lead.stage)).reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const aging = [
    { label: "Not due", min: Number.NEGATIVE_INFINITY, max: 0, value: 0, tone: "bg-blue-500" },
    { label: "1–30 days", min: 1, max: 30, value: 0, tone: "bg-amber-400" },
    { label: "31–60 days", min: 31, max: 60, value: 0, tone: "bg-orange-500" },
    { label: "61–90 days", min: 61, max: 90, value: 0, tone: "bg-rose-500" },
    { label: "90+ days", min: 91, max: Number.POSITIVE_INFINITY, value: 0, tone: "bg-rose-800" },
  ];
  for (const document of ngnDocuments) {
    const balance = calculateDocumentTotals(document, snapshot.payments).balance;
    if (balance <= 0) continue;
    const days = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${document.dueDate}T00:00:00Z`)) / 86_400_000);
    const bucket = aging.find((item) => days >= item.min && days <= item.max);
    if (bucket) bucket.value += balance;
  }
  const maxAging = Math.max(...aging.map((item) => item.value), 1);
  const activeProjects = snapshot.projects.filter((project) => !["completed", "cancelled"].includes(project.status));
  const openTasks = snapshot.tasks.filter((task) => task.status !== "done");
  const activeSchedules = snapshot.documents.filter((document) => document.type === "recurring" && document.recurrence?.state === "active");
  const securityEvents = snapshot.audits.filter((event) => event.entityType === "admin_security" || event.action.startsWith("admin.")).length;

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4"><p className="max-w-2xl text-sm leading-6 text-slate-500">Every metric states its scope and links to its operating records. Currency totals remain separate until an approved conversion policy exists.</p>{session.role === "founder_admin" && <a href="/admin/api/export" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white"><Download className="h-4 w-4" /> Export controlled CSV</a>}</section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Link href="/admin/billing?status=paid"><MetricCard label="Revenue received" value={formatMoney(revenue)} detail="Recorded NGN payments · all time" icon={Landmark} tone="green" /></Link><Link href="/admin/billing?status=sent"><MetricCard label="Receivables" value={formatMoney(receivables)} detail="Delivered NGN unpaid balance · current" icon={TimerReset} tone="amber" /></Link><Link href="/admin/sales?stage=open"><MetricCard label="Open pipeline" value={formatMoney(pipeline)} detail="NGN leads · excluding won/lost" icon={TrendingUp} tone="blue" /></Link><Link href="/admin/projects"><MetricCard label="Delivery at risk" value={String(activeProjects.filter((project) => project.health !== "on_track" || project.status === "blocked").length)} detail={`${activeProjects.length} active projects`} icon={BarChart3} tone="rose" /></Link></section>
      <section className="grid gap-5 xl:grid-cols-2">
        <Panel><PanelHeader title="Receivables aging" description="Delivered outstanding NGN balance grouped by calendar days past due." /><div className="space-y-5 p-5 sm:p-6">{aging.map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-slate-600">{item.label}</span><span className="font-bold text-slate-900">{formatMoney(item.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.tone}`} style={{ width: `${Math.max(item.value ? 4 : 0, (item.value / maxAging) * 100)}%` }} /></div></div>)}</div></Panel>
        <Panel><PanelHeader title="Pipeline by stage" description="Open opportunity count and NGN value." /><div className="divide-y divide-slate-100">{["new", "qualified", "discovery", "proposal", "negotiation"].map((stage) => { const leads = snapshot.leads.filter((lead) => lead.stage === stage && lead.currency === "NGN"); return <Link href={`/admin/sales?stage=${stage}`} key={stage} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"><div><StatusPill value={stage} /><p className="mt-2 text-[11px] text-slate-400">{leads.length} opportunities</p></div><p className="text-sm font-bold text-slate-900">{formatMoney(leads.reduce((sum, lead) => sum + lead.estimatedValue, 0))}</p></Link>; })}</div></Panel>
        <Panel><PanelHeader title="Delivery and workload" description="Current portfolio health and operational task load." /><div className="grid grid-cols-3 gap-px bg-slate-200">{["on_track", "at_risk", "off_track"].map((health) => <div key={health} className="bg-white p-5 text-center"><p className="text-2xl font-extrabold text-slate-950">{activeProjects.filter((project) => project.health === health).length}</p><div className="mt-2"><StatusPill value={health} /></div></div>)}</div><div className="grid grid-cols-3 gap-px border-t border-slate-200 bg-slate-200 text-center"><ReportFact label="Open tasks" value={String(openTasks.length)} /><ReportFact label="Blocked" value={String(openTasks.filter((task) => task.status === "blocked").length)} /><ReportFact label="Overdue" value={String(openTasks.filter((task) => task.dueDate && task.dueDate < today).length)} /></div></Panel>
        <Panel><PanelHeader title="Recurring and security health" description="Schedule reliability and attributable security activity." /><div className="grid grid-cols-2 gap-px bg-slate-200 text-center"><ReportFact label="Active schedules" value={String(activeSchedules.length)} /><ReportFact label="Failed runs" value={String(snapshot.recurringRuns.filter((run) => run.state === "failed").length)} /><ReportFact label="Completed runs" value={String(snapshot.recurringRuns.filter((run) => run.state === "completed").length)} /><ReportFact label="Security events" value={String(securityEvents)} /></div></Panel>
        <Panel className="xl:col-span-2"><PanelHeader title="Report definitions" description="The controls behind each headline number." /><dl className="grid divide-y divide-slate-100 text-xs md:grid-cols-3 md:divide-x md:divide-y-0"><Definition title="Revenue received">Recorded, non-reversed NGN payment allocations. It is not issued invoice value.</Definition><Definition title="Receivables">Delivered NGN document total less recorded, non-reversed payments. Draft and merely approved documents are excluded.</Definition><Definition title="Open pipeline">Estimated NGN value of leads not marked won, lost, or archived.</Definition></dl></Panel>
      </section>
    </div>
  );
}

function ReportFact({ label, value }: { label: string; value: string }) { return <div className="bg-white p-5"><p className="text-2xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-500">{label}</p></div>; }
function Definition({ title, children }: { title: string; children: React.ReactNode }) { return <div className="p-5"><dt className="font-bold text-slate-800">{title}</dt><dd className="mt-1 leading-5 text-slate-500">{children}</dd></div>; }
