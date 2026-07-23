import Link from "next/link";
import { ArrowRight, BadgePoundSterling, Banknote, BriefcaseBusiness, CircleAlert, Clock3, FilePlus2, FolderKanban, ShieldAlert, UserRoundSearch } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { calculateDocumentTotals, formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { MetricCard, Panel, PanelHeader, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { resolveApprovalAction } from "./actions";
import { updateMyTaskStatusAction } from "./actions";
import { listLearningGoals } from "@/features/admin/learning/repository";
import type { AdminSnapshot, LearningGoal } from "@/features/admin/types";

export default async function AdminOverviewPage() {
  const session = await requireAdminPermission("dashboard.view");
  const snapshot = await getAdminSnapshot();
  if (session.role === "employee") {
    const learningGoals = await listLearningGoals(session);
    return <EmployeeOverview snapshot={snapshot} learningGoals={learningGoals} userId={session.userId} />;
  }
  const month = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const standardDocuments = snapshot.documents.filter((document) => document.type !== "recurring" && document.status !== "voided" && document.currency === "NGN");
  const outstanding = standardDocuments.reduce((sum, document) => sum + calculateDocumentTotals(document, snapshot.payments).balance, 0);
  const paidThisMonth = snapshot.payments
    .filter((payment) => payment.state === "recorded" && payment.currency === "NGN" && payment.paidAt.startsWith(month))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const activeProjects = snapshot.projects.filter((project) => ["active", "blocked", "review"].includes(project.status));
  const openLeads = snapshot.leads.filter((lead) => !["won", "lost", "archived"].includes(lead.stage));
  const attention = [
    ...snapshot.documents.filter((document) => document.status === "overdue").map((document) => ({ id: document.id, title: `${document.documentNumber} is overdue`, detail: document.client.name, href: `/admin/billing/${document.id}`, tone: "rose" })),
    ...snapshot.projects.filter((project) => project.health !== "on_track" || project.status === "blocked").map((project) => ({ id: project.id, title: project.name, detail: project.status === "blocked" ? "Delivery is blocked" : "Project needs attention", href: "/admin/projects", tone: "amber" })),
    ...snapshot.leads.filter((lead) => lead.nextActionAt && lead.nextActionAt.slice(0, 10) <= today).map((lead) => ({ id: lead.id, title: lead.companyName, detail: lead.nextAction, href: "/admin/sales", tone: "blue" })),
  ].slice(0, 5);
  const recentDocuments = snapshot.documents.slice(0, 5);

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-ktf-blue">Bespoke command centre</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">Clear work. Stronger control.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Money, client work, delivery risks, and the next important actions in one place.</p>
        </div>
        <Link href="/admin/billing/new" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-5 text-sm font-semibold text-white shadow-sm hover:bg-ktf-blue-deep"><FilePlus2 className="h-4 w-4" /> New invoice</Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Company summary">
        <MetricCard label="Outstanding" value={formatMoney(outstanding)} detail="NGN issued unpaid invoices" icon={Clock3} tone="amber" />
        <MetricCard label="Paid this month" value={formatMoney(paidThisMonth)} detail="Confirmed NGN payments" icon={Banknote} tone="green" />
        <MetricCard label="Active projects" value={String(activeProjects.length)} detail={`${activeProjects.filter((project) => project.health !== "on_track").length} need attention`} icon={FolderKanban} tone="blue" />
        <MetricCard label="Open leads" value={String(openLeads.length)} detail={formatMoney(openLeads.filter((lead) => lead.currency === "NGN").reduce((sum, lead) => sum + lead.estimatedValue, 0)) + " NGN pipeline"} icon={UserRoundSearch} tone="slate" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <PanelHeader title="Recent billing" description="Latest client invoices and their live financial state." action={<Link href="/admin/billing" className="flex items-center gap-1 text-xs font-semibold text-ktf-blue">View all <ArrowRight className="h-3.5 w-3.5" /></Link>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-6 py-3">Invoice</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Open</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocuments.map((document) => {
                  const totals = calculateDocumentTotals(document, snapshot.payments);
                  return <tr key={document.id} className="text-sm hover:bg-slate-50/70"><td className="px-6 py-4"><p className="font-semibold text-slate-900">{document.documentNumber}</p><p className="mt-1 text-[11px] capitalize text-slate-400">{document.type}</p></td><td className="px-4 py-4"><p className="font-medium text-slate-700">{document.client.name}</p><p className="mt-1 text-xs text-slate-400">{document.client.email || "No email"}</p></td><td className="px-4 py-4 text-xs text-slate-500">{formatAdminDate(document.issueDate)}</td><td className="px-4 py-4 font-semibold text-slate-800">{formatMoney(totals.total, document.currency)}</td><td className="px-4 py-4"><StatusPill value={document.status} /></td><td className="px-6 py-4 text-right"><Link href={`/admin/billing/${document.id}`} className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">View</Link></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Needs attention" description="Exceptions worth acting on now." />
          <div className="divide-y divide-slate-100">
            {attention.length === 0 ? <p className="px-6 py-10 text-center text-xs text-slate-500">No urgent exceptions.</p> : attention.map((item) => <Link key={`${item.id}-${item.title}`} href={item.href} className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone === "rose" ? "bg-rose-50 text-rose-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}><CircleAlert className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-slate-800">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span></span></Link>)}
          </div>
        </Panel>
      </section>

      {session.role === "founder_admin" && (
        <Panel>
          <PanelHeader title="Founder approval queue" description="High-impact exceptions stay controlled without slowing ordinary work." action={<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-white"><ShieldAlert className="h-3.5 w-3.5" /> Founder only</span>} />
          <div className="grid gap-px bg-slate-200 lg:grid-cols-2">
            {snapshot.approvals.filter((approval) => approval.state === "pending").map((approval) => {
              const document = snapshot.documents.find((candidate) => candidate.id === approval.entityId);
              return <article key={approval.id} className="bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{document?.documentNumber ?? approval.action}</p><p className="mt-1 text-xs leading-5 text-slate-500">{approval.reason}</p></div><StatusPill value={approval.state} /></div><div className="mt-4 flex flex-wrap gap-2"><form action={resolveApprovalAction}><input type="hidden" name="id" value={approval.id} /><input type="hidden" name="resolution" value="approved" /><input type="hidden" name="note" value="Approved from the founder overview." /><button className="inline-flex h-9 items-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white">Approve</button></form><form action={resolveApprovalAction}><input type="hidden" name="id" value={approval.id} /><input type="hidden" name="resolution" value="rejected" /><input type="hidden" name="note" value="Returned for revision from the founder overview." /><button className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">Return</button></form>{document && <Link href={`/admin/billing/${document.id}`} className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">Review</Link>}</div></article>;
            })}
            {snapshot.approvals.every((approval) => approval.state !== "pending") && <p className="bg-white px-6 py-10 text-center text-xs text-slate-500 lg:col-span-2">No pending founder approvals.</p>}
          </div>
        </Panel>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/sales" className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"><BriefcaseBusiness className="h-5 w-5 text-blue-700" /><p className="mt-4 text-sm font-bold text-slate-900">Work the pipeline</p><p className="mt-1 text-xs leading-5 text-slate-500">Qualify leads and keep the next commercial action visible.</p></Link>
        <Link href="/admin/projects" className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"><FolderKanban className="h-5 w-5 text-blue-700" /><p className="mt-4 text-sm font-bold text-slate-900">Protect delivery</p><p className="mt-1 text-xs leading-5 text-slate-500">Resolve blocked work before it becomes a client surprise.</p></Link>
        <Link href="/admin/reports" className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"><BadgePoundSterling className="h-5 w-5 text-blue-700" /><p className="mt-4 text-sm font-bold text-slate-900">Read the business</p><p className="mt-1 text-xs leading-5 text-slate-500">Review receivables, pipeline, and delivery health by definition.</p></Link>
      </section>
    </div>
  );
}

function EmployeeOverview({ snapshot, learningGoals, userId }: { snapshot: AdminSnapshot; learningGoals: LearningGoal[]; userId: string }) {
  const tasks = snapshot.tasks.filter((task) => task.assigneeUserId === userId);
  const open = tasks.filter((task) => task.status !== "done");
  const learning = learningGoals.flatMap((goal) => goal.assignments.map((assignment) => ({ goal, assignment })));
  return <div className="space-y-6"><section><p className="text-sm font-semibold text-ktf-blue">Employee workspace</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-ktf-navy">Your work, without admin noise.</h2><p className="mt-2 text-sm text-ktf-gray-600">Only work and learning assigned to your identity appear here.</p></section><section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Open tasks" value={String(open.length)} detail="Assigned directly to you" icon={FolderKanban} tone="blue" /><MetricCard label="Blocked" value={String(open.filter((task) => task.status === "blocked").length)} detail="Needs an explicit conversation" icon={CircleAlert} tone="rose" /><MetricCard label="Learning plans" value={String(learning.length)} detail="Courses assigned to you" icon={BriefcaseBusiness} tone="green" /></section><section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><Panel><PanelHeader title="My tasks" description="Update only work assigned to your employee identity." /><div className="divide-y divide-ktf-gray-100">{tasks.map((task) => { const project = snapshot.projects.find((item) => item.id === task.projectId); return <article key={task.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-ktf-navy">{task.title}</p><p className="mt-1 text-[11px] text-ktf-gray-500">{project?.name || "General work"} · Due {formatAdminDate(task.dueDate)}</p></div><StatusPill value={task.priority} /></div><form action={updateMyTaskStatusAction} className="mt-3 flex gap-2"><input type="hidden" name="id" value={task.id} /><select name="status" defaultValue={task.status} className="h-9 flex-1 rounded-lg border border-ktf-gray-200 bg-white px-2 text-xs"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select><button className="h-9 rounded-lg bg-ktf-navy px-3 text-xs font-semibold text-white">Update</button></form></article>; })}{tasks.length === 0 && <p className="p-10 text-center text-xs text-ktf-gray-500">No tasks assigned yet.</p>}</div></Panel><Panel><PanelHeader title="My learning" description="A simple view of progress and certification readiness." /><div className="divide-y divide-ktf-gray-100">{learning.map(({ goal, assignment }) => <Link key={assignment.id} href="/admin/learning" className="block p-5 hover:bg-ktf-surface"><div className="flex justify-between gap-3"><p className="text-sm font-bold text-ktf-navy">{goal.title}</p><StatusPill value={assignment.status} /></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ktf-gray-100"><div className="h-full bg-ktf-blue" style={{ width: `${assignment.progress}%` }} /></div><p className="mt-2 text-[11px] text-ktf-gray-500">{assignment.progress}% complete</p></Link>)}{learning.length === 0 && <p className="p-10 text-center text-xs text-ktf-gray-500">No learning plans assigned yet.</p>}</div></Panel></section></div>;
}
