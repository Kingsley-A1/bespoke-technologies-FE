import Link from "next/link";
import { CalendarDays, CircleAlert, ListChecks, Plus } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { inputClass, labelClass, Panel, PanelHeader, primaryButtonClass, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import {
  createMilestoneAction,
  createProjectAction,
  createTaskAction,
  updateMilestoneStateAction,
  updateProjectStateAction,
  updateTaskStatusAction,
} from "../actions";

export default async function ProjectsPage() {
  const session = await requireAdminPermission("projects.manage");
  const snapshot = await getAdminSnapshot();
  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = snapshot.projects.filter((project) => !["completed", "cancelled"].includes(project.status));
  const openTasks = snapshot.tasks.filter((task) => task.status !== "done");
  const myTasks = openTasks.filter((task) => task.assigneeUserId === session.userId);
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < today);
  const blocked = openTasks.filter((task) => task.status === "blocked");
  const orderedTasks = [...snapshot.tasks].sort((left, right) => Number(right.assigneeUserId === session.userId) - Number(left.assigneeUserId === session.userId));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Active portfolio" value={String(activeProjects.length)} detail="company-wide delivery" />
        <Summary label="My open work" value={String(myTasks.length)} detail="assigned to this admin" />
        <Summary label="Overdue work" value={String(overdue.length)} detail="past due and incomplete" tone="text-rose-700" />
        <Summary label="Blocked work" value={String(blocked.length)} detail="explicitly blocked" tone="text-amber-700" />
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Plus className="h-4 w-4 text-ktf-blue" /> Add project</span><span className="text-xs font-normal text-slate-500">Connect delivery to a client</span></summary>
        <form action={createProjectAction} className="grid gap-4 border-t border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <label><span className={labelClass}>Client</span><select className={inputClass} name="clientId" required><option value="">Choose client</option>{snapshot.clients.filter((client) => client.state === "active").map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label><span className={labelClass}>Project name</span><input className={inputClass} name="name" required /></label>
          <label><span className={labelClass}>Service</span><input className={inputClass} name="service" required /></label>
          <label><span className={labelClass}>Value</span><input className={inputClass} name="commercialValue" type="number" min="0" defaultValue="0" /></label>
          <label><span className={labelClass}>Status</span><select className={inputClass} name="status" defaultValue="planned"><option value="planned">Planned</option><option value="active">Active</option><option value="blocked">Blocked</option><option value="review">Review</option><option value="completed">Completed</option><option value="on_hold">On hold</option></select></label>
          <label><span className={labelClass}>Health</span><select className={inputClass} name="health" defaultValue="on_track"><option value="on_track">On track</option><option value="at_risk">At risk</option><option value="off_track">Off track</option></select></label>
          <label><span className={labelClass}>Priority</span><select className={inputClass} name="priority" defaultValue="medium"><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label>
          <label><span className={labelClass}>Currency</span><select className={inputClass} name="currency" defaultValue="NGN"><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
          <label><span className={labelClass}>Start date</span><input className={inputClass} name="startDate" type="date" /></label>
          <label><span className={labelClass}>Due date</span><input className={inputClass} name="dueDate" type="date" /></label>
          <label className="sm:col-span-2"><span className={labelClass}>Summary</span><input className={inputClass} name="summary" /></label>
          <div className="sm:col-span-2 xl:col-span-4"><button className={primaryButtonClass}><Plus className="h-4 w-4" /> Save project</button></div>
        </form>
      </details>

      <section className="grid gap-5 2xl:grid-cols-[1.4fr_0.6fr]">
        <Panel>
          <PanelHeader title="Project portfolio" description="Health, ownership, milestones, linked commercial records, and commitments." />
          <div className="divide-y divide-slate-100">
            {snapshot.projects.map((project) => {
              const client = snapshot.clients.find((candidate) => candidate.id === project.clientId);
              const lead = snapshot.leads.find((candidate) => candidate.id === project.leadId);
              const documents = snapshot.documents.filter((document) => document.projectId === project.id);
              const paymentValue = snapshot.payments.filter((payment) => documents.some((document) => document.id === payment.documentId) && payment.state === "recorded").reduce((sum, payment) => sum + payment.amount, 0);
              const complete = project.milestones.filter((milestone) => milestone.state === "completed").length;
              return (
                <article key={project.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-950">{project.name}</h3><p className="mt-1 text-xs text-slate-500">{client?.name} · {project.service}{lead ? ` · from ${lead.source}` : ""}</p></div><div className="flex gap-2"><StatusPill value={project.health} /><StatusPill value={project.status} /></div></div>
                  <p className="mt-4 text-xs leading-5 text-slate-600">{project.summary}</p>
                  <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-4"><Fact label="Value" value={formatMoney(project.commercialValue, project.currency)} /><Fact label="Received" value={formatMoney(paymentValue, project.currency)} /><Fact label="Due" value={formatAdminDate(project.dueDate)} /><Fact label="Milestones" value={`${complete}/${project.milestones.length} completed`} /></div>
                  <form action={updateProjectStateAction} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="id" value={project.id} /><select className={`${inputClass} w-auto`} name="status" defaultValue={project.status}><option value="planned">Planned</option><option value="active">Active</option><option value="blocked">Blocked</option><option value="review">Review</option><option value="completed">Completed</option><option value="on_hold">On hold</option><option value="cancelled">Cancelled</option></select><select className={`${inputClass} w-auto`} name="health" defaultValue={project.health}><option value="on_track">On track</option><option value="at_risk">At risk</option><option value="off_track">Off track</option></select><button className="h-10 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold">Update state</button>{documents.map((document) => <Link key={document.id} href={`/admin/billing/${document.id}`} className="inline-flex h-10 items-center rounded-lg border border-blue-200 px-3 text-[11px] font-semibold text-blue-700">{document.documentNumber}</Link>)}</form>
                  {(project.status === "blocked" || project.health !== "on_track") && <p className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"><CircleAlert className="h-4 w-4" /> {project.status === "blocked" ? "Delivery is blocked and needs intervention." : `Delivery health is ${project.health.replaceAll("_", " ")}.`}</p>}
                  <div className="mt-5 border-t border-slate-100 pt-4"><div className="space-y-2">{project.milestones.map((milestone) => <form key={milestone.id} action={updateMilestoneStateAction} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={milestone.id} /><span className="min-w-0 flex-1 text-xs font-medium text-slate-700">{milestone.title} <span className="font-normal text-slate-400">· {formatAdminDate(milestone.dueDate)}</span></span><select className="h-8 rounded-lg border border-slate-200 px-2 text-[11px]" name="state" defaultValue={milestone.state}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select><button className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold">Save</button></form>)}</div><details className="mt-3"><summary className="cursor-pointer text-[11px] font-semibold text-ktf-blue">+ Add milestone</summary><form action={createMilestoneAction} className="mt-2 grid gap-2 sm:grid-cols-[1fr_150px_180px_auto]"><input type="hidden" name="projectId" value={project.id} /><input className={inputClass} name="title" placeholder="Milestone" required /><input className={inputClass} name="dueDate" type="date" /><select className={inputClass} name="ownerUserId"><option value="">Current admin</option>{snapshot.users.filter((user) => user.state === "active").map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select><button className={primaryButtonClass}>Add</button></form></details></div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Team tasks" description="My work appears first; overdue and blocked states use text labels." action={<ListChecks className="h-4 w-4 text-blue-700" />} />
          <details className="border-b border-slate-100"><summary className="cursor-pointer list-none px-5 py-3 text-xs font-semibold text-ktf-blue">+ Add task</summary><form action={createTaskAction} className="space-y-3 border-t border-slate-100 p-4"><label><span className={labelClass}>Task</span><input className={inputClass} name="title" required /></label><label><span className={labelClass}>Project</span><select className={inputClass} name="projectId"><option value="">General</option>{snapshot.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label><span className={labelClass}>Assignee</span><select className={inputClass} name="assigneeUserId"><option value="">Current admin</option>{snapshot.users.filter((user) => user.state === "active").map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Priority</span><select className={inputClass} name="priority" defaultValue="medium"><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label><label><span className={labelClass}>Due</span><input className={inputClass} name="dueDate" type="date" /></label></div><input type="hidden" name="status" value="todo" /><button className={primaryButtonClass}>Save task</button></form></details>
          <div className="divide-y divide-slate-100">{orderedTasks.map((task) => { const owner = snapshot.users.find((user) => user.id === task.assigneeUserId); const project = snapshot.projects.find((candidate) => candidate.id === task.projectId); const isOverdue = task.status !== "done" && Boolean(task.dueDate && task.dueDate < today); return <article key={task.id} className="p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold leading-5 text-slate-800">{task.title}</p><StatusPill value={task.priority} /></div><p className="mt-2 text-[11px] text-slate-400">{owner?.displayName ?? "Unassigned"}{project ? ` · ${project.name}` : ""} · Due {formatAdminDate(task.dueDate)}</p>{isOverdue && <p className="mt-2 text-[11px] font-semibold text-rose-700">Overdue</p>}<form action={updateTaskStatusAction} className="mt-3 flex gap-2"><input type="hidden" name="id" value={task.id} /><select name="status" defaultValue={task.status} className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px]"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select><button className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold">Update</button></form></article>; })}</div>
        </Panel>
      </section>
    </div>
  );
}

function Summary({ label, value, detail, tone = "text-slate-950" }: { label: string; value: string; detail: string; tone?: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-3 text-2xl font-extrabold ${tone}`}>{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></article>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <p><span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span><span className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800">{label === "Due" && <CalendarDays className="h-3.5 w-3.5" />}{value}</span></p>;
}
