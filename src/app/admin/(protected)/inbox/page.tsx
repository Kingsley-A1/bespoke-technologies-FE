import { Inbox, Mail, MoveRight } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate } from "@/features/admin/billing/money";
import { EmptyPanel, Panel, PanelHeader, primaryButtonClass, StatusPill } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { convertSubmissionAction } from "../actions";

export default async function AdminInboxPage() {
  await requireAdminPermission("crm.manage");
  const snapshot = await getAdminSnapshot();
  const fresh = snapshot.submissions.filter((submission) => submission.state === "new");
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700"><Inbox className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-blue-950">{fresh.length} new website {fresh.length === 1 ? "enquiry" : "enquiries"}</h2><p className="mt-1 text-xs leading-5 text-blue-700">Convert qualified enquiries into the sales pipeline without retyping contact details.</p></div></div></section>
      <Panel><PanelHeader title="Contact submissions" description="Website enquiries arrive here as operational records." />{snapshot.submissions.length === 0 ? <EmptyPanel title="Inbox is clear" body="New website contact submissions will appear here." /> : <div className="divide-y divide-slate-100">{snapshot.submissions.map((submission) => <article key={submission.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-950">{submission.company || submission.name}</h3><p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Mail className="h-3.5 w-3.5" /> {submission.name} · {submission.email}</p></div><div className="flex items-center gap-2"><span className="text-[11px] text-slate-400">{formatAdminDate(submission.submittedAt)}</span><StatusPill value={submission.state} /></div></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{submission.message}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Requested: <span className="font-semibold text-slate-700">{submission.service || "General enquiry"}</span></p>{submission.state === "new" && <form action={convertSubmissionAction}><input type="hidden" name="id" value={submission.id} /><button className={primaryButtonClass}>Convert to lead <MoveRight className="h-4 w-4" /></button></form>}</div></article>)}</div>}</Panel>
    </div>
  );
}

