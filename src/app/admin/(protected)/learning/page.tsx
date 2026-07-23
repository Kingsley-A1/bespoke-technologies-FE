import Link from "next/link";
import { Award, BookOpenCheck, CalendarDays, ExternalLink, Plus, Target } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate } from "@/features/admin/billing/money";
import { SubmitButton } from "@/features/admin/components/admin-loading";
import { inputClass, labelClass, Panel, PanelHeader, primaryButtonClass, StatusPill, textareaClass } from "@/features/admin/components/admin-ui";
import { CertificationUploader } from "@/features/admin/learning/certification-uploader";
import { listLearningGoals } from "@/features/admin/learning/repository";
import { getAdminSnapshot } from "@/features/admin/repository";
import { createLearningGoalAction, updateLearningProgressAction } from "../actions";

export default async function LearningPage() {
  const session = await requireAdminPermission("learning.view");
  const [goals, snapshot] = await Promise.all([listLearningGoals(session), getAdminSnapshot()]);
  const canManage = session.role !== "employee";
  const team = snapshot.users.filter((user) => user.state === "active");
  const assignments = goals.flatMap((goal) => goal.assignments);
  const completed = assignments.filter((item) => item.status === "completed").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary icon={BookOpenCheck} label="Learning goals" value={String(goals.length)} detail="Visible to this account" />
        <Summary icon={Target} label="Active assignments" value={String(assignments.filter((item) => item.status !== "completed").length)} detail="With a practical three-step plan" />
        <Summary icon={Award} label="Completed" value={String(completed)} detail="Certification can be attached later" />
      </section>

      {canManage && <Panel><PanelHeader title="Create a learning goal" description="Assign a company course to one person or the wider team. A practical plan is generated from the dates." /><form action={createLearningGoalAction} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><label><span className={labelClass}>What are we learning?</span><input className={inputClass} name="title" required placeholder="e.g. Secure API Design" /></label><label><span className={labelClass}>Course provider</span><input className={inputClass} name="provider" placeholder="Provider or internal facilitator" /></label><label className="sm:col-span-2"><span className={labelClass}>Why this matters</span><textarea className={textareaClass} name="description" placeholder="Expected capability and work outcome" /></label><label><span className={labelClass}>Course URL</span><input className={inputClass} name="courseUrl" type="url" placeholder="https://" /></label><label><span className={labelClass}>Assign team members</span><select className={`${inputClass} h-28 py-2`} name="assigneeIds" multiple required>{team.map((user) => <option key={user.id} value={user.id}>{user.displayName} · {user.role.replaceAll("_", " ")}</option>)}</select><span className="mt-1 block text-[10px] text-ktf-gray-500">Use Ctrl/Cmd to choose more than one person.</span></label><label><span className={labelClass}>Start date</span><input className={inputClass} name="startDate" type="date" /></label><label><span className={labelClass}>Target date</span><input className={inputClass} name="dueDate" type="date" /></label><div className="sm:col-span-2"><SubmitButton className={primaryButtonClass} pendingLabel="Creating plan…"><Plus className="h-4 w-4" /> Create learning plan</SubmitButton></div></form></Panel>}

      <div className="grid gap-5 xl:grid-cols-2">
        {goals.map((goal) => <Panel key={goal.id}><PanelHeader title={goal.title} description={[goal.provider, goal.dueDate ? `Target ${formatAdminDate(goal.dueDate)}` : ""].filter(Boolean).join(" · ")} action={<StatusPill value={goal.state} />} /><div className="p-5 sm:p-6"><p className="text-sm leading-6 text-ktf-gray-600">{goal.description || "No learning outcome has been added yet."}</p>{goal.courseUrl && <Link href={goal.courseUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ktf-blue">Open course <ExternalLink className="h-3.5 w-3.5" /></Link>}<div className="mt-5 space-y-4">{goal.assignments.map((assignment) => { const employee = snapshot.users.find((user) => user.id === assignment.userId); return <article key={assignment.id} className="rounded-lg border border-ktf-gray-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-ktf-navy">{employee?.displayName ?? "Team member"}</p><p className="mt-1 text-[11px] text-ktf-gray-500">{assignment.progress}% complete</p></div><StatusPill value={assignment.status} /></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ktf-gray-100"><div className="h-full bg-ktf-blue" style={{ width: `${assignment.progress}%` }} /></div><ol className="mt-4 space-y-2">{assignment.plan.map((step, index) => <li key={`${step.title}-${index}`} className="flex items-start gap-2 text-[11px] leading-5 text-ktf-gray-600"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ktf-blue/10 text-[9px] font-bold text-ktf-blue">{index + 1}</span><span>{step.title}{step.targetDate && <span className="ml-1 text-ktf-gray-400">· {formatAdminDate(step.targetDate)}</span>}</span></li>)}</ol><form action={updateLearningProgressAction} className="mt-4 flex gap-2"><input type="hidden" name="assignmentId" value={assignment.id} /><label className="sr-only" htmlFor={`progress-${assignment.id}`}>Progress</label><input id={`progress-${assignment.id}`} className={`${inputClass} flex-1`} type="number" name="progress" min="0" max="100" defaultValue={assignment.progress} /><SubmitButton className="h-10 rounded-lg border border-ktf-gray-200 px-3 text-[11px] font-semibold" pendingLabel="Updating…">Update</SubmitButton></form>{assignment.certificationUploadedAt ? <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-700"><Award className="h-4 w-4" /> Certification recorded {formatAdminDate(assignment.certificationUploadedAt)}</p> : <CertificationUploader assignmentId={assignment.id} />}</article>; })}</div></div></Panel>)}
        {goals.length === 0 && <div className="rounded-lg border border-dashed border-ktf-gray-300 bg-white p-12 text-center xl:col-span-2"><BookOpenCheck className="mx-auto h-6 w-6 text-ktf-gray-400" /><p className="mt-3 text-sm font-semibold text-ktf-navy">No learning goals yet</p><p className="mt-1 text-xs text-ktf-gray-500">The first plan will appear here for everyone assigned to it.</p></div>}
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: string; detail: string }) {
  return <article className="bt-card-motion rounded-lg border border-ktf-gray-200 bg-white p-5 shadow-card"><Icon className="h-5 w-5 text-ktf-blue" /><p className="mt-4 text-xs font-semibold text-ktf-gray-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-ktf-navy">{value}</p><p className="mt-1 text-xs text-ktf-gray-500">{detail}</p></article>;
}
